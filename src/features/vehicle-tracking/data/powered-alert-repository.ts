import { FieldPath, Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/shared/data/firebase-admin'
import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import { chunkArray, FIRESTORE_IN_LIMIT } from '@/shared/lib/array'

export interface PoweredTooLongRecord {
  inventoryId: string
  associationId: string
  stableSince: Date
}

export async function listPoweredTooLong(before: Date): Promise<Result<PoweredTooLongRecord[]>> {
  try {
    const snap = await adminDb
      .collection('vehicleStatuses')
      .where('isCircuitCut', '==', false)
      .where('poweredAlertSent', '==', false)
      .where('stableSince', '<=', Timestamp.fromDate(before))
      .get()
    return ok(
      snap.docs.map((doc) => {
        const data = doc.data()
        return {
          inventoryId: doc.id,
          associationId: data.associationId as string,
          stableSince: (data.stableSince as Timestamp).toDate(),
        }
      }),
    )
  } catch (error) {
    return err(`Impossible de charger les véhicules alimentés trop longtemps. Erreur: ${(error as Error).message}`)
  }
}

export async function markPoweredAlertSent(inventoryId: string): Promise<Result<void>> {
  try {
    await adminDb.collection('vehicleStatuses').doc(inventoryId).update({ poweredAlertSent: true })
    return ok(undefined)
  } catch (error) {
    return err(`Impossible de marquer l'alerte comme envoyée. Erreur: ${(error as Error).message}`)
  }
}

export interface AssociationNotificationConfig {
  name: string
  notificationEmails: string[]
}

export async function listAssociationNotificationConfigs(
  associationIds: string[],
): Promise<Result<Map<string, AssociationNotificationConfig>>> {
  try {
    const configs = new Map<string, AssociationNotificationConfig>()
    for (const chunk of chunkArray(associationIds, FIRESTORE_IN_LIMIT)) {
      const snap = await adminDb.collection('associations').where(FieldPath.documentId(), 'in', chunk).get()
      for (const doc of snap.docs) {
        const data = doc.data()
        configs.set(doc.id, {
          name: (data.name as string) ?? '',
          notificationEmails: (data.notificationEmails as string[]) ?? [],
        })
      }
    }
    return ok(configs)
  } catch (error) {
    return err(`Impossible de charger la configuration des associations. Erreur: ${(error as Error).message}`)
  }
}
