'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ok } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import { getAuthenticatedUser, getLoginUrl, ACTING_AS_COOKIE, SESSION_DURATION_S } from '@/shared/lib/auth'
import { createAssociationUseCase } from './use-cases'
import type { CreateAssociationInput } from './types'

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
  redirect(user.role === 'superadmin' ? '/admin' : '/associations')
}

export async function createAssociationAction(input: CreateAssociationInput): Promise<Result<void>> {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')
  const loginUrl = await getLoginUrl()
  const result = await createAssociationUseCase(input, user, loginUrl)
  if (!result.ok) return result
  revalidatePath('/admin')
  return ok(undefined)
}
