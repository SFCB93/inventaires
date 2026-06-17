import { FieldPath } from 'firebase-admin/firestore'
import { adminDb, adminAuth } from '@/shared/data/firebase-admin'
import { chunkArray, FIRESTORE_IN_LIMIT } from '@/shared/lib/array'
import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import type { AssociationSummary, CreateAssociationInput, FeedbackRow } from '../domain/types'

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

  async listFeedbacks(): Promise<Result<FeedbackRow[]>> {
    try {
      const snap = await adminDb
        .collection('feedbacks')
        .orderBy('submittedAt', 'desc')
        .limit(100)
        .get()
      if (snap.empty) return ok([])

      const controlIds = [...new Set(snap.docs.map((d) => d.data().controlId as string))]
      const verifierNames = new Map<string, string>()
      for (const chunk of chunkArray(controlIds, FIRESTORE_IN_LIMIT)) {
        const controlSnap = await adminDb
          .collection('controles')
          .where(FieldPath.documentId(), 'in', chunk)
          .get()
        for (const doc of controlSnap.docs) {
          verifierNames.set(doc.id, (doc.data().verifierName as string) ?? '')
        }
      }

      return ok(snap.docs.map((doc) => {
        const d = doc.data()
        return {
          id: doc.id,
          submittedAt: d.submittedAt?.toDate().toISOString() ?? '',
          rating: (d.rating as number) ?? 0,
          comment: (d.comment as string) ?? '',
          verifierName: verifierNames.get(d.controlId as string) ?? '',
        }
      }))
    } catch (error) {
      return err(`Impossible de charger les feedbacks. Erreur: ${(error as Error).message}`)
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
