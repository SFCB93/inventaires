import { adminDb } from '@/shared/data/firebase-admin'
import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import type { Inventory, InventoryWithCompartmentCount, InventoryWithCompartments, CompartmentWithItems, Item } from '../domain/types'
import { deleteStorageFile } from './repository-shared'

export async function listInventories(associationId: string): Promise<Result<InventoryWithCompartmentCount[]>> {
  try {
    const snap = await adminDb.collection('inventaires').where('associationId', '==', associationId).get()
    if (snap.empty) return ok([])
    const ids = snap.docs.map((d) => d.id)
    const countMap = new Map<string, number>()
    for (let i = 0; i < ids.length; i += 30) {
      const chunk = ids.slice(i, i + 30)
      const compSnap = await adminDb.collection('emplacements').where('inventoryId', 'in', chunk).get()
      for (const doc of compSnap.docs) {
        const invId = doc.data().inventoryId as string
        countMap.set(invId, (countMap.get(invId) ?? 0) + 1)
      }
    }
    return ok(snap.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name as string,
      associationId: doc.data().associationId as string,
      compartmentCount: countMap.get(doc.id) ?? 0,
    })))
  } catch (error) {
    return err(`Impossible de charger les inventaires. Erreur: ${(error as Error).message}`)
  }
}

export async function getInventory(inventoryId: string, associationId: string): Promise<Result<InventoryWithCompartments>> {
  try {
    const inventoryDoc = await adminDb.collection('inventaires').doc(inventoryId).get()
    if (!inventoryDoc.exists) return err("Cet inventaire n'existe pas.")
    if (inventoryDoc.data()!.associationId !== associationId) return err('Accès non autorisé.')

    const inventory: Inventory = {
      id: inventoryDoc.id,
      name: inventoryDoc.data()!.name as string,
      associationId: inventoryDoc.data()!.associationId as string,
    }
    const compartmentsSnap = await adminDb.collection('emplacements').where('inventoryId', '==', inventoryId).orderBy('order').get()
    const compartmentIds = compartmentsSnap.docs.map((d) => d.id)
    const itemsByCompartment = new Map<string, Item[]>()

    if (compartmentIds.length > 0) {
      for (let i = 0; i < compartmentIds.length; i += 30) {
        const chunk = compartmentIds.slice(i, i + 30)
        const itemsSnap = await adminDb.collection('materiels').where('compartmentId', 'in', chunk).get()
        for (const doc of itemsSnap.docs) {
          const data = doc.data()
          const item: Item = {
            id: doc.id, name: data.name as string, photoUrl: (data.photoUrl as string) ?? '',
            hasExpiry: (data.hasExpiry as boolean) ?? false,
            isCritical: (data.isCritical as boolean) ?? false, order: (data.order as number) ?? 0,
            compartmentId: data.compartmentId as string,
          }
          const list = itemsByCompartment.get(data.compartmentId) ?? []
          list.push(item)
          itemsByCompartment.set(data.compartmentId, list)
        }
      }
      for (const items of itemsByCompartment.values()) items.sort((a, b) => a.order - b.order)
    }

    const compartments: CompartmentWithItems[] = compartmentsSnap.docs.map((doc) => ({
      id: doc.id, name: doc.data().name as string, order: doc.data().order as number,
      inventoryId, items: itemsByCompartment.get(doc.id) ?? [],
    }))
    return ok({ ...inventory, compartments })
  } catch (error) {
    return err(`Impossible de charger l'inventaire. Erreur: ${(error as Error).message}`)
  }
}

export async function createInventory(associationId: string, name: string): Promise<Result<Inventory>> {
  try {
    const ref = await adminDb.collection('inventaires').add({ name, associationId })
    return ok({ id: ref.id, name, associationId })
  } catch (error) {
    return err(`Impossible de créer l'inventaire. Erreur: ${(error as Error).message}`)
  }
}

export async function updateInventory(inventoryId: string, associationId: string, name: string): Promise<Result<void>> {
  try {
    const doc = await adminDb.collection('inventaires').doc(inventoryId).get()
    if (!doc.exists) return err("Cet inventaire n'existe pas.")
    if (doc.data()!.associationId !== associationId) return err('Accès non autorisé.')
    await adminDb.collection('inventaires').doc(inventoryId).update({ name })
    return ok(undefined)
  } catch (error) {
    return err(`Impossible de modifier l'inventaire. Erreur: ${(error as Error).message}`)
  }
}

export async function deleteInventory(inventoryId: string, associationId: string): Promise<Result<void>> {
  try {
    const doc = await adminDb.collection('inventaires').doc(inventoryId).get()
    if (!doc.exists) return err("Cet inventaire n'existe pas.")
    if (doc.data()!.associationId !== associationId) return err('Accès non autorisé.')
    const compartmentsSnap = await adminDb.collection('emplacements').where('inventoryId', '==', inventoryId).get()
    const compartmentIds = compartmentsSnap.docs.map((d) => d.id)
    const itemDocs: { id: string; photoStoragePath?: string }[] = []

    for (let i = 0; i < compartmentIds.length; i += 30) {
      const chunk = compartmentIds.slice(i, i + 30)
      const itemsSnap = await adminDb.collection('materiels').where('compartmentId', 'in', chunk).get()
      itemDocs.push(...itemsSnap.docs.map((d) => ({ id: d.id, photoStoragePath: d.data().photoStoragePath as string | undefined })))
    }

    await Promise.all(itemDocs.filter((i) => i.photoStoragePath).map((i) => deleteStorageFile(i.photoStoragePath!)))

    const allRefs = [
      ...itemDocs.map((i) => adminDb.collection('materiels').doc(i.id)),
      ...compartmentsSnap.docs.map((d) => adminDb.collection('emplacements').doc(d.id)),
      adminDb.collection('inventaires').doc(inventoryId),
    ]
    for (let i = 0; i < allRefs.length; i += 490) {
      const batch = adminDb.batch()
      allRefs.slice(i, i + 490).forEach((ref) => batch.delete(ref))
      await batch.commit()
    }
    return ok(undefined)
  } catch (error) {
    return err(`Impossible de supprimer l'inventaire. Erreur: ${(error as Error).message}`)
  }
}
