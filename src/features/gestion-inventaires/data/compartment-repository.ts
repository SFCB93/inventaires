import { adminDb } from '@/shared/data/firebase-admin'
import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import type { Compartment } from '../domain/types'
import { deleteStorageFile } from './repository-shared'

export async function createCompartment(inventoryId: string, name: string): Promise<Result<Compartment>> {
  try {
    const existing = await adminDb.collection('emplacements').where('inventoryId', '==', inventoryId).get()
    const order = existing.size + 1
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
    await Promise.all(
      itemsSnap.docs.filter((d) => d.data().photoStoragePath).map((d) => deleteStorageFile(d.data().photoStoragePath as string)),
    )
    const batch = adminDb.batch()
    itemsSnap.docs.forEach((d) => batch.delete(adminDb.collection('materiels').doc(d.id)))
    batch.delete(adminDb.collection('emplacements').doc(compartmentId))
    await batch.commit()
    return ok(undefined)
  } catch (error) {
    return err(`Impossible de supprimer l'emplacement. Erreur: ${(error as Error).message}`)
  }
}

export async function reorderCompartments(inventoryId: string, orderedIds: string[]): Promise<Result<void>> {
  try {
    const batch = adminDb.batch()
    orderedIds.forEach((id, index) => {
      batch.update(adminDb.collection('emplacements').doc(id), { order: index + 1 })
    })
    await batch.commit()
    return ok(undefined)
  } catch (error) {
    return err(`Impossible de réordonner les emplacements. Erreur: ${(error as Error).message}`)
  }
}
