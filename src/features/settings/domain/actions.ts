'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ok } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import { getAuthenticatedUser } from '@/shared/lib/auth'
import { updateAssociationSettingsUseCase, sendPasswordResetUseCase } from './use-cases'
import type { UpdateAssociationInput } from './types'

export async function updateAssociationSettingsAction(data: UpdateAssociationInput): Promise<Result<void>> {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')
  const result = await updateAssociationSettingsUseCase(user.associationId, data, user)
  if (!result.ok) return result
  revalidatePath('/dashboard/parametres')
  return ok(undefined)
}

export async function sendPasswordResetAction(): Promise<Result<void>> {
  const user = await getAuthenticatedUser()
  if (!user) return { ok: false, error: 'Non authentifié.' }
  return sendPasswordResetUseCase(user)
}
