import { cache } from 'react'
import { cookies } from 'next/headers'
import { adminAuth, adminDb } from '@/shared/data/firebase-admin'

export type AuthenticatedUser = {
  uid: string
  associationId: string
  associationIds: string[]
  role: 'admin' | 'superadmin'
}

export const getAuthenticatedUser = cache(async (): Promise<AuthenticatedUser | null> => {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')
  if (!session) return null

  try {
    const decoded = await adminAuth.verifySessionCookie(session.value, true)
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get()
    if (!userDoc.exists) return null
    const data = userDoc.data()!
    const role = (data.role as 'admin' | 'superadmin') ?? 'admin'

    const rawIds = data.associationIds as string[] | undefined
    const associationIds: string[] = (rawIds && rawIds.length > 0) ? rawIds : (data.associationId ? [data.associationId as string] : [])

    let associationId = ''

    if (role === 'superadmin') {
      const actingAs = cookieStore.get('acting-as')
      if (actingAs?.value) {
        const assocDoc = await adminDb.collection('associations').doc(actingAs.value).get()
        if (assocDoc.exists) associationId = actingAs.value
      }
    } else if (associationIds.length === 1) {
      associationId = associationIds[0]
    } else if (associationIds.length > 1) {
      const actingAs = cookieStore.get('acting-as')
      if (actingAs?.value && associationIds.includes(actingAs.value)) {
        associationId = actingAs.value
      }
    }

    return { uid: decoded.uid, associationId, associationIds, role }
  } catch {
    return null
  }
})
