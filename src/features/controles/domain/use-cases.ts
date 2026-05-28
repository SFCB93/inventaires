import { controlesRepository } from '../data/repository'
import type { Result } from '@/shared/domain/result'
import { err } from '@/shared/domain/result'
import type { ControlSummary, ControlDetail, ExpiryAlertReport, CreateCorrectionInput } from './types'
import type { AuthenticatedUser } from '@/shared/lib/auth'

export async function listControlsUseCase(associationId: string): Promise<Result<ControlSummary[]>> {
  if (!associationId) return err('Association non identifiée.')
  return controlesRepository.listControls(associationId)
}

export async function getControlDetailUseCase(controlId: string, associationId: string): Promise<Result<ControlDetail>> {
  if (!controlId) return err('Identifiant de contrôle manquant.')
  return controlesRepository.getControlDetail(controlId, associationId)
}

export async function getActiveExpiryAlertsUseCase(associationId: string, thresholdDays?: number): Promise<Result<ExpiryAlertReport>> {
  if (!associationId) return err('Association non identifiée.')
  return controlesRepository.getActiveExpiryAlerts(associationId, thresholdDays)
}

export async function createCorrectionUseCase(
  input: CreateCorrectionInput,
  user: AuthenticatedUser,
): Promise<Result<void>> {
  if (!input.newExpiryDate) return err('La date est obligatoire.')
  if (input.associationId !== user.associationId) return err('Non autorisé.')
  const thresholdDays = await controlesRepository.getAlertThreshold(input.associationId)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + thresholdDays)
  if (new Date(input.newExpiryDate) <= cutoff) return err(`Cette date ne résout pas l'alerte (doit être > J+${thresholdDays}).`)
  return controlesRepository.createCorrection(input)
}
