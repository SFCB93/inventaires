import { controlsRepository } from '../data/repository'
import { getActiveAlerts } from '@/shared/data/alerts-repository'
import type { Result } from '@/shared/domain/result'
import { err } from '@/shared/domain/result'
import type { ControlSummary, ControlDetail, ActiveAlertsReport, CreateCorrectionInput, CreateAnomalyCorrectionInput } from './types'
import type { AuthenticatedUser } from '@/shared/lib/auth'

export async function listControlsUseCase(associationId: string): Promise<Result<ControlSummary[]>> {
  if (!associationId) return err('Association non identifiée.')
  return controlsRepository.listControls(associationId)
}

export async function getControlDetailUseCase(controlId: string, associationId: string): Promise<Result<ControlDetail>> {
  if (!controlId) return err('Identifiant de contrôle manquant.')
  return controlsRepository.getControlDetail(controlId, associationId)
}

export async function getActiveAlertsUseCase(associationId: string, thresholdDays?: number): Promise<Result<ActiveAlertsReport>> {
  if (!associationId) return err('Association non identifiée.')
  return getActiveAlerts(associationId, thresholdDays)
}

export async function getInventoryActiveAlertsUseCase(inventoryId: string, associationId: string, thresholdDays?: number): Promise<Result<ActiveAlertsReport>> {
  if (!inventoryId) return err('Identifiant d\'inventaire manquant.')
  if (!associationId) return err('Association non identifiée.')
  return getActiveAlerts(associationId, thresholdDays, true, inventoryId)
}

export async function getAlertThresholdUseCase(associationId: string): Promise<number> {
  return controlsRepository.getAlertThreshold(associationId)
}

export async function createAnomalyCorrectionUseCase(
  input: CreateAnomalyCorrectionInput,
  user: AuthenticatedUser,
): Promise<Result<void>> {
  if (input.associationId !== user.associationId) return err('Non autorisé.')
  const owns = await controlsRepository.verifyInventoryOwnership(input.inventoryId, input.associationId)
  if (!owns) return err('Non autorisé.')
  return controlsRepository.createAnomalyCorrection(input)
}

export async function createCorrectionUseCase(
  input: CreateCorrectionInput,
  user: AuthenticatedUser,
): Promise<Result<void>> {
  if (!input.newExpiryDate) return err('La date est obligatoire.')
  if (input.associationId !== user.associationId) return err('Non autorisé.')
  const thresholdDays = await controlsRepository.getAlertThreshold(input.associationId)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + thresholdDays)
  if (new Date(input.newExpiryDate) <= cutoff) return err(`Cette date ne résout pas l'alerte (doit être > J+${thresholdDays}).`)
  return controlsRepository.createCorrection(input)
}

export async function createPublicAnomalyCorrectionUseCase(
  input: { itemId: string; inventoryId: string; correctedBy: string },
): Promise<Result<void>> {
  if (!input.correctedBy.trim()) return err('Le nom du correcteur est obligatoire.')
  const assocResult = await controlsRepository.getInventoryAssociationId(input.inventoryId)
  if (!assocResult.ok) return assocResult
  return controlsRepository.createAnomalyCorrection({ ...input, associationId: assocResult.value })
}

export async function createPublicCorrectionUseCase(
  input: { itemId: string; inventoryId: string; newExpiryDate: string; correctedBy: string },
): Promise<Result<void>> {
  if (!input.correctedBy.trim()) return err('Le nom du correcteur est obligatoire.')
  if (!input.newExpiryDate) return err('La date est obligatoire.')
  const assocResult = await controlsRepository.getInventoryAssociationId(input.inventoryId)
  if (!assocResult.ok) return assocResult
  const thresholdDays = await controlsRepository.getAlertThreshold(assocResult.value)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + thresholdDays)
  if (new Date(input.newExpiryDate) <= cutoff) return err(`Cette date ne résout pas l'alerte (doit être > J+${thresholdDays}).`)
  return controlsRepository.createCorrection({ ...input, associationId: assocResult.value })
}
