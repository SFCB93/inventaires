// Dépasse 100 lignes en raison du rendu JSX de la liste compartiments × matériels × résultats.
// L'état est extrait dans useSummaryScreen.ts ; pas de logique métier dans ce fichier.
'use client'

import type { CompartmentWithItems, ItemResult } from '../domain/types'
import { useSummaryScreen } from './hooks/useSummaryScreen'
import { formatDate } from '@/shared/lib/format'

interface SummaryScreenProps {
  compartments: CompartmentWithItems[]
  results: ItemResult[]
  onSubmit: (verifierName: string) => void
  isSubmitting: boolean
  error?: string
}

export function SummaryScreen({ compartments, results, onSubmit, isSubmitting, error }: SummaryScreenProps) {
  const { verifierName, setVerifierName, nameError, handleSubmit } = useSummaryScreen(onSubmit)
  const anomalyCount = results.filter((r) => r.status === 'anomaly').length

  return (
    <div className="flex flex-col min-h-dvh bg-white">
      <div className="bg-slate-800 px-5 pt-12 pb-6 text-white">
        <h2 className="text-2xl font-bold">Récapitulatif</h2>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-sm text-slate-300">
            {results.length} matériel{results.length > 1 ? 's' : ''} vérifiés
          </span>
          <span className="text-slate-500">·</span>
          {anomalyCount > 0 ? (
            <span className="text-sm font-semibold text-amber-400">
              {anomalyCount} anomalie{anomalyCount > 1 ? 's' : ''}
            </span>
          ) : (
            <span className="text-sm font-semibold text-emerald-400">Aucune anomalie</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        <div className="space-y-3">
          <div>
            <label htmlFor="input-verifier-name" className="block text-sm font-medium text-slate-700 mb-1.5">
              Votre nom <span className="text-red-500">*</span>
            </label>
            <input
              id="input-verifier-name"
              data-testid="input-verifier-name"
              type="text"
              value={verifierName}
              onChange={(e) => setVerifierName(e.target.value)}
              placeholder="Prénom Nom"
              autoComplete="name"
              className={`w-full h-12 rounded-xl border-2 px-3 text-base focus:outline-none focus:border-blue-500 transition-colors ${nameError ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
            />
            {nameError && (
              <p role="alert" className="mt-1.5 text-sm text-red-600">
                Votre nom est requis pour soumettre le contrôle.
              </p>
            )}
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
          )}
          <button
            data-testid="btn-submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-14 rounded-2xl bg-blue-600 text-white text-base font-semibold shadow-md shadow-blue-100 disabled:opacity-50 active:scale-95 transition-transform"
          >
            {isSubmitting ? 'Envoi en cours…' : error ? 'Réessayer' : 'Soumettre le contrôle'}
          </button>
        </div>

        {compartments.map((compartment) => {
          const compartmentResults = results.filter((r) => r.compartmentId === compartment.id)
          return (
            <div key={compartment.id}>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                {compartment.name}
              </h3>
              <ul className="space-y-2">
                {compartment.items.map((item) => {
                  const result = compartmentResults.find((r) => r.itemId === item.id)
                  const isAnomaly = result?.status === 'anomaly'
                  return (
                    <li key={item.id} data-testid={`summary-item-${item.id}`}
                      className={`flex items-start gap-3 rounded-xl px-4 py-3 ${isAnomaly ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-100'}`}>
                      <span className={`mt-0.5 text-base font-bold ${isAnomaly ? 'text-amber-500' : 'text-emerald-600'}`} aria-hidden="true">
                        {isAnomaly ? '⚠' : '✓'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm">{item.name}</p>
                        {result?.comment && (
                          <p className="text-sm text-amber-700 mt-0.5 leading-snug">{result.comment}</p>
                        )}
                        {result?.expiryDate && (
                          <p className="text-xs text-slate-400 mt-1">
                            Péremption : {formatDate(result.expiryDate)}
                          </p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>

    </div>
  )
}
