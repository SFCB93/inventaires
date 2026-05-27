import { listInventories, getInventory, createInventory, updateInventory, deleteInventory } from './inventory-repository'
import { createCompartment, updateCompartment, deleteCompartment, reorderCompartments } from './compartment-repository'
import { createItem, updateItem, deleteItem, reorderItems } from './item-repository'

export const inventoryRepository = {
  listInventories,
  getInventory,
  createInventory,
  updateInventory,
  deleteInventory,
  createCompartment,
  updateCompartment,
  deleteCompartment,
  reorderCompartments,
  createItem,
  updateItem,
  deleteItem,
  reorderItems,
}
