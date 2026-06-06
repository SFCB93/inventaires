'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Result } from '@/shared/domain/result'
import { getAuthenticatedUser } from '@/shared/lib/auth'
import { inviteAdminUseCase, removeAdminUseCase } from './use-cases'

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
