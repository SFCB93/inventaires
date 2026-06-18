'use server'

import { cookies, headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ok } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import { getAuthenticatedUser } from '@/shared/lib/auth'
import { createAssociationUseCase } from './use-cases'
import type { CreateAssociationInput } from './types'

async function getLoginUrl(): Promise<string | undefined> {
  try {
    const h = await headers()
    const host = h.get('host')
    if (!host) return undefined
    const proto = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    return `${proto}://${host}/login`
  } catch {
    return undefined
  }
}

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
