'use client'

import type { MileageEntry } from '../domain/types'
import { LogFormHeader } from './LogFormHeader'
import { formatDateTime } from '@/shared/lib/format'

interface MileageLogFormProps {
  history: MileageEntry[]
  isLoadingHistory?: boolean
  historyError?: string
  km: string
  onKmChange: (value: string) => void
  mission: string
  onMissionChange: (value: string) => void
  isSubmitting?: boolean
  error?: string
  onSubmit: () => void
  onBack: () => void
}

export function MileageLogForm({
  history,
  isLoadingHistory = false,
  historyError,
  km,
  onKmChange,
  mission,
  onMissionChange,
  isSubmitting = false,
  error,
  onSubmit,
  onBack,
}: MileageLogFormProps) {
  return (
    <div className="flex flex-col min-h-dvh bg-white">
      <LogFormHeader title="Kilométrage" onBack={onBack} />

      <div className="flex-1 px-5 py-5 space-y-6">
        <div>
          <label htmlFor="input-mileage-km" className="block text-sm font-medium text-slate-700 mb-1.5">
            Kilométrage <span className="text-red-500">*</span>
          </label>
          <input
            id="input-mileage-km"
            data-testid="input-mileage-km"
            type="number"
            inputMode="numeric"
            value={km}
            onChange={(e) => onKmChange(e.target.value)}
            placeholder="Ex. : 84200"
            className="w-full h-12 rounded-xl border-2 border-slate-200 px-3 text-base focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="input-mileage-mission" className="block text-sm font-medium text-slate-700 mb-1.5">
            Mission <span className="text-red-500">*</span>
          </label>
          <input
            id="input-mileage-mission"
            data-testid="input-mileage-mission"
            type="text"
            value={mission}
            onChange={(e) => onMissionChange(e.target.value)}
            placeholder="Ex. : Transport secondaire CHU"
            className="w-full h-12 rounded-xl border-2 border-slate-200 px-3 text-base focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
        )}

        <button
          type="button"
          data-testid="btn-submit-mileage"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full h-14 rounded-2xl bg-blue-600 text-white text-base font-semibold shadow-md shadow-blue-100 disabled:opacity-50 active:scale-95 transition-transform"
        >
          {isSubmitting ? 'Envoi en cours…' : 'Enregistrer'}
        </button>

        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
            Relevés précédents
          </h3>
          {isLoadingHistory ? (
            <div className="space-y-2" data-testid="mileage-history-skeleton">
              {[0, 1].map((i) => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}
            </div>
          ) : historyError ? (
            <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{historyError}</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-slate-400 px-1">Aucun relevé pour l&apos;instant.</p>
          ) : (
            <ul className="space-y-2" data-testid="mileage-history-list">
              {history.map((entry) => (
                <li key={entry.id} className="rounded-xl border border-slate-200 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{entry.km.toLocaleString('fr-FR')} km</p>
                    <p className="text-xs text-slate-400">{formatDateTime(entry.submittedAt)}</p>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{entry.mission} — {entry.submittedBy}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
