import type { Result } from '@/shared/domain/result'
import { ok, err } from '@/shared/domain/result'
import { validatorRepository, type LoadInventoryResult } from '../data/repository'
import type { ControlEmailContext, ControlSubmission, FeedbackSubmission } from './types'
import { sendControlCompletedEmail } from './email-service'

export async function loadInventoryUseCase(
  inventoryId: string,
): Promise<Result<LoadInventoryResult>> {
  if (!inventoryId.trim()) return err('Identifiant d\'inventaire manquant.')
  const [inventoryResult, datesResult] = await Promise.all([
    validatorRepository.loadInventory(inventoryId),
    validatorRepository.loadLastExpiryDates(inventoryId),
  ])
  if (!inventoryResult.ok) return inventoryResult
  const lastExpiryDates = datesResult.ok ? datesResult.value : {}
  return ok({ ...inventoryResult.value, lastExpiryDates })
}

export async function submitFeedbackUseCase(submission: FeedbackSubmission): Promise<Result<void>> {
  if (submission.rating < 1 || submission.rating > 5) return err('Note invalide.')
  if (submission.rating < 5 && !submission.comment.trim()) return err('Un commentaire est requis.')
  return validatorRepository.saveFeedback(submission)
}

export async function submitControlUseCase(
  submission: ControlSubmission,
  emailContext: ControlEmailContext,
): Promise<Result<{ controlId: string }>> {
  if (!submission.verifierName.trim()) return err('Le nom du vérificateur est obligatoire.')
  if (submission.results.length === 0) return err('Le contrôle ne contient aucun résultat.')

  const assocResult = await validatorRepository.getInventoryAssociationId(submission.inventoryId)
  const associationId = assocResult.ok ? assocResult.value : ''

  const result = await validatorRepository.saveControl(submission, associationId)
  if (!result.ok) return result

  // Non-blocking: email failure does not fail the control
  if (associationId) {
    const assocEmailResult = await validatorRepository.getAssociationEmails(associationId)
    if (assocEmailResult.ok) {
      await sendControlCompletedEmail(
        emailContext,
        submission.verifierName,
        submission.results.length,
        assocEmailResult.value.emails,
        assocEmailResult.value.name,
        new Date().toLocaleDateString('fr-FR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        }),
        assocEmailResult.value.alertThresholdDays,
      )
    }
  }

  return result
}
