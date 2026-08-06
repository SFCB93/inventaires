// Dépasse 120 lignes : couvre les use cases inventaire, emplacement et matériel dans une même feature.
import type { Result } from '@/shared/domain/result'
import { ok, err } from '@/shared/domain/result'
import { inventoryRepository } from '../data/repository'
import type {
  Inventory,
  InventoryWithCompartmentCount,
  InventoryWithCompartments,
  Compartment,
  Item,
} from './types'

export async function listInventoriesUseCase(
  associationId: string,
): Promise<Result<InventoryWithCompartmentCount[]>> {
  return inventoryRepository.listInventories(associationId)
}

export async function getInventoryUseCase(
  inventoryId: string,
  associationId: string,
): Promise<Result<InventoryWithCompartments>> {
  return inventoryRepository.getInventory(inventoryId, associationId)
}

export async function createInventoryUseCase(
  associationId: string,
  name: string,
): Promise<Result<Inventory>> {
  if (!name.trim()) return err("Le nom de l'inventaire est obligatoire.")
  return inventoryRepository.createInventory(associationId, name.trim())
}

export async function updateInventoryUseCase(
  inventoryId: string,
  associationId: string,
  name: string,
): Promise<Result<void>> {
  if (!name.trim()) return err("Le nom de l'inventaire est obligatoire.")
  return inventoryRepository.updateInventory(inventoryId, associationId, name.trim())
}

export async function deleteInventoryUseCase(
  inventoryId: string,
  associationId: string,
): Promise<Result<void>> {
  return inventoryRepository.deleteInventory(inventoryId, associationId)
}

export async function duplicateInventoryUseCase(
  inventoryId: string,
  associationId: string,
): Promise<Result<Inventory>> {
  return inventoryRepository.duplicateInventory(inventoryId, associationId)
}

export async function verifyInventoryOwnershipUseCase(
  inventoryId: string,
  associationId: string,
): Promise<Result<void>> {
  return inventoryRepository.checkInventoryOwnership(inventoryId, associationId)
}

export async function createCompartmentUseCase(
  inventoryId: string,
  name: string,
): Promise<Result<Compartment>> {
  if (!name.trim()) return err("Le nom de l'emplacement est obligatoire.")
  return inventoryRepository.createCompartment(inventoryId, name.trim())
}

export async function updateCompartmentUseCase(
  inventoryId: string,
  compartmentId: string,
  name: string,
): Promise<Result<void>> {
  if (!name.trim()) return err("Le nom de l'emplacement est obligatoire.")
  const owned = await inventoryRepository.checkCompartmentOwnership(compartmentId, inventoryId)
  if (!owned.ok) return owned
  return inventoryRepository.updateCompartment(compartmentId, name.trim())
}

export async function deleteCompartmentUseCase(inventoryId: string, compartmentId: string): Promise<Result<void>> {
  const owned = await inventoryRepository.checkCompartmentOwnership(compartmentId, inventoryId)
  if (!owned.ok) return owned
  return inventoryRepository.deleteCompartment(compartmentId)
}

export async function reorderCompartmentsUseCase(
  inventoryId: string,
  orderedIds: string[],
): Promise<Result<void>> {
  if (orderedIds.length === 0) return ok(undefined)
  const owned = await inventoryRepository.checkCompartmentIdsOwnership(inventoryId, orderedIds)
  if (!owned.ok) return owned
  return inventoryRepository.reorderCompartments(inventoryId, orderedIds)
}

export async function createItemUseCase(
  inventoryId: string,
  compartmentId: string,
  data: { name: string; photoUrl: string; hasExpiry: boolean; isCritical: boolean },
): Promise<Result<Item>> {
  if (!data.name.trim()) return err("Le nom du matériel est obligatoire.")
  const owned = await inventoryRepository.checkCompartmentOwnership(compartmentId, inventoryId)
  if (!owned.ok) return owned
  return inventoryRepository.createItem(compartmentId, {
    name: data.name.trim(),
    photoUrl: data.photoUrl,
    hasExpiry: data.hasExpiry,
    isCritical: data.isCritical,
  })
}

export async function updateItemUseCase(
  inventoryId: string,
  itemId: string,
  data: { name?: string; photoUrl?: string; hasExpiry?: boolean; isCritical?: boolean },
): Promise<Result<void>> {
  if (data.name !== undefined && !data.name.trim()) return err("Le nom du matériel est obligatoire.")
  const owned = await inventoryRepository.checkItemOwnership(itemId, inventoryId)
  if (!owned.ok) return owned
  return inventoryRepository.updateItem(itemId, {
    ...data,
    name: data.name?.trim(),
  })
}

export async function deleteItemUseCase(inventoryId: string, itemId: string): Promise<Result<void>> {
  const owned = await inventoryRepository.checkItemOwnership(itemId, inventoryId)
  if (!owned.ok) return owned
  return inventoryRepository.deleteItem(itemId)
}

export async function reorderItemsUseCase(
  inventoryId: string,
  compartmentId: string,
  orderedIds: string[],
): Promise<Result<void>> {
  if (orderedIds.length === 0) return ok(undefined)
  const ownedCompartment = await inventoryRepository.checkCompartmentOwnership(compartmentId, inventoryId)
  if (!ownedCompartment.ok) return ownedCompartment
  const owned = await inventoryRepository.checkItemIdsOwnership(compartmentId, orderedIds)
  if (!owned.ok) return owned
  return inventoryRepository.reorderItems(compartmentId, orderedIds)
}
