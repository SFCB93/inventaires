import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/shared/data/firebase-admin'
import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import { DEFAULT_ALERT_THRESHOLD_DAYS, DEFAULT_ALERT_INTERVAL_DAYS } from '@/shared/lib/alert-defaults'

export type AssociationAlertConfig = {
  id: string
  name: string
  notificationEmails: string[]
  alertThresholdDays: number
  alertIntervalDays: number
}

export type AlertLogEntry = {
  inventoryId: string
  lastSentAt: Date
}

export const expiryAlertsRepository = {
  async getAllAssociationsConfig(): Promise<Result<AssociationAlertConfig[]>> {
    try {
      const snap = await adminDb.collection('associations').get()
      return ok(snap.docs.map((doc) => {
        const d = doc.data()
        return {
          id: doc.id,
          name: (d.name as string) ?? '',
          notificationEmails: (d.notificationEmails as string[]) ?? [],
          alertThresholdDays: (d.alertThresholdDays as number | undefined) ?? DEFAULT_ALERT_THRESHOLD_DAYS,
          alertIntervalDays: (d.alertIntervalDays as number | undefined) ?? DEFAULT_ALERT_INTERVAL_DAYS,
        }
      }))
    } catch (error) {
      return err(`Impossible de charger les associations. Erreur: ${(error as Error).message}`)
    }
  },

  async getAlertLog(associationId: string): Promise<Map<string, AlertLogEntry>> {
    const map = new Map<string, AlertLogEntry>()
    try {
      const snap = await adminDb
        .collection('expiry-alert-log')
        .where('associationId', '==', associationId)
        .get()
      for (const doc of snap.docs) {
        const d = doc.data()
        map.set(doc.id, {
          inventoryId: (d.inventoryId as string) ?? '',
          lastSentAt: d.lastSentAt?.toDate() ?? new Date(0),
        })
      }
    } catch { /* returns empty map — non-blocking */ }
    return map
  },

  async upsertAlertLogEntries(
    items: Array<{ itemId: string; inventoryId: string; associationId: string }>,
  ): Promise<void> {
    if (items.length === 0) return
    try {
      const batch = adminDb.batch()
      for (const item of items) {
        const ref = adminDb.collection('expiry-alert-log').doc(item.itemId)
        batch.set(ref, {
          associationId: item.associationId,
          inventoryId: item.inventoryId,
          lastSentAt: FieldValue.serverTimestamp(),
        })
      }
      await batch.commit()
    } catch (error) {
      console.error('[expiryAlertsRepository.upsertAlertLogEntries]', error)
    }
  },
}
