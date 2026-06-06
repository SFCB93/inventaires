import { adminDb, adminAuth } from '@/shared/data/firebase-admin'
import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import type { AdminAccount } from '../domain/types'

export const teamRepository = {
  async listAdminAccounts(associationId: string): Promise<Result<AdminAccount[]>> {
    try {
      const snap = await adminDb.collection('users').where('associationId', '==', associationId).where('role', '==', 'admin').get()
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
    let uid: string | undefined
    try {
      const authUser = await adminAuth.createUser({ email })
      uid = authUser.uid
      await adminDb.collection('users').doc(uid).set({ associationId, role: 'admin' })
    } catch (error) {
      const code = (error as { code?: string }).code
      if (code === 'auth/email-already-exists') return err('Un compte existe déjà avec cet email.')
      if (uid) console.error(`[createAdminAccount] Compte Auth créé (${uid}) mais échec Firestore`, error)
      else console.error('[createAdminAccount]', error)
      return err(`Impossible de créer le compte. Erreur: ${(error as Error).message}`)
    }
    try {
      const resetLink = await adminAuth.generatePasswordResetLink(email)
      return ok({ resetLink })
    } catch (error) {
      console.error(`[createAdminAccount] Compte créé (${uid}) mais génération du lien échouée.`, error)
      return ok({ resetLink: undefined })
    }
  },

  async removeAdminAccount(uid: string): Promise<Result<void>> {
    try {
      await adminAuth.deleteUser(uid)
      await adminDb.collection('users').doc(uid).delete()
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
}
