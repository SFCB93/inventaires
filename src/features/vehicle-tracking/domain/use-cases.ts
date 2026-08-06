// Dépasse 120 lignes : couvre le lien device, l'ingestion de position et la lecture du suivi véhicule.
import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import { inventoryRepository } from '@/features/inventories/data/repository'
import { vehicleTrackingRepository } from '../data/repository'
import { generateApiKey, hashApiKey } from './api-key'
import { haversineDistanceMeters, roundCoordinate } from './geo'
import { sendPoweredAlertIfDue } from './powered-alert-use-case'
import { DEDUP_DISTANCE_METERS, MIN_PING_INTERVAL_SECONDS, MS_PER_SECOND, MS_PER_HOUR, TIME_RANGE_HOURS, ERROR_UNAUTHORIZED, ERROR_RATE_LIMITED } from './constants'
import type { VehicleStatus, UnlinkedInventory, PositionPoint, TimeRange } from './types'

export async function linkDeviceUseCase(
  inventoryId: string,
  associationId: string,
): Promise<Result<{ inventoryId: string; apiKey: string }>> {
  const ownership = await inventoryRepository.checkInventoryOwnership(inventoryId, associationId)
  if (!ownership.ok) return ownership

  const apiKey = generateApiKey()
  const saveResult = await vehicleTrackingRepository.saveDeviceKey(inventoryId, associationId, hashApiKey(apiKey))
  if (!saveResult.ok) return saveResult

  return ok({ inventoryId, apiKey })
}

export async function revokeDeviceUseCase(inventoryId: string, associationId: string): Promise<Result<void>> {
  const ownership = await inventoryRepository.checkInventoryOwnership(inventoryId, associationId)
  if (!ownership.ok) return ownership

  return vehicleTrackingRepository.revokeDeviceKey(inventoryId)
}

export async function revokeDeviceAndDeleteDataUseCase(inventoryId: string, associationId: string): Promise<Result<void>> {
  const ownership = await inventoryRepository.checkInventoryOwnership(inventoryId, associationId)
  if (!ownership.ok) return ownership

  const revokeResult = await vehicleTrackingRepository.revokeDeviceKey(inventoryId)
  if (!revokeResult.ok) return revokeResult

  return vehicleTrackingRepository.deleteVehicleData(inventoryId)
}

export interface VehicleDetail {
  name: string
  isLinked: boolean
}

export async function getVehicleDetailUseCase(inventoryId: string, associationId: string): Promise<Result<VehicleDetail>> {
  const ownership = await inventoryRepository.checkInventoryOwnership(inventoryId, associationId)
  if (!ownership.ok) return ownership

  const namesResult = await vehicleTrackingRepository.listInventoryNames([inventoryId])
  if (!namesResult.ok) return namesResult
  const name = namesResult.value.get(inventoryId)
  if (!name) return err('Véhicule introuvable.')

  const hasDeviceResult = await vehicleTrackingRepository.hasDevice(inventoryId)
  if (!hasDeviceResult.ok) return hasDeviceResult

  return ok({ name, isLinked: hasDeviceResult.value })
}

export interface ReceiveVehicleStatusInput {
  apiKey: string
  lat: number
  lng: number
  isCircuitCut: boolean
  timestamp: Date
}

export async function receiveVehicleStatusUseCase(input: ReceiveVehicleStatusInput): Promise<Result<void>> {
  if (Number.isNaN(input.lat) || input.lat < -90 || input.lat > 90) return err('Latitude invalide.')
  if (Number.isNaN(input.lng) || input.lng < -180 || input.lng > 180) return err('Longitude invalide.')
  if (Number.isNaN(input.timestamp.getTime())) return err('Horodatage invalide.')

  const lat = roundCoordinate(input.lat)
  const lng = roundCoordinate(input.lng)

  const device = await vehicleTrackingRepository.findDeviceByKeyHash(hashApiKey(input.apiKey))
  if (!device.ok) return device
  if (!device.value) return err(ERROR_UNAUTHORIZED)
  const { inventoryId, associationId } = device.value

  const ownership = await inventoryRepository.checkInventoryOwnership(inventoryId, associationId)
  if (!ownership.ok) return err(ERROR_UNAUTHORIZED)

  const current = await vehicleTrackingRepository.getVehicleStatus(inventoryId)
  if (!current.ok) return current

  if (current.value) {
    if (input.timestamp.getTime() <= current.value.lastSeenAt.getTime()) return ok(undefined)

    const secondsSinceLastSeen = (input.timestamp.getTime() - current.value.lastSeenAt.getTime()) / MS_PER_SECOND
    if (secondsSinceLastSeen < MIN_PING_INTERVAL_SECONDS) return err(ERROR_RATE_LIMITED)

    const distance = haversineDistanceMeters(current.value, { lat, lng })
    const isUnchanged = distance < DEDUP_DISTANCE_METERS && current.value.isCircuitCut === input.isCircuitCut
    if (isUnchanged) {
      const touchResult = await vehicleTrackingRepository.touchLastSeen(inventoryId, input.timestamp)
      if (!touchResult.ok) return touchResult

      sendPoweredAlertIfDue({
        inventoryId,
        associationId,
        stableSince: current.value.stableSince,
        isCircuitCut: input.isCircuitCut,
        alreadySent: current.value.poweredAlertSent,
        now: input.timestamp,
      }).catch((error) => console.error('[receiveVehicleStatusUseCase] alerte alimentation échouée', error))

      return ok(undefined)
    }
  }

  return vehicleTrackingRepository.recordVehiclePoint({
    inventoryId,
    associationId,
    lat,
    lng,
    isCircuitCut: input.isCircuitCut,
    timestamp: input.timestamp,
  })
}

export async function getFleetStatusUseCase(associationId: string): Promise<Result<VehicleStatus[]>> {
  const linkedIdsResult = await vehicleTrackingRepository.listLinkedInventoryIds(associationId)
  if (!linkedIdsResult.ok) return linkedIdsResult
  const linkedIds = Array.from(linkedIdsResult.value)
  if (linkedIds.length === 0) return ok([])

  const namesResult = await vehicleTrackingRepository.listInventoryNames(linkedIds)
  if (!namesResult.ok) return namesResult

  const statusesResult = await vehicleTrackingRepository.listFleetStatus(associationId)
  if (!statusesResult.ok) return statusesResult
  const statusByInventoryId = new Map(statusesResult.value.map((status) => [status.inventoryId, status]))

  return ok(
    linkedIds
      .map((inventoryId) => {
        const status = statusByInventoryId.get(inventoryId)
        return {
          inventoryId,
          name: namesResult.value.get(inventoryId) ?? 'Véhicule supprimé',
          isCircuitCut: status?.isCircuitCut ?? null,
          position: status ? { lat: status.lat, lng: status.lng } : null,
          stableSince: status?.stableSince ?? null,
          lastSeenAt: status?.lastSeenAt ?? null,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name)),
  )
}

export async function listUnlinkedInventoriesUseCase(associationId: string): Promise<Result<UnlinkedInventory[]>> {
  const inventoriesResult = await inventoryRepository.listInventories(associationId)
  if (!inventoriesResult.ok) return inventoriesResult

  const linkedIdsResult = await vehicleTrackingRepository.listLinkedInventoryIds(associationId)
  if (!linkedIdsResult.ok) return linkedIdsResult

  return ok(
    inventoriesResult.value
      .filter((inventory) => !linkedIdsResult.value.has(inventory.id))
      .map((inventory) => ({ inventoryId: inventory.id, name: inventory.name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  )
}

export async function getVehiclePositionHistoryUseCase(
  inventoryId: string,
  associationId: string,
  timeRange: TimeRange,
): Promise<Result<PositionPoint[]>> {
  const ownership = await inventoryRepository.checkInventoryOwnership(inventoryId, associationId)
  if (!ownership.ok) return ownership

  const since = new Date(Date.now() - TIME_RANGE_HOURS[timeRange] * MS_PER_HOUR)
  const historyResult = await vehicleTrackingRepository.listPositionHistory(inventoryId, since)
  if (!historyResult.ok) return historyResult

  return ok(historyResult.value)
}
