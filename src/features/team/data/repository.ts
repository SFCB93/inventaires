import { FieldValue } from 'firebase-admin/firestore'
import { adminDb, adminAuth } from '@/shared/data/firebase-admin'
import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import type { AdminAccount, AssociationSummary } from '../domain/types'

export const teamRepository = {
  async listAdminAccounts(associationId: string): Promise<Result<AdminAccount[]>> {
    try {
      const snap = await adminDb.collection('users').where('associationIds', 'array-contains', associationId).where('role', '==', 'admin').get()
      if (snap.empty) return ok([])
      const { users } = await adminAuth.getUsers(snap.docs.map((d) => ({ uid: d.id })))
      const accounts = users.map((u) => ({
        uid: u.uid,
        email: u.email ?? '',
        createdAt: u.metadata.creationTime ? new Date(u.metadata.creationTime) : null,
      }))
      accounts.sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0))
      return ok(accounts)
    } catch (error) {
      console.error('[listAdminAccounts]', error)
      return err(`Impossible de charger les comptes. Erreur: ${(error as Error).message}`)
    }
  },

  async createAdminAccount(email: string, associationId: string): Promise<Result<{ resetLink: string | undefined }>> {
    try {
      let uid: string
      try {
        const authUser = await adminAuth.createUser({ email })
        uid = authUser.uid
        await adminDb.collection('users').doc(uid).set({ associationIds: [associationId], role: 'admin' })
      } catch (error) {
        const code = (error as { code?: string }).code
        if (code !== 'auth/email-already-exists') {
          console.error('[createAdminAccount]', error)
          return err(`Impossible de créer le compte. Erreur: ${(error as Error).message}`)
        }
        // User already exists in Auth — add this association if they're a regular admin
        const existing = await adminAuth.getUserByEmail(email)
        uid = existing.uid
        const docRef = adminDb.collection('users').doc(uid)
        const doc = await docRef.get()
        if (doc.exists) {
          if (doc.data()?.role === 'superadmin') return err('Impossible d\'ajouter un superadmin comme administrateur.')
          await docRef.update({ associationIds: FieldValue.arrayUnion(associationId) })
        } else {
          await docRef.set({ associationIds: [associationId], role: 'admin' })
        }
      }
      try {
        const resetLink = await adminAuth.generatePasswordResetLink(email)
        return ok({ resetLink })
      } catch (error) {
        console.error(`[createAdminAccount] Compte créé (${uid}) mais génération du lien échouée.`, error)
        return ok({ resetLink: undefined })
      }
    } catch (error) {
      console.error('[createAdminAccount]', error)
      return err(`Impossible de créer le compte. Erreur: ${(error as Error).message}`)
    }
  },

  async removeAdminAccount(uid: string, associationId: string): Promise<Result<void>> {
    try {
      const docRef = adminDb.collection('users').doc(uid)
      await adminDb.runTransaction(async (t) => {
        const doc = await t.get(docRef)
        const ids = (doc.data()?.associationIds as string[]) ?? []
        const remaining = ids.filter((id) => id !== associationId)
        if (remaining.length === 0) {
          await adminAuth.deleteUser(uid)
          t.delete(docRef)
        } else {
          t.update(docRef, { associationIds: remaining })
        }
      })
      return ok(undefined)
    } catch (error) {
      return err(`Impossible de supprimer le compte. Erreur: ${(error as Error).message}`)
    }
  },

  async getAssociationName(associationId: string): Promise<string> {
    try {
      const doc = await adminDb.collection('associations').doc(associationId).get()
      return (doc.data()?.name as string) ?? 'votre association'
    } catch {
      return 'votre association'
    }
  },

  async getAssociationNames(ids: string[]): Promise<AssociationSummary[]> {
    if (ids.length === 0) return []
    try {
      const docs = await adminDb.getAll(...ids.map((id) => adminDb.collection('associations').doc(id)))
      return docs
        .filter((doc) => doc.exists)
        .map((doc) => ({ id: doc.id, name: (doc.data()?.name as string) ?? 'Association sans nom' }))
    } catch {
      return []
    }
  },
}
