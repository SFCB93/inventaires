import { adminDb, adminAuth } from '@/shared/data/firebase-admin'
import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import { DEFAULT_ALERT_THRESHOLD_DAYS, DEFAULT_ALERT_INTERVAL_DAYS } from '@/shared/lib/alert-defaults'
import type { AssociationSettings, UpdateAssociationInput } from '../domain/types'

export const settingsRepository = {
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
