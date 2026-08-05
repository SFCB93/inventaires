'use client'

import { LogFormHeader } from './LogFormHeader'

interface AnomalyReportFormProps {
  description: string
  onDescriptionChange: (value: string) => void
  isSubmitting?: boolean
  error?: string
  onSubmit: () => void
  onBack: () => void
}

export function AnomalyReportForm({
  description,
  onDescriptionChange,
  isSubmitting = false,
  error,
  onSubmit,
  onBack,
}: AnomalyReportFormProps) {
  return (
    <div className="flex flex-col min-h-dvh bg-white">
      <LogFormHeader title="Avarie" onBack={onBack} />

      <div className="flex-1 px-5 py-5 space-y-6">
        <p className="text-sm text-slate-500">
          Un mail sera envoyé aux responsables de l&apos;association dès la validation.
        </p>

        <div>
          <label htmlFor="textarea-anomaly-description" className="block text-sm font-medium text-slate-700 mb-1.5">
            Description du problème <span className="text-red-500">*</span>
          </label>
          <textarea
            id="textarea-anomaly-description"
            data-testid="textarea-anomaly-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={5}
            placeholder="Ex. : voyant moteur allumé, freins qui grincent…"
            className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-base resize-none focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
        )}

        <button
          type="button"
          data-testid="btn-submit-anomaly"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full h-14 rounded-2xl bg-amber-500 text-white text-base font-semibold shadow-md shadow-amber-100 disabled:opacity-50 active:scale-95 transition-transform"
        >
          {isSubmitting ? 'Envoi en cours…' : 'Signaler l’avarie'}
        </button>
      </div>
    </div>
  )
}
