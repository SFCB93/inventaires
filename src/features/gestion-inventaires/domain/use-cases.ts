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

export async function createCompartmentUseCase(
  inventoryId: string,
  name: string,
): Promise<Result<Compartment>> {
  if (!name.trim()) return err("Le nom de l'emplacement est obligatoire.")
  return inventoryRepository.createCompartment(inventoryId, name.trim())
}

export async function updateCompartmentUseCase(
  compartmentId: string,
  name: string,
): Promise<Result<void>> {
  if (!name.trim()) return err("Le nom de l'emplacement est obligatoire.")
  return inventoryRepository.updateCompartment(compartmentId, name.trim())
}

export async function deleteCompartmentUseCase(compartmentId: string): Promise<Result<void>> {
  return inventoryRepository.deleteCompartment(compartmentId)
}

export async function reorderCompartmentsUseCase(
  inventoryId: string,
  orderedIds: string[],
): Promise<Result<void>> {
  if (orderedIds.length === 0) return ok(undefined)
  return inventoryRepository.reorderCompartments(inventoryId, orderedIds)
}

export async function createItemUseCase(
  compartmentId: string,
  data: { name: string; photoUrl: string; hasExpiry: boolean; isCritical: boolean },
): Promise<Result<Item>> {
  if (!data.name.trim()) return err("Le nom du matériel est obligatoire.")
  return inventoryRepository.createItem(compartmentId, {
    name: data.name.trim(),
    photoUrl: data.photoUrl,
    hasExpiry: data.hasExpiry,
    isCritical: data.isCritical,
  })
}

export async function updateItemUseCase(
  itemId: string,
  data: { name?: string; photoUrl?: string; hasExpiry?: boolean; isCritical?: boolean },
): Promise<Result<void>> {
  if (data.name !== undefined && !data.name.trim()) return err("Le nom du matériel est obligatoire.")
  return inventoryRepository.updateItem(itemId, {
    ...data,
    name: data.name?.trim(),
  })
}

export async function deleteItemUseCase(itemId: string): Promise<Result<void>> {
  return inventoryRepository.deleteItem(itemId)
}

export async function reorderItemsUseCase(
  compartmentId: string,
  orderedIds: string[],
): Promise<Result<void>> {
  if (orderedIds.length === 0) return ok(undefined)
  return inventoryRepository.reorderItems(compartmentId, orderedIds)
}
