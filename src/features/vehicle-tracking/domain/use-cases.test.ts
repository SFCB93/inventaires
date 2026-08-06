import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ok, err } from '@/shared/domain/result'
import {
  linkDeviceUseCase,
  revokeDeviceUseCase,
  revokeDeviceAndDeleteDataUseCase,
  getVehicleDetailUseCase,
  receiveVehicleStatusUseCase,
  getFleetStatusUseCase,
  listUnlinkedInventoriesUseCase,
  getVehiclePositionHistoryUseCase,
} from './use-cases'
import { vehicleTrackingRepository } from '../data/repository'
import { inventoryRepository } from '@/features/inventories/data/repository'
import { generateApiKey, hashApiKey } from './api-key'
import { haversineDistanceMeters } from './geo'
import { sendPoweredAlertIfDue } from './powered-alert-use-case'
import { DEDUP_DISTANCE_METERS, MIN_PING_INTERVAL_SECONDS, MAX_TIMESTAMP_DRIFT_SECONDS, MS_PER_SECOND, MS_PER_HOUR, TIME_RANGE_HOURS, ERROR_UNAUTHORIZED, ERROR_RATE_LIMITED } from './constants'

vi.mock('../data/repository', () => ({
  vehicleTrackingRepository: {
    saveDeviceKey: vi.fn(),
    revokeDeviceKey: vi.fn(),
    findDeviceByKeyHash: vi.fn(),
    hasDevice: vi.fn(),
    listLinkedInventoryIds: vi.fn(),
    getVehicleStatus: vi.fn(),
    touchLastSeen: vi.fn(),
    recordVehiclePoint: vi.fn(),
    listFleetStatus: vi.fn(),
    listInventoryNames: vi.fn(),
    listPositionHistory: vi.fn(),
    deleteVehicleData: vi.fn(),
  },
}))

vi.mock('@/features/inventories/data/repository', () => ({
  inventoryRepository: {
    checkInventoryOwnership: vi.fn(),
    listInventories: vi.fn(),
  },
}))

vi.mock('./api-key', () => ({
  generateApiKey: vi.fn(),
  hashApiKey: vi.fn(),
}))

vi.mock('./geo', () => ({
  haversineDistanceMeters: vi.fn(),
}))

vi.mock('./powered-alert-use-case', () => ({
  sendPoweredAlertIfDue: vi.fn().mockResolvedValue(undefined),
}))

const ASSOC_ID = 'assoc-1'
const INV_ID = 'inv-1'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('linkDeviceUseCase', () => {
  it('génère et sauvegarde une clé si le véhicule appartient à l’association', async () => {
    vi.mocked(inventoryRepository.checkInventoryOwnership).mockResolvedValue(ok(undefined))
    vi.mocked(generateApiKey).mockReturnValue('raw-key')
    vi.mocked(hashApiKey).mockReturnValue('hashed-key')
    vi.mocked(vehicleTrackingRepository.saveDeviceKey).mockResolvedValue(ok(undefined))

    const result = await linkDeviceUseCase(INV_ID, ASSOC_ID)

    expect(result).toEqual(ok({ inventoryId: INV_ID, apiKey: 'raw-key' }))
    expect(vehicleTrackingRepository.saveDeviceKey).toHaveBeenCalledWith(INV_ID, ASSOC_ID, 'hashed-key')
  })

  it('ne génère pas de clé si la vérification d’appartenance échoue', async () => {
    vi.mocked(inventoryRepository.checkInventoryOwnership).mockResolvedValue(err('Accès non autorisé.'))

    const result = await linkDeviceUseCase(INV_ID, ASSOC_ID)

    expect(result).toEqual(err('Accès non autorisé.'))
    expect(vehicleTrackingRepository.saveDeviceKey).not.toHaveBeenCalled()
  })
})

describe('revokeDeviceUseCase', () => {
  it('révoque la clé si le véhicule appartient à l’association', async () => {
    vi.mocked(inventoryRepository.checkInventoryOwnership).mockResolvedValue(ok(undefined))
    vi.mocked(vehicleTrackingRepository.revokeDeviceKey).mockResolvedValue(ok(undefined))

    const result = await revokeDeviceUseCase(INV_ID, ASSOC_ID)

    expect(result).toEqual(ok(undefined))
    expect(vehicleTrackingRepository.revokeDeviceKey).toHaveBeenCalledWith(INV_ID)
  })

  it('ne révoque rien si la vérification d’appartenance échoue', async () => {
    vi.mocked(inventoryRepository.checkInventoryOwnership).mockResolvedValue(err('Accès non autorisé.'))

    const result = await revokeDeviceUseCase(INV_ID, ASSOC_ID)

    expect(result).toEqual(err('Accès non autorisé.'))
    expect(vehicleTrackingRepository.revokeDeviceKey).not.toHaveBeenCalled()
  })
})

describe('revokeDeviceAndDeleteDataUseCase', () => {
  it('révoque la clé puis supprime les données si le véhicule appartient à l’association', async () => {
    vi.mocked(inventoryRepository.checkInventoryOwnership).mockResolvedValue(ok(undefined))
    vi.mocked(vehicleTrackingRepository.revokeDeviceKey).mockResolvedValue(ok(undefined))
    vi.mocked(vehicleTrackingRepository.deleteVehicleData).mockResolvedValue(ok(undefined))

    const result = await revokeDeviceAndDeleteDataUseCase(INV_ID, ASSOC_ID)

    expect(result).toEqual(ok(undefined))
    expect(vehicleTrackingRepository.revokeDeviceKey).toHaveBeenCalledWith(INV_ID)
    expect(vehicleTrackingRepository.deleteVehicleData).toHaveBeenCalledWith(INV_ID)
  })

  it('ne supprime rien si la vérification d’appartenance échoue', async () => {
    vi.mocked(inventoryRepository.checkInventoryOwnership).mockResolvedValue(err('Accès non autorisé.'))

    const result = await revokeDeviceAndDeleteDataUseCase(INV_ID, ASSOC_ID)

    expect(result).toEqual(err('Accès non autorisé.'))
    expect(vehicleTrackingRepository.revokeDeviceKey).not.toHaveBeenCalled()
    expect(vehicleTrackingRepository.deleteVehicleData).not.toHaveBeenCalled()
  })

  it('ne supprime pas les données si la révocation de la clé échoue', async () => {
    vi.mocked(inventoryRepository.checkInventoryOwnership).mockResolvedValue(ok(undefined))
    vi.mocked(vehicleTrackingRepository.revokeDeviceKey).mockResolvedValue(err('Erreur Firestore.'))

    const result = await revokeDeviceAndDeleteDataUseCase(INV_ID, ASSOC_ID)

    expect(result).toEqual(err('Erreur Firestore.'))
    expect(vehicleTrackingRepository.deleteVehicleData).not.toHaveBeenCalled()
  })
})

describe('getVehicleDetailUseCase', () => {
  it('retourne isLinked=true si un device est associé', async () => {
    vi.mocked(inventoryRepository.checkInventoryOwnership).mockResolvedValue(ok(undefined))
    vi.mocked(vehicleTrackingRepository.listInventoryNames).mockResolvedValue(ok(new Map([[INV_ID, 'Fourgon']])))
    vi.mocked(vehicleTrackingRepository.hasDevice).mockResolvedValue(ok(true))

    const result = await getVehicleDetailUseCase(INV_ID, ASSOC_ID)

    expect(result).toEqual(ok({ name: 'Fourgon', isLinked: true }))
  })

  it('retourne isLinked=false si aucun device n’est associé', async () => {
    vi.mocked(inventoryRepository.checkInventoryOwnership).mockResolvedValue(ok(undefined))
    vi.mocked(vehicleTrackingRepository.listInventoryNames).mockResolvedValue(ok(new Map([[INV_ID, 'Fourgon']])))
    vi.mocked(vehicleTrackingRepository.hasDevice).mockResolvedValue(ok(false))

    const result = await getVehicleDetailUseCase(INV_ID, ASSOC_ID)

    expect(result).toEqual(ok({ name: 'Fourgon', isLinked: false }))
  })

  it('retourne une erreur si le véhicule est introuvable', async () => {
    vi.mocked(inventoryRepository.checkInventoryOwnership).mockResolvedValue(ok(undefined))
    vi.mocked(vehicleTrackingRepository.listInventoryNames).mockResolvedValue(ok(new Map()))

    const result = await getVehicleDetailUseCase(INV_ID, ASSOC_ID)

    expect(result).toEqual(err('Véhicule introuvable.'))
    expect(vehicleTrackingRepository.hasDevice).not.toHaveBeenCalled()
  })

  it('propage l’erreur d’appartenance sans poursuivre', async () => {
    vi.mocked(inventoryRepository.checkInventoryOwnership).mockResolvedValue(err('Accès non autorisé.'))

    const result = await getVehicleDetailUseCase(INV_ID, ASSOC_ID)

    expect(result).toEqual(err('Accès non autorisé.'))
    expect(vehicleTrackingRepository.listInventoryNames).not.toHaveBeenCalled()
  })
})

describe('receiveVehicleStatusUseCase', () => {
  const baseInput = { apiKey: 'raw-key', lat: 48.85, lng: 2.35, isCircuitCut: false, timestamp: new Date('2026-01-01T12:00:00Z') }

  beforeEach(() => {
    vi.mocked(hashApiKey).mockReturnValue('hashed-key')
  })

  it('rejette une latitude hors bornes', async () => {
    const result = await receiveVehicleStatusUseCase({ ...baseInput, lat: 999 })
    expect(result).toEqual(err('Latitude invalide.'))
    expect(vehicleTrackingRepository.findDeviceByKeyHash).not.toHaveBeenCalled()
  })

  it('rejette une longitude hors bornes', async () => {
    const result = await receiveVehicleStatusUseCase({ ...baseInput, lng: -999 })
    expect(result).toEqual(err('Longitude invalide.'))
  })

  it('rejette un horodatage invalide', async () => {
    const result = await receiveVehicleStatusUseCase({ ...baseInput, timestamp: new Date('n’importe quoi') })
    expect(result).toEqual(err('Horodatage invalide.'))
  })

  it('rejette un horodatage trop éloigné de l’horloge serveur (dérive)', async () => {
    const farFuture = new Date(baseInput.timestamp.getTime() + (MAX_TIMESTAMP_DRIFT_SECONDS + 1) * MS_PER_SECOND)
    const result = await receiveVehicleStatusUseCase({ ...baseInput, timestamp: farFuture }, baseInput.timestamp)
    expect(result).toEqual(err('Horodatage invalide.'))
    expect(vehicleTrackingRepository.findDeviceByKeyHash).not.toHaveBeenCalled()
  })

  it('rejette une clé API inconnue', async () => {
    vi.mocked(vehicleTrackingRepository.findDeviceByKeyHash).mockResolvedValue(ok(null))

    const result = await receiveVehicleStatusUseCase(baseInput, baseInput.timestamp)

    expect(result).toEqual(err(ERROR_UNAUTHORIZED))
    expect(vehicleTrackingRepository.getVehicleStatus).not.toHaveBeenCalled()
  })

  it('rejette si l’inventaire n’appartient plus à l’association du device', async () => {
    vi.mocked(vehicleTrackingRepository.findDeviceByKeyHash).mockResolvedValue(ok({ inventoryId: INV_ID, associationId: ASSOC_ID }))
    vi.mocked(inventoryRepository.checkInventoryOwnership).mockResolvedValue(err('Inventaire introuvable.'))

    const result = await receiveVehicleStatusUseCase(baseInput, baseInput.timestamp)

    expect(result).toEqual(err(ERROR_UNAUTHORIZED))
    expect(vehicleTrackingRepository.getVehicleStatus).not.toHaveBeenCalled()
  })

  it('enregistre directement un nouveau point pour un premier ping', async () => {
    vi.mocked(vehicleTrackingRepository.findDeviceByKeyHash).mockResolvedValue(ok({ inventoryId: INV_ID, associationId: ASSOC_ID }))
    vi.mocked(inventoryRepository.checkInventoryOwnership).mockResolvedValue(ok(undefined))
    vi.mocked(vehicleTrackingRepository.getVehicleStatus).mockResolvedValue(ok(null))
    vi.mocked(vehicleTrackingRepository.recordVehiclePoint).mockResolvedValue(ok(undefined))

    const result = await receiveVehicleStatusUseCase(baseInput, baseInput.timestamp)

    expect(result).toEqual(ok(undefined))
    expect(vehicleTrackingRepository.recordVehiclePoint).toHaveBeenCalledWith({
      inventoryId: INV_ID,
      associationId: ASSOC_ID,
      lat: baseInput.lat,
      lng: baseInput.lng,
      isCircuitCut: baseInput.isCircuitCut,
      timestamp: baseInput.timestamp,
    })
    expect(vehicleTrackingRepository.touchLastSeen).not.toHaveBeenCalled()
  })

  it('ignore un ping dont l’horodatage est antérieur ou égal au dernier reçu', async () => {
    vi.mocked(vehicleTrackingRepository.findDeviceByKeyHash).mockResolvedValue(ok({ inventoryId: INV_ID, associationId: ASSOC_ID }))
    vi.mocked(inventoryRepository.checkInventoryOwnership).mockResolvedValue(ok(undefined))
    vi.mocked(vehicleTrackingRepository.getVehicleStatus).mockResolvedValue(ok({
      associationId: ASSOC_ID, lat: 48.85, lng: 2.35, isCircuitCut: false,
      stableSince: new Date('2026-01-01T10:00:00Z'), lastSeenAt: baseInput.timestamp, poweredAlertSent: false,
    }))

    const result = await receiveVehicleStatusUseCase(baseInput, baseInput.timestamp)

    expect(result).toEqual(ok(undefined))
    expect(vehicleTrackingRepository.recordVehiclePoint).not.toHaveBeenCalled()
    expect(vehicleTrackingRepository.touchLastSeen).not.toHaveBeenCalled()
  })

  it('rejette un ping trop rapproché du précédent (débit anormal)', async () => {
    const lastSeenAt = new Date(baseInput.timestamp.getTime() - (MIN_PING_INTERVAL_SECONDS - 1) * MS_PER_SECOND)
    vi.mocked(vehicleTrackingRepository.findDeviceByKeyHash).mockResolvedValue(ok({ inventoryId: INV_ID, associationId: ASSOC_ID }))
    vi.mocked(inventoryRepository.checkInventoryOwnership).mockResolvedValue(ok(undefined))
    vi.mocked(vehicleTrackingRepository.getVehicleStatus).mockResolvedValue(ok({
      associationId: ASSOC_ID, lat: 48.85, lng: 2.35, isCircuitCut: false,
      stableSince: lastSeenAt, lastSeenAt, poweredAlertSent: false,
    }))

    const result = await receiveVehicleStatusUseCase(baseInput, baseInput.timestamp)

    expect(result).toEqual(err(ERROR_RATE_LIMITED))
    expect(vehicleTrackingRepository.recordVehiclePoint).not.toHaveBeenCalled()
  })

  it('rejette un ping trop rapproché même si le timestamp client simule un grand écart (anti-contournement)', async () => {
    // Deux requêtes réelles quasi simultanées ; seul le timestamp client prétend un écart > MIN_PING_INTERVAL_SECONDS.
    const realNow = baseInput.timestamp
    const forgedClientTimestamp = new Date(realNow.getTime() + (MIN_PING_INTERVAL_SECONDS + 1) * MS_PER_SECOND)
    const lastSeenAt = new Date(realNow.getTime() - 1 * MS_PER_SECOND)
    vi.mocked(vehicleTrackingRepository.findDeviceByKeyHash).mockResolvedValue(ok({ inventoryId: INV_ID, associationId: ASSOC_ID }))
    vi.mocked(inventoryRepository.checkInventoryOwnership).mockResolvedValue(ok(undefined))
    vi.mocked(vehicleTrackingRepository.getVehicleStatus).mockResolvedValue(ok({
      associationId: ASSOC_ID, lat: 48.85, lng: 2.35, isCircuitCut: false,
      stableSince: lastSeenAt, lastSeenAt, poweredAlertSent: false,
    }))

    const result = await receiveVehicleStatusUseCase({ ...baseInput, timestamp: forgedClientTimestamp }, realNow)

    expect(result).toEqual(err(ERROR_RATE_LIMITED))
    expect(vehicleTrackingRepository.recordVehiclePoint).not.toHaveBeenCalled()
  })

  it('ignore un ping identique (position proche et même état) et rafraîchit seulement lastSeenAt', async () => {
    const stableSince = new Date('2026-01-01T09:00:00Z')
    const lastSeenAt = new Date(baseInput.timestamp.getTime() - (MIN_PING_INTERVAL_SECONDS + 1) * MS_PER_SECOND)
    vi.mocked(vehicleTrackingRepository.findDeviceByKeyHash).mockResolvedValue(ok({ inventoryId: INV_ID, associationId: ASSOC_ID }))
    vi.mocked(inventoryRepository.checkInventoryOwnership).mockResolvedValue(ok(undefined))
    vi.mocked(vehicleTrackingRepository.getVehicleStatus).mockResolvedValue(ok({
      associationId: ASSOC_ID, lat: 48.85, lng: 2.35, isCircuitCut: false,
      stableSince, lastSeenAt, poweredAlertSent: false,
    }))
    vi.mocked(haversineDistanceMeters).mockReturnValue(DEDUP_DISTANCE_METERS - 1)
    vi.mocked(vehicleTrackingRepository.touchLastSeen).mockResolvedValue(ok(undefined))

    const result = await receiveVehicleStatusUseCase(baseInput, baseInput.timestamp)

    expect(result).toEqual(ok(undefined))
    expect(vehicleTrackingRepository.touchLastSeen).toHaveBeenCalledWith(INV_ID, baseInput.timestamp)
    expect(vehicleTrackingRepository.recordVehiclePoint).not.toHaveBeenCalled()
    expect(sendPoweredAlertIfDue).toHaveBeenCalledWith({
      inventoryId: INV_ID,
      associationId: ASSOC_ID,
      stableSince,
      isCircuitCut: baseInput.isCircuitCut,
      alreadySent: false,
      now: baseInput.timestamp,
    })
  })

  it('ne redéclenche pas la vérification d’alerte alimentation si elle a déjà été envoyée', async () => {
    const stableSince = new Date('2026-01-01T09:00:00Z')
    const lastSeenAt = new Date(baseInput.timestamp.getTime() - (MIN_PING_INTERVAL_SECONDS + 1) * MS_PER_SECOND)
    vi.mocked(vehicleTrackingRepository.findDeviceByKeyHash).mockResolvedValue(ok({ inventoryId: INV_ID, associationId: ASSOC_ID }))
    vi.mocked(inventoryRepository.checkInventoryOwnership).mockResolvedValue(ok(undefined))
    vi.mocked(vehicleTrackingRepository.getVehicleStatus).mockResolvedValue(ok({
      associationId: ASSOC_ID, lat: 48.85, lng: 2.35, isCircuitCut: false,
      stableSince, lastSeenAt, poweredAlertSent: true,
    }))
    vi.mocked(haversineDistanceMeters).mockReturnValue(DEDUP_DISTANCE_METERS - 1)
    vi.mocked(vehicleTrackingRepository.touchLastSeen).mockResolvedValue(ok(undefined))

    await receiveVehicleStatusUseCase(baseInput, baseInput.timestamp)

    expect(sendPoweredAlertIfDue).toHaveBeenCalledWith(expect.objectContaining({ alreadySent: true }))
  })

  it('enregistre un nouveau point si la position a significativement changé', async () => {
    const lastSeenAt = new Date(baseInput.timestamp.getTime() - (MIN_PING_INTERVAL_SECONDS + 1) * MS_PER_SECOND)
    vi.mocked(vehicleTrackingRepository.findDeviceByKeyHash).mockResolvedValue(ok({ inventoryId: INV_ID, associationId: ASSOC_ID }))
    vi.mocked(inventoryRepository.checkInventoryOwnership).mockResolvedValue(ok(undefined))
    vi.mocked(vehicleTrackingRepository.getVehicleStatus).mockResolvedValue(ok({
      associationId: ASSOC_ID, lat: 48.85, lng: 2.35, isCircuitCut: false,
      stableSince: lastSeenAt, lastSeenAt, poweredAlertSent: false,
    }))
    vi.mocked(haversineDistanceMeters).mockReturnValue(DEDUP_DISTANCE_METERS + 1)
    vi.mocked(vehicleTrackingRepository.recordVehiclePoint).mockResolvedValue(ok(undefined))

    const result = await receiveVehicleStatusUseCase(baseInput, baseInput.timestamp)

    expect(result).toEqual(ok(undefined))
    expect(vehicleTrackingRepository.recordVehiclePoint).toHaveBeenCalled()
    expect(vehicleTrackingRepository.touchLastSeen).not.toHaveBeenCalled()
    expect(sendPoweredAlertIfDue).not.toHaveBeenCalled()
  })

  it('enregistre un nouveau point si seul l’état du coupe-circuit a changé', async () => {
    const lastSeenAt = new Date(baseInput.timestamp.getTime() - (MIN_PING_INTERVAL_SECONDS + 1) * MS_PER_SECOND)
    vi.mocked(vehicleTrackingRepository.findDeviceByKeyHash).mockResolvedValue(ok({ inventoryId: INV_ID, associationId: ASSOC_ID }))
    vi.mocked(inventoryRepository.checkInventoryOwnership).mockResolvedValue(ok(undefined))
    vi.mocked(vehicleTrackingRepository.getVehicleStatus).mockResolvedValue(ok({
      associationId: ASSOC_ID, lat: baseInput.lat, lng: baseInput.lng, isCircuitCut: true,
      stableSince: lastSeenAt, lastSeenAt, poweredAlertSent: false,
    }))
    vi.mocked(haversineDistanceMeters).mockReturnValue(0)
    vi.mocked(vehicleTrackingRepository.recordVehiclePoint).mockResolvedValue(ok(undefined))

    const result = await receiveVehicleStatusUseCase(baseInput, baseInput.timestamp)

    expect(result).toEqual(ok(undefined))
    expect(vehicleTrackingRepository.recordVehiclePoint).toHaveBeenCalled()
    expect(sendPoweredAlertIfDue).not.toHaveBeenCalled()
  })
})

describe('getFleetStatusUseCase', () => {
  it('retourne une liste vide si aucun device n’est associé', async () => {
    vi.mocked(vehicleTrackingRepository.listLinkedInventoryIds).mockResolvedValue(ok(new Set()))

    const result = await getFleetStatusUseCase(ASSOC_ID)

    expect(result).toEqual(ok([]))
    expect(vehicleTrackingRepository.listInventoryNames).not.toHaveBeenCalled()
  })

  it('retourne des champs nuls pour un véhicule lié qui n’a jamais émis', async () => {
    vi.mocked(vehicleTrackingRepository.listLinkedInventoryIds).mockResolvedValue(ok(new Set([INV_ID])))
    vi.mocked(vehicleTrackingRepository.listInventoryNames).mockResolvedValue(ok(new Map([[INV_ID, 'Fourgon']])))
    vi.mocked(vehicleTrackingRepository.listFleetStatus).mockResolvedValue(ok([]))

    const result = await getFleetStatusUseCase(ASSOC_ID)

    expect(result).toEqual(ok([{
      inventoryId: INV_ID, name: 'Fourgon', isCircuitCut: null, position: null, stableSince: null, lastSeenAt: null,
    }]))
  })

  it('trie les véhicules par nom', async () => {
    vi.mocked(vehicleTrackingRepository.listLinkedInventoryIds).mockResolvedValue(ok(new Set(['inv-z', 'inv-a'])))
    vi.mocked(vehicleTrackingRepository.listInventoryNames).mockResolvedValue(ok(new Map([['inv-z', 'Zorro'], ['inv-a', 'Alpha']])))
    vi.mocked(vehicleTrackingRepository.listFleetStatus).mockResolvedValue(ok([]))

    const result = await getFleetStatusUseCase(ASSOC_ID)

    expect(result.ok && result.value.map((v) => v.name)).toEqual(['Alpha', 'Zorro'])
  })

  it('propage une erreur du repository', async () => {
    vi.mocked(vehicleTrackingRepository.listLinkedInventoryIds).mockResolvedValue(err('Firestore indisponible.'))

    const result = await getFleetStatusUseCase(ASSOC_ID)

    expect(result).toEqual(err('Firestore indisponible.'))
  })
})

describe('listUnlinkedInventoriesUseCase', () => {
  it('exclut les inventaires déjà associés à un device', async () => {
    vi.mocked(inventoryRepository.listInventories).mockResolvedValue(ok([
      { id: 'inv-a', name: 'Alpha', associationId: ASSOC_ID, compartmentCount: 0 },
      { id: 'inv-b', name: 'Bravo', associationId: ASSOC_ID, compartmentCount: 0 },
    ]))
    vi.mocked(vehicleTrackingRepository.listLinkedInventoryIds).mockResolvedValue(ok(new Set(['inv-a'])))

    const result = await listUnlinkedInventoriesUseCase(ASSOC_ID)

    expect(result).toEqual(ok([{ inventoryId: 'inv-b', name: 'Bravo' }]))
  })

  it('trie les inventaires candidats par nom', async () => {
    vi.mocked(inventoryRepository.listInventories).mockResolvedValue(ok([
      { id: 'inv-z', name: 'Zorro', associationId: ASSOC_ID, compartmentCount: 0 },
      { id: 'inv-a', name: 'Alpha', associationId: ASSOC_ID, compartmentCount: 0 },
    ]))
    vi.mocked(vehicleTrackingRepository.listLinkedInventoryIds).mockResolvedValue(ok(new Set()))

    const result = await listUnlinkedInventoriesUseCase(ASSOC_ID)

    expect(result.ok && result.value.map((v) => v.name)).toEqual(['Alpha', 'Zorro'])
  })
})

describe('getVehiclePositionHistoryUseCase', () => {
  it('propage l’erreur d’appartenance sans interroger l’historique', async () => {
    vi.mocked(inventoryRepository.checkInventoryOwnership).mockResolvedValue(err('Accès non autorisé.'))

    const result = await getVehiclePositionHistoryUseCase(INV_ID, ASSOC_ID, '24h')

    expect(result).toEqual(err('Accès non autorisé.'))
    expect(vehicleTrackingRepository.listPositionHistory).not.toHaveBeenCalled()
  })

  it('calcule la date de début selon la plage demandée', async () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-01-08T00:00:00Z'))
    vi.mocked(inventoryRepository.checkInventoryOwnership).mockResolvedValue(ok(undefined))
    vi.mocked(vehicleTrackingRepository.listPositionHistory).mockResolvedValue(ok([]))

    await getVehiclePositionHistoryUseCase(INV_ID, ASSOC_ID, '7d')

    const expectedSince = new Date(Date.now() - TIME_RANGE_HOURS['7d'] * MS_PER_HOUR)
    expect(vehicleTrackingRepository.listPositionHistory).toHaveBeenCalledWith(INV_ID, expectedSince)
    vi.useRealTimers()
  })
})
