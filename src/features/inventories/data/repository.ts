import { listInventories, getInventory, checkInventoryOwnership, createInventory, updateInventory, deleteInventory, duplicateInventory } from './inventory-repository'
import { createCompartment, updateCompartment, deleteCompartment, reorderCompartments, checkCompartmentOwnership, checkCompartmentIdsOwnership } from './compartment-repository'
import { createItem, updateItem, deleteItem, reorderItems, checkItemOwnership, checkItemIdsOwnership } from './item-repository'

export const inventoryRepository = {
  listInventories,
  getInventory,
  checkInventoryOwnership,
  createInventory,
  updateInventory,
  deleteInventory,
  duplicateInventory,
  createCompartment,
  updateCompartment,
  deleteCompartment,
  reorderCompartments,
  checkCompartmentOwnership,
  checkCompartmentIdsOwnership,
  createItem,
  updateItem,
  deleteItem,
  reorderItems,
  checkItemOwnership,
  checkItemIdsOwnership,
}
