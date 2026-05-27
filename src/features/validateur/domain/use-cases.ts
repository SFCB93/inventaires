import type { Result } from '@/shared/domain/result'
import { err } from '@/shared/domain/result'
import { validatorRepository, type LoadInventoryResult } from '../data/repository'
import type { ControlSubmission } from './types'

export async function loadInventoryUseCase(
  inventoryId: string,
): Promise<Result<LoadInventoryResult>> {
  if (!inventoryId.trim()) return err('Identifiant d\'inventaire manquant.')
  return validatorRepository.loadInventory(inventoryId)
}

export async function submitControlUseCase(
  submission: ControlSubmission,
  inventoryName: string,
  associationId: string,
): Promise<Result<{ controlId: string }>> {
  if (!submission.verifierName.trim()) return err('Le nom du vérificateur est obligatoire.')
  if (submission.results.length === 0) return err('Le contrôle ne contient aucun résultat.')
  return validatorRepository.saveControl(submission, inventoryName, associationId)
}
