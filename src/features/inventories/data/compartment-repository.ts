import { adminDb } from '@/shared/data/firebase-admin'
import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import { chunkArray, FIRESTORE_BATCH_LIMIT } from '@/shared/lib/array'
import type { Compartment } from '../domain/types'

export async function checkCompartmentOwnership(compartmentId: string, inventoryId: string): Promise<Result<void>> {
  try {
    const doc = await adminDb.collection('emplacements').doc(compartmentId).get()
    if (!doc.exists) return err('Emplacement introuvable.')
    if (doc.data()!.inventoryId !== inventoryId) return err('Accès non autorisé.')
    return ok(undefined)
  } catch (error) {
    return err(`Erreur de vérification. Erreur: ${(error as Error).message}`)
  }
}

export async function checkCompartmentIdsOwnership(inventoryId: string, compartmentIds: string[]): Promise<Result<void>> {
  try {
    const snap = await adminDb.collection('emplacements').where('inventoryId', '==', inventoryId).get()
    const validIds = new Set(snap.docs.map((d) => d.id))
    if (compartmentIds.some((id) => !validIds.has(id))) return err('Accès non autorisé.')
    return ok(undefined)
  } catch (error) {
    return err(`Erreur de vérification. Erreur: ${(error as Error).message}`)
  }
}

export async function createCompartment(inventoryId: string, name: string): Promise<Result<Compartment>> {
  try {
    const existing = await adminDb.collection('emplacements').where('inventoryId', '==', inventoryId).count().get()
    const order = existing.data().count + 1
    const ref = await adminDb.collection('emplacements').add({ inventoryId, name, order })
    return ok({ id: ref.id, name, order, inventoryId })
  } catch (error) {
    return err(`Impossible de créer l'emplacement. Erreur: ${(error as Error).message}`)
  }
}

export async function updateCompartment(compartmentId: string, name: string): Promise<Result<void>> {
  try {
    await adminDb.collection('emplacements').doc(compartmentId).update({ name })
    return ok(undefined)
  } catch (error) {
    return err(`Impossible de modifier l'emplacement. Erreur: ${(error as Error).message}`)
  }
}

export async function deleteCompartment(compartmentId: string): Promise<Result<void>> {
  try {
    const itemsSnap = await adminDb.collection('materiels').where('compartmentId', '==', compartmentId).get()
    const refs = [
      ...itemsSnap.docs.map((d) => adminDb.collection('materiels').doc(d.id)),
      adminDb.collection('emplacements').doc(compartmentId),
    ]
    for (const chunk of chunkArray(refs, FIRESTORE_BATCH_LIMIT)) {
      const batch = adminDb.batch()
      chunk.forEach((ref) => batch.delete(ref))
      await batch.commit()
    }
    return ok(undefined)
  } catch (error) {
    return err(`Impossible de supprimer l'emplacement. Erreur: ${(error as Error).message}`)
  }
}

export async function reorderCompartments(inventoryId: string, orderedIds: string[]): Promise<Result<void>> {
  try {
    for (const chunk of chunkArray(orderedIds.map((id, index) => ({ id, order: index + 1 })), FIRESTORE_BATCH_LIMIT)) {
      const batch = adminDb.batch()
      chunk.forEach(({ id, order }) => batch.update(adminDb.collection('emplacements').doc(id), { order }))
      await batch.commit()
    }
    return ok(undefined)
  } catch (error) {
    return err(`Impossible de réordonner les emplacements. Erreur: ${(error as Error).message}`)
  }
}
