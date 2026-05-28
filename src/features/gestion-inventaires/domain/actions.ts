'use server'

import { revalidatePath } from 'next/cache'
import { getAuthenticatedUser } from '@/shared/lib/auth'
import { err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import type { Inventory, Compartment, Item, InventoryWithCompartmentCount } from './types'
import * as uc from './use-cases'

const BASE = '/dashboard/inventaires'
const path = (id: string) => `${BASE}/${id}`

export async function listInventoriesAction(): Promise<Result<InventoryWithCompartmentCount[]>> {
  const user = await getAuthenticatedUser()
  if (!user) return err('Non authentifié.')
  return uc.listInventoriesUseCase(user.associationId)
}
export async function createInventoryAction(name: string): Promise<Result<Inventory>> {
  const user = await getAuthenticatedUser()
  if (!user) return err('Non authentifié.')
  const result = await uc.createInventoryUseCase(user.associationId, name)
  if (result.ok) revalidatePath(BASE)
  return result
}
export async function updateInventoryAction(inventoryId: string, name: string): Promise<Result<void>> {
  const user = await getAuthenticatedUser()
  if (!user) return err('Non authentifié.')
  const result = await uc.updateInventoryUseCase(inventoryId, user.associationId, name)
  if (result.ok) revalidatePath(path(inventoryId))
  return result
}
export async function deleteInventoryAction(inventoryId: string): Promise<Result<void>> {
  const user = await getAuthenticatedUser()
  if (!user) return err('Non authentifié.')
  const result = await uc.deleteInventoryUseCase(inventoryId, user.associationId)
  if (result.ok) revalidatePath(BASE)
  return result
}
export async function createCompartmentAction(inventoryId: string, name: string): Promise<Result<Compartment>> {
  const user = await getAuthenticatedUser()
  if (!user) return err('Non authentifié.')
  const result = await uc.createCompartmentUseCase(inventoryId, name)
  if (result.ok) revalidatePath(path(inventoryId))
  return result
}
export async function updateCompartmentAction(inventoryId: string, compartmentId: string, name: string): Promise<Result<void>> {
  const user = await getAuthenticatedUser()
  if (!user) return err('Non authentifié.')
  const result = await uc.updateCompartmentUseCase(compartmentId, name)
  if (result.ok) revalidatePath(path(inventoryId))
  return result
}
export async function deleteCompartmentAction(inventoryId: string, compartmentId: string): Promise<Result<void>> {
  const user = await getAuthenticatedUser()
  if (!user) return err('Non authentifié.')
  const result = await uc.deleteCompartmentUseCase(compartmentId)
  if (result.ok) revalidatePath(path(inventoryId))
  return result
}
export async function reorderCompartmentsAction(inventoryId: string, orderedIds: string[]): Promise<Result<void>> {
  const user = await getAuthenticatedUser()
  if (!user) return err('Non authentifié.')
  const result = await uc.reorderCompartmentsUseCase(inventoryId, orderedIds)
  if (result.ok) revalidatePath(path(inventoryId))
  return result
}
export async function createItemAction(inventoryId: string, data: { compartmentId: string; name: string; photoUrl: string; hasExpiry: boolean; isCritical: boolean }): Promise<Result<Item>> {
  const user = await getAuthenticatedUser()
  if (!user) return err('Non authentifié.')
  const result = await uc.createItemUseCase(data.compartmentId, { name: data.name, photoUrl: data.photoUrl, hasExpiry: data.hasExpiry, isCritical: data.isCritical })
  if (result.ok) revalidatePath(path(inventoryId))
  return result
}
export async function updateItemAction(inventoryId: string, itemId: string, data: { name?: string; photoUrl?: string; hasExpiry?: boolean; isCritical?: boolean }): Promise<Result<void>> {
  const user = await getAuthenticatedUser()
  if (!user) return err('Non authentifié.')
  const result = await uc.updateItemUseCase(itemId, data)
  if (result.ok) revalidatePath(path(inventoryId))
  return result
}
export async function deleteItemAction(inventoryId: string, itemId: string): Promise<Result<void>> {
  const user = await getAuthenticatedUser()
  if (!user) return err('Non authentifié.')
  const result = await uc.deleteItemUseCase(itemId)
  if (result.ok) revalidatePath(path(inventoryId))
  return result
}
export async function reorderItemsAction(inventoryId: string, compartmentId: string, orderedIds: string[]): Promise<Result<void>> {
  const user = await getAuthenticatedUser()
  if (!user) return err('Non authentifié.')
  const result = await uc.reorderItemsUseCase(compartmentId, orderedIds)
  if (result.ok) revalidatePath(path(inventoryId))
  return result
}
