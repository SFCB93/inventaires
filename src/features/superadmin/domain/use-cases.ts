import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import type { AuthenticatedUser } from '@/shared/lib/auth'
import { superadminRepository } from '../data/repository'
import { sendInvitationEmail } from '@/shared/lib/admin-email-service'
import type { AssociationSummary, CreateAssociationInput, FeedbackRow } from './types'

export async function listAssociationsUseCase(user: AuthenticatedUser): Promise<Result<AssociationSummary[]>> {
  if (user.role !== 'superadmin') return err('Accès non autorisé.')
  return superadminRepository.listAssociations()
}

export async function listFeedbacksUseCase(user: AuthenticatedUser): Promise<Result<FeedbackRow[]>> {
  if (user.role !== 'superadmin') return err('Accès non autorisé.')
  return superadminRepository.listFeedbacks()
}

export async function createAssociationUseCase(input: CreateAssociationInput, user: AuthenticatedUser, loginUrl?: string): Promise<Result<void>> {
  if (user.role !== 'superadmin') return err('Accès non autorisé.')
  if (!input.name.trim()) return err('Le nom de l\'association est obligatoire.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.adminEmail)) return err('Email invalide.')
  const result = await superadminRepository.createAssociation(input)
  if (!result.ok) return result
  if (result.value.resetLink) {
    try { await sendInvitationEmail(input.adminEmail, input.name, result.value.resetLink, loginUrl) } catch { /* best-effort */ }
  }
  return ok(undefined)
}
