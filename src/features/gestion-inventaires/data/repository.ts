import { listInventories, getInventory, checkInventoryOwnership, createInventory, updateInventory, deleteInventory, duplicateInventory } from './inventory-repository'
import { createCompartment, updateCompartment, deleteCompartment, reorderCompartments } from './compartment-repository'
import { createItem, updateItem, deleteItem, reorderItems } from './item-repository'

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
  createItem,
  updateItem,
  deleteItem,
  reorderItems,
}
