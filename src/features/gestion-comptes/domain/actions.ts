'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/shared/lib/auth'
import { createAssociationUseCase, updateAssociationSettingsUseCase, inviteAdminUseCase, removeAdminUseCase, sendPasswordResetUseCase } from './use-cases'
import type { Result } from '@/shared/domain/result'

const ACTING_AS_COOKIE = 'acting-as'
const SESSION_DURATION_S = 60 * 60 * 24 * 5

export async function enterAssociationAction(associationId: string) {
  const user = await getAuthenticatedUser()
  if (!user || user.role !== 'superadmin') redirect('/login')
  const cookieStore = await cookies()
  cookieStore.set(ACTING_AS_COOKIE, associationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_S,
    path: '/',
  })
  redirect('/dashboard/inventaires')
}

export async function leaveAssociationAction() {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')
  const cookieStore = await cookies()
  cookieStore.delete(ACTING_AS_COOKIE)
  redirect('/admin')
}

export async function createAssociationAction(input: { name: string; adminEmail: string }) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')
  const result = await createAssociationUseCase(input, user)
  if (!result.ok) return { error: result.error }
  revalidatePath('/admin')
  return { ok: true }
}

export async function updateAssociationSettingsAction(data: { name: string; notificationEmails: string[] }) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')
  const result = await updateAssociationSettingsUseCase(user.associationId, data, user)
  if (!result.ok) return { error: result.error }
  revalidatePath('/dashboard/parametres')
  return { ok: true }
}

export async function inviteAdminAction(email: string): Promise<Result<void>> {
  const user = await getAuthenticatedUser()
  if (!user) return { ok: false, error: 'Non authentifié.' }
  const result = await inviteAdminUseCase(email, user)
  if (result.ok) revalidatePath('/dashboard/parametres')
  return result
}

export async function removeAdminAction(targetUid: string): Promise<Result<void>> {
  const user = await getAuthenticatedUser()
  if (!user) return { ok: false, error: 'Non authentifié.' }
  const result = await removeAdminUseCase(targetUid, user)
  if (result.ok) revalidatePath('/dashboard/parametres')
  return result
}

export async function sendPasswordResetAction(): Promise<Result<void>> {
  const user = await getAuthenticatedUser()
  if (!user) return { ok: false, error: 'Non authentifié.' }
  return sendPasswordResetUseCase(user)
}
