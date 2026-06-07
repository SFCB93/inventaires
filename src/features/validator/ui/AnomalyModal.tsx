'use client'

import { useAnomalyModal } from './hooks/useAnomalyModal'

interface AnomalyModalProps {
  isOpen: boolean
  onConfirm: (comment: string) => void
  // SPEC AMBIGUË : la spec dit "bloque la fermeture si vide" mais ne dit pas si on peut annuler.
  // On expose onCancel pour permettre de revenir aux boutons de décision sans valider.
  onCancel: () => void
}

export function AnomalyModal({ isOpen, onConfirm, onCancel }: AnomalyModalProps) {
  const { comment, setComment, error, handleConfirm, handleCancel } =
    useAnomalyModal(isOpen, onConfirm, onCancel)

  if (!isOpen) return null

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="anomaly-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-t-3xl px-5 pt-2 pb-10">
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5 mt-3" aria-hidden="true" />

        <div className="flex items-center gap-2 mb-4">
          <span className="text-amber-500 text-xl" aria-hidden="true">⚠</span>
          <h3 id="anomaly-modal-title" className="text-lg font-bold text-slate-900">
            Décrire l&apos;anomalie
          </h3>
        </div>

        <div className="mb-4">
          <label htmlFor="textarea-anomaly" className="block text-sm font-medium text-slate-600 mb-1.5">
            Commentaire <span className="text-red-500">*</span>
          </label>
          <textarea
            id="textarea-anomaly"
            autoFocus
            data-testid="textarea-anomaly"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Ex. : produit périmé, quantité insuffisante, emballage endommagé…"
            className={`w-full rounded-xl border-2 px-3 py-2.5 text-base resize-none
                        focus:outline-none focus:border-amber-400 transition-colors
                        ${error ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
          />
          {error && (
            <p role="alert" className="mt-1.5 text-sm text-red-600">
              Le commentaire est obligatoire pour signaler une anomalie.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <button data-testid="btn-confirm-anomaly" onClick={handleConfirm}
            className="w-full h-14 rounded-2xl bg-amber-500 text-white text-base font-semibold shadow-sm active:scale-95 transition-transform">
            Confirmer l&apos;anomalie
          </button>
          <button data-testid="btn-cancel-anomaly" onClick={handleCancel}
            className="w-full h-12 rounded-2xl text-slate-500 text-base font-medium active:bg-slate-50 transition-colors">
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}
