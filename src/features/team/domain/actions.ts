'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Result } from '@/shared/domain/result'
import { getAuthenticatedUser, getLoginUrl, ACTING_AS_COOKIE, SESSION_DURATION_S } from '@/shared/lib/auth'
import { inviteAdminUseCase, removeAdminUseCase } from './use-cases'

export async function selectAssociationAction(associationId: string) {
  const user = await getAuthenticatedUser()
  if (!user || user.role !== 'admin' || !user.associationIds.includes(associationId)) redirect('/login')
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

export async function inviteAdminAction(email: string): Promise<Result<void>> {
  const user = await getAuthenticatedUser()
  if (!user) return { ok: false, error: 'Non authentifié.' }
  const loginUrl = await getLoginUrl()
  const result = await inviteAdminUseCase(email, user, loginUrl)
  if (result.ok) revalidatePath('/dashboard/parametres')
  return result
}

export async function removeAdminAction(targetUid: string): Promise<Result<void>> {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')
  const result = await removeAdminUseCase(targetUid, user)
  if (result.ok) revalidatePath('/dashboard/parametres')
  return result
}
