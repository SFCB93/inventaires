'use client'

interface PublicAnomalyCorrectionModalProps {
  isOpen: boolean
  itemName: string
  comment: string | null
  correctorName: string
  isSubmitting: boolean
  error?: string
  onCorrectorNameChange: (value: string) => void
  onConfirm: () => void
  onClose: () => void
}

export function PublicAnomalyCorrectionModal({
  isOpen, itemName, comment, correctorName, isSubmitting, error,
  onCorrectorNameChange, onConfirm, onClose,
}: PublicAnomalyCorrectionModalProps) {
  if (!isOpen) return null

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="public-anomaly-correction-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-4">
        <button type="button" onClick={onClose} aria-label="Fermer"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>

        <div>
          <h2 id="public-anomaly-correction-modal-title" className="text-base font-bold text-slate-900">Résoudre l&apos;anomalie</h2>
          <p className="text-sm text-slate-500 mt-0.5">{itemName}</p>
          {comment && <p className="text-xs text-amber-700 mt-1">{comment}</p>}
        </div>

        <p className="text-sm text-slate-600">Confirmer que cette anomalie a été corrigée ?</p>

        <div>
          <label htmlFor="input-corrector-name-anomaly" className="block text-sm font-medium text-slate-700 mb-1.5">
            Corrigé par <span className="text-red-500">*</span>
          </label>
          <input
            id="input-corrector-name-anomaly"
            data-testid="input-corrector-name-anomaly"
            type="text"
            value={correctorName}
            onChange={(e) => onCorrectorNameChange(e.target.value)}
            placeholder="Votre nom"
            className="w-full h-10 rounded-lg border-2 border-slate-200 px-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {error && <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onClose} disabled={isSubmitting}
            className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50">
            Annuler
          </button>
          <button type="button" data-testid="btn-confirm-public-anomaly-correction" onClick={onConfirm} disabled={isSubmitting}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50">
            {isSubmitting ? 'Enregistrement…' : error ? 'Réessayer' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  )
}
