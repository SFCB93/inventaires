import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import type { AuthenticatedUser } from '@/shared/lib/auth'
import { gestionComptesRepository } from '../data/repository'
import { sendInvitationEmail, sendPasswordResetEmail } from './invitation-email-service'
import type { AssociationSummary, AssociationSettings, CreateAssociationInput, UpdateAssociationInput, AdminAccount } from './types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function listAssociationsUseCase(user: AuthenticatedUser): Promise<Result<AssociationSummary[]>> {
  if (user.role !== 'superadmin') return err('Accès non autorisé.')
  return gestionComptesRepository.listAssociations()
}

export async function createAssociationUseCase(input: CreateAssociationInput, user: AuthenticatedUser): Promise<Result<void>> {
  if (user.role !== 'superadmin') return err('Accès non autorisé.')
  if (!input.name.trim()) return err('Le nom de l\'association est obligatoire.')
  if (!EMAIL_RE.test(input.adminEmail)) return err('Email invalide.')
  const result = await gestionComptesRepository.createAssociation(input)
  if (!result.ok) return result
  // Best-effort — une erreur d'envoi ne bloque pas la création du compte
  try { await sendInvitationEmail(input.adminEmail, input.name, result.value.resetLink) } catch { /* ignored */ }
  return ok(undefined)
}

export async function getAssociationSettingsUseCase(associationId: string, user: AuthenticatedUser): Promise<Result<AssociationSettings>> {
  if (!associationId) return err('Association non identifiée.')
  if (user.role !== 'superadmin' && user.associationId !== associationId) return err('Accès non autorisé.')
  return gestionComptesRepository.getAssociationSettings(associationId)
}

export async function updateAssociationSettingsUseCase(associationId: string, data: UpdateAssociationInput, user: AuthenticatedUser): Promise<Result<void>> {
  if (!associationId) return err('Association non identifiée.')
  if (user.role !== 'superadmin' && user.associationId !== associationId) return err('Accès non autorisé.')
  if (!data.name.trim()) return err('Le nom de l\'association est obligatoire.')
  return gestionComptesRepository.updateAssociationSettings(associationId, data)
}

export async function listAdminAccountsUseCase(associationId: string, user: AuthenticatedUser): Promise<Result<AdminAccount[]>> {
  if (user.associationId !== associationId && user.role !== 'superadmin') return err('Accès non autorisé.')
  return gestionComptesRepository.listAdminAccounts(associationId)
}

export async function inviteAdminUseCase(email: string, user: AuthenticatedUser): Promise<Result<void>> {
  if (!EMAIL_RE.test(email)) return err('Email invalide.')
  const accountsResult = await gestionComptesRepository.listAdminAccounts(user.associationId)
  if (accountsResult.ok && accountsResult.value.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
    return err('Ce compte est déjà admin de cette association.')
  }
  const result = await gestionComptesRepository.createAdminAccount(email, user.associationId)
  if (!result.ok) return result
  const assocResult = await gestionComptesRepository.getAssociationSettings(user.associationId)
  const assocName = assocResult.ok ? assocResult.value.name : 'votre association'
  try { await sendInvitationEmail(email, assocName, result.value.resetLink) } catch { /* ignored */ }
  return ok(undefined)
}

export async function removeAdminUseCase(targetUid: string, user: AuthenticatedUser): Promise<Result<void>> {
  if (targetUid === user.uid) return err('Vous ne pouvez pas supprimer votre propre compte.')
  const accountsResult = await gestionComptesRepository.listAdminAccounts(user.associationId)
  if (!accountsResult.ok) return accountsResult
  if (accountsResult.value.length <= 1) return err('Impossible de supprimer le seul compte admin.')
  if (!accountsResult.value.some((a) => a.uid === targetUid)) return err('Compte introuvable dans cette association.')
  return gestionComptesRepository.removeAdminAccount(targetUid)
}

export async function sendPasswordResetUseCase(user: AuthenticatedUser): Promise<Result<void>> {
  const [resetResult, assocResult] = await Promise.all([
    gestionComptesRepository.generatePasswordReset(user.uid),
    gestionComptesRepository.getAssociationSettings(user.associationId),
  ])
  if (!resetResult.ok) return resetResult
  const assocName = assocResult.ok ? assocResult.value.name : 'association'
  try { await sendPasswordResetEmail(resetResult.value.email, assocName, resetResult.value.resetLink) } catch { /* ignored */ }
  return ok(undefined)
}
