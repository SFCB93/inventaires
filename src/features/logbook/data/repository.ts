import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/shared/data/firebase-admin'
import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import type { NewLogbookEntry, LogbookHistoryEntry } from '../domain/types'

export async function getInventoryAssociationId(inventoryId: string): Promise<Result<string>> {
  try {
    const doc = await adminDb.collection('inventaires').doc(inventoryId).get()
    if (!doc.exists) return err('Inventaire introuvable.')
    return ok(doc.data()!.associationId as string)
  } catch (error) {
    return err(`Impossible de lire l'inventaire. Erreur: ${(error as Error).message}`)
  }
}

export async function createLogbookEntry(entry: NewLogbookEntry): Promise<Result<void>> {
  try {
    const { inventoryId, associationId, submittedBy, type, ...rest } = entry
    await adminDb.collection('logbookEntries').add({
      inventoryId,
      associationId,
      submittedBy,
      type,
      ...rest,
      submittedAt: FieldValue.serverTimestamp(),
    })
    return ok(undefined)
  } catch (error) {
    return err(`Impossible d'enregistrer l'entrée. Erreur: ${(error as Error).message}`)
  }
}

export async function listLogbookEntries(inventoryId: string): Promise<Result<LogbookHistoryEntry[]>> {
  try {
    const snap = await adminDb
      .collection('logbookEntries')
      .where('inventoryId', '==', inventoryId)
      .orderBy('submittedAt', 'desc')
      .get()
    return ok(
      snap.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          type: data.type,
          submittedBy: data.submittedBy as string,
          submittedAt: (data.submittedAt as Timestamp).toDate(),
          km: data.km as number | undefined,
          mission: data.mission as string | undefined,
          fuelLiters: data.fuelLiters as number | undefined,
          amountEuros: data.amountEuros as number | undefined,
          documentUrl: data.documentUrl as string | null | undefined,
          description: data.description as string | undefined,
          disinfectionProtocol: data.disinfectionProtocol,
        }
      }),
    )
  } catch (error) {
    return err(`Impossible de charger le carnet de bord. Erreur: ${(error as Error).message}`)
  }
}
