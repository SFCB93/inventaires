export type Inventory = {
  id: string
  name: string
  associationId: string
}

export type Item = {
  id: string
  name: string
  photoUrl: string
  hasExpiry: boolean
  isCritical: boolean
  order: number
}

export type CompartmentWithItems = {
  id: string
  name: string
  order: number
  items: Item[]
}

export type ItemStatus = 'present' | 'anomaly'

export type ItemResult = {
  itemId: string
  compartmentId: string
  status: ItemStatus
  comment?: string
  expiryDate?: string
}

export type ControlSubmission = {
  inventoryId: string
  verifierName: string
  results: ItemResult[]
}

export type ControlEmailContext = {
  inventoryName: string
  anomalies: { itemName: string; compartmentName: string; comment: string }[]
  expiryDates: { itemName: string; compartmentName: string; date: string }[]
}

export type FeedbackSubmission = {
  controlId: string
  rating: number
  comment: string
}

export type PublicControlSummary = {
  id: string
  verifierName: string
  submittedAt: string
  anomalyCount: number
  anomalies: { itemName: string; compartmentName: string; comment: string }[]
  expiryDates: { itemName: string; compartmentName: string; date: string }[]
}
