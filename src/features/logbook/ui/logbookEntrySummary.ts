import type { LogbookHistoryEntry, LogbookEntryType } from '../domain/types'

const ICONS: Record<LogbookEntryType, string> = {
  mileage: '🛣️',
  fuel: '⛽',
  anomaly: '⚠️',
  maintenance: '🔧',
  disinfection: '🧴',
}

const LABELS: Record<LogbookEntryType, string> = {
  mileage: 'Kilométrage',
  fuel: 'Carburant',
  anomaly: 'Avarie',
  maintenance: 'Maintenance',
  disinfection: 'Désinfection',
}

export function getLogbookEntryIcon(type: LogbookEntryType): string {
  return ICONS[type]
}

export function getLogbookEntryLabel(type: LogbookEntryType): string {
  return LABELS[type]
}

export function getLogbookEntryDetail(entry: LogbookHistoryEntry): string {
  switch (entry.type) {
    case 'mileage':
      return `${entry.km?.toLocaleString('fr-FR')} km — ${entry.mission}`
    case 'fuel':
      return `${entry.fuelLiters} L${entry.amountEuros !== undefined ? ` · ${entry.amountEuros} €` : ''}${entry.documentUrl ? ' · justificatif joint' : ''}`
    case 'anomaly':
      return entry.description ?? ''
    case 'maintenance':
      return `${entry.description ?? ''}${entry.documentUrl ? ' · justificatif joint' : ''}`
    case 'disinfection':
      return entry.disinfectionProtocol === 'approfondie' ? 'Protocole approfondie' : 'Protocole périodique'
  }
}
