export type HubAction = 'inventory' | 'mileage' | 'fuel' | 'anomaly' | 'maintenance' | 'disinfection'

export type DisinfectionProtocol = 'periodique' | 'approfondie'

export type LogbookEntryType = 'mileage' | 'fuel' | 'anomaly' | 'maintenance' | 'disinfection'

export interface MileageEntry {
  id: string
  km: number
  mission: string
  submittedBy: string
  submittedAt: Date
}

export interface LogbookHistoryEntry {
  id: string
  type: LogbookEntryType
  submittedBy: string
  submittedAt: Date
  km?: number
  mission?: string
  fuelLiters?: number
  amountEuros?: number
  documentUrl?: string | null
  description?: string
  disinfectionProtocol?: DisinfectionProtocol
}

interface NewLogbookEntryBase {
  inventoryId: string
  associationId: string
  submittedBy: string
}

export type NewLogbookEntry =
  | (NewLogbookEntryBase & { type: 'mileage'; km: number; mission: string })
  | (NewLogbookEntryBase & { type: 'fuel'; fuelLiters: number; amountEuros?: number; documentUrl?: string | null })
  | (NewLogbookEntryBase & { type: 'anomaly'; description: string })
  | (NewLogbookEntryBase & { type: 'maintenance'; description: string; documentUrl?: string | null })
  | (NewLogbookEntryBase & { type: 'disinfection'; disinfectionProtocol: DisinfectionProtocol })
