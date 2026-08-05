'use server'
import type { Result } from '@/shared/domain/result'
import { err } from '@/shared/domain/result'
import { getAuthenticatedUser } from '@/shared/lib/auth'
import {
  listMileageHistoryUseCase,
  logMileageUseCase,
  logFuelUseCase,
  reportAnomalyUseCase,
  logMaintenanceUseCase,
  logDisinfectionUseCase,
  getLogbookHistoryUseCase,
} from './use-cases'
import type { LogMileageInput, LogFuelInput, ReportAnomalyInput, LogMaintenanceInput, LogDisinfectionInput } from './use-cases'
import type { MileageEntry, LogbookHistoryEntry } from './types'

export async function listMileageHistoryAction(inventoryId: string): Promise<Result<MileageEntry[]>> {
  return listMileageHistoryUseCase(inventoryId)
}

export async function logMileageAction(input: LogMileageInput): Promise<Result<void>> {
  return logMileageUseCase(input)
}

export async function logFuelAction(input: LogFuelInput): Promise<Result<void>> {
  return logFuelUseCase(input)
}

export async function reportAnomalyAction(input: ReportAnomalyInput): Promise<Result<void>> {
  return reportAnomalyUseCase(input)
}

export async function logMaintenanceAction(input: LogMaintenanceInput): Promise<Result<void>> {
  return logMaintenanceUseCase(input)
}

export async function logDisinfectionAction(input: LogDisinfectionInput): Promise<Result<void>> {
  return logDisinfectionUseCase(input)
}

export async function getLogbookHistoryAction(inventoryId: string): Promise<Result<LogbookHistoryEntry[]>> {
  const user = await getAuthenticatedUser()
  if (!user) return err('Non authentifié.')

  return getLogbookHistoryUseCase(inventoryId, user.associationId)
}
