import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import type { AuthenticatedUser } from '@/shared/lib/auth'
import { settingsRepository } from '../data/repository'
import { sendPasswordResetEmail } from './email-service'
import type { AssociationSettings, UpdateAssociationInput } from './types'

export async function getAssociationSettingsUseCase(associationId: string, user: AuthenticatedUser): Promise<Result<AssociationSettings>> {
  if (!associationId) return err('Association non identifiée.')
  if (user.role !== 'superadmin' && user.associationId !== associationId) return err('Accès non autorisé.')
  return settingsRepository.getAssociationSettings(associationId)
}

export async function updateAssociationSettingsUseCase(associationId: string, data: UpdateAssociationInput, user: AuthenticatedUser): Promise<Result<void>> {
  if (!associationId) return err('Association non identifiée.')
  if (user.role !== 'superadmin' && user.associationId !== associationId) return err('Accès non autorisé.')
  if (!data.name.trim()) return err('Le nom de l\'association est obligatoire.')
  if (data.alertThresholdDays < 1) return err('Le seuil doit être au moins 1 jour.')
  if (data.alertIntervalDays < 1) return err("L'intervalle doit être au moins 1 jour.")
  return settingsRepository.updateAssociationSettings(associationId, data)
}

export async function sendPasswordResetUseCase(user: AuthenticatedUser): Promise<Result<void>> {
  const [resetResult, settingsResult] = await Promise.all([
    settingsRepository.generatePasswordReset(user.uid),
    settingsRepository.getAssociationSettings(user.associationId),
  ])
  if (!resetResult.ok) return resetResult
  const assocName = settingsResult.ok ? settingsResult.value.name : 'association'
  try { await sendPasswordResetEmail(resetResult.value.email, assocName, resetResult.value.resetLink) } catch { /* best-effort */ }
  return ok(undefined)
}
