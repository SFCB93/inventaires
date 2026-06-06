import { adminDb, adminAuth } from '@/shared/data/firebase-admin'
import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import type { AssociationSummary, CreateAssociationInput } from '../domain/types'

export const superadminRepository = {
  async listAssociations(): Promise<Result<AssociationSummary[]>> {
    try {
      const [assocSnap, usersSnap] = await Promise.all([
        adminDb.collection('associations').get(),
        adminDb.collection('users').where('role', '==', 'admin').get(),
      ])
      const adminUidByAssoc = new Map<string, string>()
      for (const doc of usersSnap.docs) {
        const assocId = doc.data().associationId as string
        if (assocId && !adminUidByAssoc.has(assocId)) adminUidByAssoc.set(assocId, doc.id)
      }
      const uids = [...adminUidByAssoc.values()]
      const emailByUid = new Map<string, string>()
      if (uids.length > 0) {
        const { users } = await adminAuth.getUsers(uids.map(uid => ({ uid })))
        for (const u of users) emailByUid.set(u.uid, u.email ?? '')
      }
      return ok(assocSnap.docs.map(doc => ({
        id: doc.id,
        name: (doc.data().name as string) ?? doc.id,
        adminEmail: emailByUid.get(adminUidByAssoc.get(doc.id) ?? '') ?? '',
      })))
    } catch (error) {
      console.error('[listAssociations]', error)
      return err('Impossible de lister les associations.')
    }
  },

  async createAssociation(input: CreateAssociationInput): Promise<Result<{ resetLink: string | undefined }>> {
    let uid: string | undefined
    try {
      const authUser = await adminAuth.createUser({ email: input.adminEmail })
      uid = authUser.uid
      const assocRef = await adminDb.collection('associations').add({ name: input.name, notificationEmails: [] })
      await adminDb.collection('users').doc(uid).set({ associationId: assocRef.id, role: 'admin' })
    } catch (error) {
      if (uid) console.error(`[createAssociation] Compte Auth créé (${uid}) mais échec Firestore — nettoyage manuel requis.`, error)
      else console.error('[createAssociation]', error)
      return err('Impossible de créer l\'association.')
    }
    try {
      const resetLink = await adminAuth.generatePasswordResetLink(input.adminEmail)
      return ok({ resetLink })
    } catch (error) {
      console.error(`[createAssociation] Compte créé (${uid}) mais génération du lien échouée.`, error)
      return ok({ resetLink: undefined })
    }
  },
}
