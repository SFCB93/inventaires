import type { LogbookHistoryEntry } from '../domain/types'
import { getLogbookEntryIcon, getLogbookEntryLabel, getLogbookEntryDetail } from './logbookEntrySummary'
import { formatDateTime } from '@/shared/lib/format'

interface VehicleLogbookHistoryProps {
  entries: LogbookHistoryEntry[]
  isLoading?: boolean
}

export function VehicleLogbookHistory({ entries, isLoading = false }: VehicleLogbookHistoryProps) {
  return (
    <div>
      <h2 className="font-semibold text-slate-900 mb-3">Carnet de bord</h2>

      {isLoading ? (
        <ul className="space-y-2" data-testid="logbook-history-skeleton">
          {[0, 1, 2].map((i) => <li key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}
        </ul>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-slate-200 py-8 text-center" data-testid="logbook-history-empty">
          <p className="text-slate-400 text-sm">Aucune entrée pour l&apos;instant.</p>
        </div>
      ) : (
        <ul className="space-y-2" data-testid="logbook-history-list">
          {entries.map((entry) => (
            <li
              key={entry.id}
              data-testid={`logbook-entry-${entry.id}`}
              className="flex items-start gap-3 rounded-xl border border-slate-200 px-4 py-3"
            >
              <span className="text-xl" aria-hidden="true">{getLogbookEntryIcon(entry.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900 text-sm">{getLogbookEntryLabel(entry.type)}</p>
                  <p className="text-xs text-slate-400 flex-shrink-0">{formatDateTime(entry.submittedAt)}</p>
                </div>
                <p className="text-sm text-slate-500 mt-0.5 truncate">{getLogbookEntryDetail(entry)}</p>
                <p className="text-xs text-slate-400 mt-0.5">{entry.submittedBy}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
