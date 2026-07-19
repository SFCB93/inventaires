import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listControlsUseCase, getControlDetailUseCase, getActiveAlertsUseCase, getInventoryActiveAlertsUseCase,
  createCorrectionUseCase, createAnomalyCorrectionUseCase,
  createPublicCorrectionUseCase, createPublicAnomalyCorrectionUseCase,
} from './use-cases'
import { controlsRepository } from '../data/repository'
import { getActiveAlerts } from '@/shared/data/alerts-repository'
import type { AuthenticatedUser } from '@/shared/lib/auth'
import type { CreateCorrectionInput, CreateAnomalyCorrectionInput } from './types'

vi.mock('@/shared/data/alerts-repository', () => ({
  getActiveAlerts: vi.fn(),
}))

vi.mock('../data/repository', () => ({
  controlsRepository: {
    listControls: vi.fn(),
    getControlDetail: vi.fn(),
    getActiveAlerts: vi.fn(),
    createCorrection: vi.fn(),
    getAlertThreshold: vi.fn(),
    createAnomalyCorrection: vi.fn(),
    verifyInventoryOwnership: vi.fn(),
    getInventoryAssociationId: vi.fn(),
  },
}))

const mockUser: AuthenticatedUser = { uid: 'user-1', associationId: 'asso-1', associationIds: ['asso-1'], role: 'admin' }

const mockInput: CreateCorrectionInput = {
  itemId: 'item-1',
  inventoryId: 'inv-1',
  associationId: 'asso-1',
  newExpiryDate: '2027-06-01',
  correctedBy: 'user-1',
}

function dateInDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

describe('listControlsUseCase', () => {
  beforeEach(() => vi.clearAllMocks())

  it("retourne une erreur si l'associationId est vide", async () => {
    const result = await listControlsUseCase('')
    expect(result.ok).toBe(false)
    expect(controlsRepository.listControls).not.toHaveBeenCalled()
  })

  it("délègue au repository avec l'associationId", async () => {
    vi.mocked(controlsRepository.listControls).mockResolvedValue({ ok: true, value: [] })
    await listControlsUseCase('asso-1')
    expect(controlsRepository.listControls).toHaveBeenCalledWith('asso-1')
  })

  it("propage l'erreur du repository", async () => {
    vi.mocked(controlsRepository.listControls).mockResolvedValue({ ok: false, error: 'Firestore indisponible' })
    const result = await listControlsUseCase('asso-1')
    expect(result.ok).toBe(false)
  })
})

describe('getControlDetailUseCase', () => {
  beforeEach(() => vi.clearAllMocks())

  it("retourne une erreur si le controlId est vide", async () => {
    const result = await getControlDetailUseCase('', 'asso-1')
    expect(result.ok).toBe(false)
    expect(controlsRepository.getControlDetail).not.toHaveBeenCalled()
  })

  it("délègue au repository avec controlId et associationId", async () => {
    vi.mocked(controlsRepository.getControlDetail).mockResolvedValue({ ok: false, error: 'introuvable' })
    await getControlDetailUseCase('ctrl-1', 'asso-1')
    expect(controlsRepository.getControlDetail).toHaveBeenCalledWith('ctrl-1', 'asso-1')
  })
})

describe('getActiveAlertsUseCase', () => {
  beforeEach(() => vi.clearAllMocks())

  it("retourne une erreur si l'associationId est vide", async () => {
    const result = await getActiveAlertsUseCase('')
    expect(result.ok).toBe(false)
    expect(getActiveAlerts).not.toHaveBeenCalled()
  })
})

describe('getInventoryActiveAlertsUseCase', () => {
  beforeEach(() => vi.clearAllMocks())

  it("retourne une erreur si l'inventoryId est vide", async () => {
    const result = await getInventoryActiveAlertsUseCase('', 'asso-1')
    expect(result.ok).toBe(false)
    expect(getActiveAlerts).not.toHaveBeenCalled()
  })

  it("retourne une erreur si l'associationId est vide", async () => {
    const result = await getInventoryActiveAlertsUseCase('inv-1', '')
    expect(result.ok).toBe(false)
    expect(getActiveAlerts).not.toHaveBeenCalled()
  })

  it('scope les alertes actives sur cet inventaire', async () => {
    vi.mocked(getActiveAlerts).mockResolvedValue({ ok: true, value: { anomalies: [], expired: [], atRisk: [] } })
    await getInventoryActiveAlertsUseCase('inv-1', 'asso-1', 30)
    expect(getActiveAlerts).toHaveBeenCalledWith('asso-1', 30, true, 'inv-1')
  })
})

describe('createCorrectionUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(controlsRepository.getAlertThreshold).mockResolvedValue(30)
  })

  it("retourne une erreur si la date est vide", async () => {
    const result = await createCorrectionUseCase({ ...mockInput, newExpiryDate: '' }, mockUser)
    expect(result.ok).toBe(false)
    expect(controlsRepository.createCorrection).not.toHaveBeenCalled()
  })

  it("retourne une erreur si la date est dans moins de 30 jours", async () => {
    const result = await createCorrectionUseCase({ ...mockInput, newExpiryDate: dateInDays(15) }, mockUser)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('J+30')
    expect(controlsRepository.createCorrection).not.toHaveBeenCalled()
  })

  it("retourne une erreur si la date est exactement à J+30", async () => {
    const result = await createCorrectionUseCase({ ...mockInput, newExpiryDate: dateInDays(30) }, mockUser)
    expect(result.ok).toBe(false)
    expect(controlsRepository.createCorrection).not.toHaveBeenCalled()
  })

  it("retourne une erreur si l'associationId ne correspond pas à l'utilisateur", async () => {
    const result = await createCorrectionUseCase({ ...mockInput, associationId: 'autre-asso' }, mockUser)
    expect(result.ok).toBe(false)
    expect(controlsRepository.createCorrection).not.toHaveBeenCalled()
  })

  it("enregistre la correction si la date est > J+30 et l'association est correcte", async () => {
    vi.mocked(controlsRepository.createCorrection).mockResolvedValue({ ok: true, value: undefined })
    const result = await createCorrectionUseCase(mockInput, mockUser)
    expect(result.ok).toBe(true)
    expect(controlsRepository.createCorrection).toHaveBeenCalledWith(mockInput)
  })

  it("propage l'erreur du repository si la sauvegarde échoue", async () => {
    vi.mocked(controlsRepository.createCorrection).mockResolvedValue({ ok: false, error: 'Erreur Firestore' })
    const result = await createCorrectionUseCase(mockInput, mockUser)
    expect(result.ok).toBe(false)
  })
})

const mockAnomalyInput: CreateAnomalyCorrectionInput = {
  itemId: 'item-1',
  inventoryId: 'inv-1',
  associationId: 'asso-1',
  correctedBy: 'user-1',
}

describe('createAnomalyCorrectionUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(controlsRepository.verifyInventoryOwnership).mockResolvedValue(true)
    vi.mocked(controlsRepository.createAnomalyCorrection).mockResolvedValue({ ok: true, value: undefined })
  })

  it("retourne une erreur si l'associationId ne correspond pas à l'utilisateur", async () => {
    const result = await createAnomalyCorrectionUseCase({ ...mockAnomalyInput, associationId: 'autre-asso' }, mockUser)
    expect(result.ok).toBe(false)
    expect(controlsRepository.verifyInventoryOwnership).not.toHaveBeenCalled()
    expect(controlsRepository.createAnomalyCorrection).not.toHaveBeenCalled()
  })

  it("retourne une erreur si l'inventaire n'appartient pas à l'association", async () => {
    vi.mocked(controlsRepository.verifyInventoryOwnership).mockResolvedValue(false)
    const result = await createAnomalyCorrectionUseCase(mockAnomalyInput, mockUser)
    expect(result.ok).toBe(false)
    expect(controlsRepository.createAnomalyCorrection).not.toHaveBeenCalled()
  })

  it('enregistre la correction si les vérifications passent', async () => {
    const result = await createAnomalyCorrectionUseCase(mockAnomalyInput, mockUser)
    expect(result.ok).toBe(true)
    expect(controlsRepository.verifyInventoryOwnership).toHaveBeenCalledWith('inv-1', 'asso-1')
    expect(controlsRepository.createAnomalyCorrection).toHaveBeenCalledWith(mockAnomalyInput)
  })

  it("propage l'erreur du repository si la sauvegarde échoue", async () => {
    vi.mocked(controlsRepository.createAnomalyCorrection).mockResolvedValue({ ok: false, error: 'Erreur Firestore' })
    const result = await createAnomalyCorrectionUseCase(mockAnomalyInput, mockUser)
    expect(result.ok).toBe(false)
  })
})

describe('createPublicAnomalyCorrectionUseCase', () => {
  const publicInput = { itemId: 'item-1', inventoryId: 'inv-1', correctedBy: 'Jean' }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(controlsRepository.getInventoryAssociationId).mockResolvedValue({ ok: true, value: 'asso-1' })
    vi.mocked(controlsRepository.createAnomalyCorrection).mockResolvedValue({ ok: true, value: undefined })
  })

  it("retourne une erreur si le nom du correcteur est vide", async () => {
    const result = await createPublicAnomalyCorrectionUseCase({ ...publicInput, correctedBy: '   ' })
    expect(result.ok).toBe(false)
    expect(controlsRepository.getInventoryAssociationId).not.toHaveBeenCalled()
    expect(controlsRepository.createAnomalyCorrection).not.toHaveBeenCalled()
  })

  it("propage l'erreur si l'inventaire est introuvable", async () => {
    vi.mocked(controlsRepository.getInventoryAssociationId).mockResolvedValue({ ok: false, error: 'Inventaire introuvable.' })
    const result = await createPublicAnomalyCorrectionUseCase(publicInput)
    expect(result.ok).toBe(false)
    expect(controlsRepository.createAnomalyCorrection).not.toHaveBeenCalled()
  })

  it("résout l'associationId depuis l'inventaire et enregistre la correction", async () => {
    const result = await createPublicAnomalyCorrectionUseCase(publicInput)
    expect(result.ok).toBe(true)
    expect(controlsRepository.getInventoryAssociationId).toHaveBeenCalledWith('inv-1')
    expect(controlsRepository.createAnomalyCorrection).toHaveBeenCalledWith({ ...publicInput, associationId: 'asso-1' })
  })

  it("propage l'erreur du repository si la sauvegarde échoue", async () => {
    vi.mocked(controlsRepository.createAnomalyCorrection).mockResolvedValue({ ok: false, error: 'Erreur Firestore' })
    const result = await createPublicAnomalyCorrectionUseCase(publicInput)
    expect(result.ok).toBe(false)
  })
})

describe('createPublicCorrectionUseCase', () => {
  const publicInput = { itemId: 'item-1', inventoryId: 'inv-1', newExpiryDate: dateInDays(45), correctedBy: 'Jean' }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(controlsRepository.getInventoryAssociationId).mockResolvedValue({ ok: true, value: 'asso-1' })
    vi.mocked(controlsRepository.getAlertThreshold).mockResolvedValue(30)
    vi.mocked(controlsRepository.createCorrection).mockResolvedValue({ ok: true, value: undefined })
  })

  it("retourne une erreur si le nom du correcteur est vide", async () => {
    const result = await createPublicCorrectionUseCase({ ...publicInput, correctedBy: '  ' })
    expect(result.ok).toBe(false)
    expect(controlsRepository.getInventoryAssociationId).not.toHaveBeenCalled()
    expect(controlsRepository.createCorrection).not.toHaveBeenCalled()
  })

  it('retourne une erreur si la date est vide', async () => {
    const result = await createPublicCorrectionUseCase({ ...publicInput, newExpiryDate: '' })
    expect(result.ok).toBe(false)
    expect(controlsRepository.createCorrection).not.toHaveBeenCalled()
  })

  it("propage l'erreur si l'inventaire est introuvable", async () => {
    vi.mocked(controlsRepository.getInventoryAssociationId).mockResolvedValue({ ok: false, error: 'Inventaire introuvable.' })
    const result = await createPublicCorrectionUseCase(publicInput)
    expect(result.ok).toBe(false)
    expect(controlsRepository.createCorrection).not.toHaveBeenCalled()
  })

  it("retourne une erreur si la date est dans moins de 30 jours", async () => {
    const result = await createPublicCorrectionUseCase({ ...publicInput, newExpiryDate: dateInDays(15) })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('J+30')
    expect(controlsRepository.createCorrection).not.toHaveBeenCalled()
  })

  it("résout l'associationId depuis l'inventaire et enregistre la correction", async () => {
    const result = await createPublicCorrectionUseCase(publicInput)
    expect(result.ok).toBe(true)
    expect(controlsRepository.getInventoryAssociationId).toHaveBeenCalledWith('inv-1')
    expect(controlsRepository.createCorrection).toHaveBeenCalledWith({ ...publicInput, associationId: 'asso-1' })
  })

  it("propage l'erreur du repository si la sauvegarde échoue", async () => {
    vi.mocked(controlsRepository.createCorrection).mockResolvedValue({ ok: false, error: 'Erreur Firestore' })
    const result = await createPublicCorrectionUseCase(publicInput)
    expect(result.ok).toBe(false)
  })
})
