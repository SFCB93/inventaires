// Dépasse 120 lignes : opérations croisées Firebase Auth + Firestore pour la gestion des comptes.
import { adminDb, adminAuth } from '@/shared/data/firebase-admin'
import { ok, err } from '@/shared/domain/result'
import { DEFAULT_ALERT_THRESHOLD_DAYS, DEFAULT_ALERT_INTERVAL_DAYS } from '@/shared/lib/alert-defaults'
import type { Result } from '@/shared/domain/result'
import type { AssociationSummary, AssociationSettings, CreateAssociationInput, UpdateAssociationInput, AdminAccount } from '../domain/types'

export const gestionComptesRepository = {
  async listAssociations(): Promise<Result<AssociationSummary[]>> {
    try {
      const [assocSnap, usersSnap] = await Promise.all([
        adminDb.collection('associations').get(),
        adminDb.collection('users').where('role', '==', 'admin').get(),
      ])
      const adminUidByAssoc = new Map<string, string>()
      for (const doc of usersSnap.docs) {
        const assocId = doc.data().associationId as string
        // Seul le premier admin trouvé par association est conservé
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

  async createAssociation(input: CreateAssociationInput): Promise<Result<{ resetLink: string }>> {
    let uid: string | undefined
    try {
      const authUser = await adminAuth.createUser({ email: input.adminEmail })
      uid = authUser.uid
      const assocRef = await adminDb.collection('associations').add({ name: input.name, notificationEmails: [] })
      await adminDb.collection('users').doc(uid).set({ associationId: assocRef.id, role: 'admin' })
      const resetLink = await adminAuth.generatePasswordResetLink(input.adminEmail)
      return ok({ resetLink })
    } catch (error) {
      if (uid) console.error(`[createAssociation] Compte Auth créé (${uid}) mais échec Firestore — nettoyage manuel requis.`)
      else console.error('[createAssociation]', error)
      return err('Impossible de créer l\'association.')
    }
  },

  async getAssociationSettings(associationId: string): Promise<Result<AssociationSettings>> {
    try {
      const doc = await adminDb.collection('associations').doc(associationId).get()
      if (!doc.exists) return err('Association introuvable.')
      const data = doc.data()!
      return ok({
        name: (data.name as string) ?? '',
        notificationEmails: (data.notificationEmails as string[]) ?? [],
        alertThresholdDays: (data.alertThresholdDays as number | undefined) ?? DEFAULT_ALERT_THRESHOLD_DAYS,
        alertIntervalDays: (data.alertIntervalDays as number | undefined) ?? DEFAULT_ALERT_INTERVAL_DAYS,
      })
    } catch (error) {
      console.error('[getAssociationSettings]', error)
      return err('Impossible de charger les paramètres.')
    }
  },

  async updateAssociationSettings(associationId: string, data: UpdateAssociationInput): Promise<Result<void>> {
    try {
      await adminDb.collection('associations').doc(associationId).update({
        name: data.name,
        notificationEmails: data.notificationEmails,
        alertThresholdDays: data.alertThresholdDays,
        alertIntervalDays: data.alertIntervalDays,
      })
      return ok(undefined)
    } catch (error) {
      console.error('[updateAssociationSettings]', error)
      return err('Impossible de mettre à jour les paramètres.')
    }
  },

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

  async createAdminAccount(email: string, associationId: string): Promise<Result<{ resetLink: string }>> {
    let uid: string | undefined
    try {
      const authUser = await adminAuth.createUser({ email })
      uid = authUser.uid
      await adminDb.collection('users').doc(uid).set({ associationId, role: 'admin' })
      const resetLink = await adminAuth.generatePasswordResetLink(email)
      return ok({ resetLink })
    } catch (error) {
      const code = (error as { code?: string }).code
      if (code === 'auth/email-already-exists') return err('Un compte existe déjà avec cet email.')
      if (uid) console.error(`[createAdminAccount] Compte Auth créé (${uid}) mais échec Firestore`)
      return err(`Impossible de créer le compte. Erreur: ${(error as Error).message}`)
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

  async generatePasswordReset(uid: string): Promise<Result<{ email: string; resetLink: string }>> {
    try {
      const authUser = await adminAuth.getUser(uid)
      if (!authUser.email) return err('Aucun email associé à ce compte.')
      const resetLink = await adminAuth.generatePasswordResetLink(authUser.email)
      return ok({ email: authUser.email, resetLink })
    } catch (error) {
      return err(`Impossible de générer le lien. Erreur: ${(error as Error).message}`)
    }
  },
}
