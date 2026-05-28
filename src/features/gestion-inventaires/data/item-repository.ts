import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/shared/data/firebase-admin'
import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import type { Item } from '../domain/types'

export async function createItem(
  compartmentId: string,
  data: { name: string; photoUrl: string; hasExpiry: boolean; isCritical: boolean },
): Promise<Result<Item>> {
  try {
    const existing = await adminDb.collection('materiels').where('compartmentId', '==', compartmentId).get()
    const order = existing.size + 1
    const ref = await adminDb.collection('materiels').add({ compartmentId, ...data, order })
    return ok({ id: ref.id, name: data.name, photoUrl: data.photoUrl, hasExpiry: data.hasExpiry, isCritical: data.isCritical, order, compartmentId })
  } catch (error) {
    return err(`Impossible de créer le matériel. Erreur: ${(error as Error).message}`)
  }
}

export async function updateItem(
  itemId: string,
  data: { name?: string; photoUrl?: string; hasExpiry?: boolean; isCritical?: boolean },
): Promise<Result<void>> {
  try {
    await adminDb.collection('materiels').doc(itemId).update({ ...data, updatedAt: FieldValue.serverTimestamp() })
    return ok(undefined)
  } catch (error) {
    return err(`Impossible de modifier le matériel. Erreur: ${(error as Error).message}`)
  }
}

export async function deleteItem(itemId: string): Promise<Result<void>> {
  try {
    await adminDb.collection('materiels').doc(itemId).delete()
    return ok(undefined)
  } catch (error) {
    return err(`Impossible de supprimer le matériel. Erreur: ${(error as Error).message}`)
  }
}

export async function reorderItems(compartmentId: string, orderedIds: string[]): Promise<Result<void>> {
  try {
    const batch = adminDb.batch()
    orderedIds.forEach((id, index) => {
      batch.update(adminDb.collection('materiels').doc(id), { order: index + 1 })
    })
    await batch.commit()
    return ok(undefined)
  } catch (error) {
    return err(`Impossible de réordonner les matériels. Erreur: ${(error as Error).message}`)
  }
}
