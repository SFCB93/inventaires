export interface VehicleStatus {
  inventoryId: string
  name: string
  isCircuitCut: boolean | null
  position: { lat: number; lng: number } | null
  stableSince: Date | null
  lastSeenAt: Date | null
}

export interface UnlinkedInventory {
  inventoryId: string
  name: string
}

export interface PositionPoint {
  lat: number
  lng: number
  timestamp: Date
  isCircuitCut: boolean
}

export type TimeRange = '24h' | '7d' | '30d' | '90d'
