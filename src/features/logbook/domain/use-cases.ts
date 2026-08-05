// Dépasse 120 lignes : couvre les 5 actions du carnet de bord + la lecture d'historique (frontoffice et backoffice).
import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import { inventoryRepository } from '@/features/inventories/data/repository'
import { vehicleTrackingRepository } from '@/features/vehicle-tracking/data/repository'
import { getInventoryAssociationId, createLogbookEntry, listLogbookEntries } from '../data/repository'
import { sendLogbookNotificationEmail } from './email-service'
import type { MileageEntry, LogbookHistoryEntry, DisinfectionProtocol } from './types'

export async function isVehicleUseCase(inventoryId: string): Promise<Result<boolean>> {
  return vehicleTrackingRepository.hasDevice(inventoryId)
}

export async function listMileageHistoryUseCase(inventoryId: string): Promise<Result<MileageEntry[]>> {
  const entriesResult = await listLogbookEntries(inventoryId)
  if (!entriesResult.ok) return entriesResult

  return ok(
    entriesResult.value
      .filter((entry) => entry.type === 'mileage')
      .map((entry) => ({
        id: entry.id,
        km: entry.km ?? 0,
        mission: entry.mission ?? '',
        submittedBy: entry.submittedBy,
        submittedAt: entry.submittedAt,
      })),
  )
}

export interface LogMileageInput {
  inventoryId: string
  submittedBy: string
  km: number
  mission: string
}

export async function logMileageUseCase(input: LogMileageInput): Promise<Result<void>> {
  if (!input.submittedBy.trim()) return err('Le nom est obligatoire.')
  if (!Number.isFinite(input.km) || input.km < 0) return err('Kilométrage invalide.')
  if (!input.mission.trim()) return err('La mission est obligatoire.')

  const associationResult = await getInventoryAssociationId(input.inventoryId)
  if (!associationResult.ok) return associationResult

  return createLogbookEntry({
    type: 'mileage',
    inventoryId: input.inventoryId,
    associationId: associationResult.value,
    submittedBy: input.submittedBy.trim(),
    km: input.km,
    mission: input.mission.trim(),
  })
}

export interface LogFuelInput {
  inventoryId: string
  submittedBy: string
  fuelLiters: number
  amountEuros?: number
  documentUrl?: string | null
}

export async function logFuelUseCase(input: LogFuelInput): Promise<Result<void>> {
  if (!input.submittedBy.trim()) return err('Le nom est obligatoire.')
  if (!Number.isFinite(input.fuelLiters) || input.fuelLiters <= 0) return err('Quantité invalide.')
  if (input.amountEuros !== undefined && (!Number.isFinite(input.amountEuros) || input.amountEuros < 0)) {
    return err('Montant invalide.')
  }

  const associationResult = await getInventoryAssociationId(input.inventoryId)
  if (!associationResult.ok) return associationResult

  const createResult = await createLogbookEntry({
    type: 'fuel',
    inventoryId: input.inventoryId,
    associationId: associationResult.value,
    submittedBy: input.submittedBy.trim(),
    fuelLiters: input.fuelLiters,
    amountEuros: input.amountEuros,
    documentUrl: input.documentUrl ?? null,
  })
  if (!createResult.ok) return createResult

  sendLogbookNotificationEmail({
    inventoryId: input.inventoryId,
    associationId: associationResult.value,
    submittedBy: input.submittedBy.trim(),
    kind: 'fuel',
    fuelLiters: input.fuelLiters,
    amountEuros: input.amountEuros,
    documentUrl: input.documentUrl,
  }).catch((error) => console.error('[logFuelUseCase] email failed', error))

  return ok(undefined)
}

export interface ReportAnomalyInput {
  inventoryId: string
  submittedBy: string
  description: string
}

export async function reportAnomalyUseCase(input: ReportAnomalyInput): Promise<Result<void>> {
  if (!input.submittedBy.trim()) return err('Le nom est obligatoire.')
  if (!input.description.trim()) return err('La description est obligatoire.')

  const associationResult = await getInventoryAssociationId(input.inventoryId)
  if (!associationResult.ok) return associationResult

  const createResult = await createLogbookEntry({
    type: 'anomaly',
    inventoryId: input.inventoryId,
    associationId: associationResult.value,
    submittedBy: input.submittedBy.trim(),
    description: input.description.trim(),
  })
  if (!createResult.ok) return createResult

  sendLogbookNotificationEmail({
    inventoryId: input.inventoryId,
    associationId: associationResult.value,
    submittedBy: input.submittedBy.trim(),
    kind: 'anomaly',
    description: input.description.trim(),
  }).catch((error) => console.error('[reportAnomalyUseCase] email failed', error))

  return ok(undefined)
}

export interface LogMaintenanceInput {
  inventoryId: string
  submittedBy: string
  description: string
  documentUrl?: string | null
}

export async function logMaintenanceUseCase(input: LogMaintenanceInput): Promise<Result<void>> {
  if (!input.submittedBy.trim()) return err('Le nom est obligatoire.')
  if (!input.description.trim()) return err('La description est obligatoire.')

  const associationResult = await getInventoryAssociationId(input.inventoryId)
  if (!associationResult.ok) return associationResult

  return createLogbookEntry({
    type: 'maintenance',
    inventoryId: input.inventoryId,
    associationId: associationResult.value,
    submittedBy: input.submittedBy.trim(),
    description: input.description.trim(),
    documentUrl: input.documentUrl ?? null,
  })
}

export interface LogDisinfectionInput {
  inventoryId: string
  submittedBy: string
  disinfectionProtocol: DisinfectionProtocol
}

export async function logDisinfectionUseCase(input: LogDisinfectionInput): Promise<Result<void>> {
  if (!input.submittedBy.trim()) return err('Le nom est obligatoire.')

  const associationResult = await getInventoryAssociationId(input.inventoryId)
  if (!associationResult.ok) return associationResult

  const createResult = await createLogbookEntry({
    type: 'disinfection',
    inventoryId: input.inventoryId,
    associationId: associationResult.value,
    submittedBy: input.submittedBy.trim(),
    disinfectionProtocol: input.disinfectionProtocol,
  })
  if (!createResult.ok) return createResult

  sendLogbookNotificationEmail({
    inventoryId: input.inventoryId,
    associationId: associationResult.value,
    submittedBy: input.submittedBy.trim(),
    kind: 'disinfection',
    disinfectionProtocol: input.disinfectionProtocol,
  }).catch((error) => console.error('[logDisinfectionUseCase] email failed', error))

  return ok(undefined)
}

export async function getLogbookHistoryUseCase(
  inventoryId: string,
  associationId: string,
): Promise<Result<LogbookHistoryEntry[]>> {
  const ownership = await inventoryRepository.checkInventoryOwnership(inventoryId, associationId)
  if (!ownership.ok) return ownership

  return listLogbookEntries(inventoryId)
}
