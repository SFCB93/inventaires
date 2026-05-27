export type Inventory = {
  id: string
  name: string
  associationId: string
}

export type InventoryWithCompartmentCount = Inventory & {
  compartmentCount: number
}

export type Compartment = {
  id: string
  name: string
  order: number
  inventoryId: string
}

export type Item = {
  id: string
  name: string
  photoUrl: string
  hasExpiry: boolean
  isCritical: boolean
  order: number
  compartmentId: string
}

export type CompartmentWithItems = Compartment & {
  items: Item[]
}

export type InventoryWithCompartments = Inventory & {
  compartments: CompartmentWithItems[]
}
