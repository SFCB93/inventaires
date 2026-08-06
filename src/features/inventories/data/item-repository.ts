import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/shared/data/firebase-admin'
import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import { chunkArray, FIRESTORE_BATCH_LIMIT } from '@/shared/lib/array'
import type { Item } from '../domain/types'

export async function checkItemOwnership(itemId: string, inventoryId: string): Promise<Result<void>> {
  try {
    const itemDoc = await adminDb.collection('materiels').doc(itemId).get()
    if (!itemDoc.exists) return err('Matériel introuvable.')
    const compartmentDoc = await adminDb.collection('emplacements').doc(itemDoc.data()!.compartmentId as string).get()
    if (!compartmentDoc.exists || compartmentDoc.data()!.inventoryId !== inventoryId) return err('Accès non autorisé.')
    return ok(undefined)
  } catch (error) {
    return err(`Erreur de vérification. Erreur: ${(error as Error).message}`)
  }
}

export async function checkItemIdsOwnership(compartmentId: string, itemIds: string[]): Promise<Result<void>> {
  try {
    const snap = await adminDb.collection('materiels').where('compartmentId', '==', compartmentId).get()
    const validIds = new Set(snap.docs.map((d) => d.id))
    if (itemIds.some((id) => !validIds.has(id))) return err('Accès non autorisé.')
    return ok(undefined)
  } catch (error) {
    return err(`Erreur de vérification. Erreur: ${(error as Error).message}`)
  }
}

export async function createItem(
  compartmentId: string,
  data: { name: string; photoUrl: string; hasExpiry: boolean; isCritical: boolean },
): Promise<Result<Item>> {
  try {
    const existing = await adminDb.collection('materiels').where('compartmentId', '==', compartmentId).count().get()
    const order = existing.data().count + 1
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
    for (const chunk of chunkArray(orderedIds.map((id, index) => ({ id, order: index + 1 })), FIRESTORE_BATCH_LIMIT)) {
      const batch = adminDb.batch()
      chunk.forEach(({ id, order }) => batch.update(adminDb.collection('materiels').doc(id), { order }))
      await batch.commit()
    }
    return ok(undefined)
  } catch (error) {
    return err(`Impossible de réordonner les matériels. Erreur: ${(error as Error).message}`)
  }
}
