'use client'

interface VehicleApiDocModalProps {
  isOpen: boolean
  onClose: () => void
}

export function VehicleApiDocModal({ isOpen, onClose }: VehicleApiDocModalProps) {
  if (!isOpen) return null

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vehicle-api-doc-title"
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 mx-4 max-h-[90vh] overflow-y-auto">
        <h2 id="vehicle-api-doc-title" className="text-lg font-bold text-slate-900 mb-4">
          Requête HTTP à envoyer par la carte
        </h2>

        <p className="text-sm text-slate-500 mb-4">
          À chaque mise à jour d&apos;état, la carte envoie une requête authentifiée par sa clé API.
        </p>

        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-700 mb-1">Endpoint</p>
          <code className="block text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 break-all">
            POST {origin}/api/vehicle-status
          </code>
        </div>

        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-700 mb-1">En-têtes</p>
          <pre className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 overflow-x-auto">
            {'Authorization: Bearer <clé API du device>\nContent-Type: application/json'}
          </pre>
        </div>

        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-700 mb-1">Corps de la requête (JSON)</p>
          <pre className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 overflow-x-auto">
            {'{\n  "lat": 48.8566,\n  "lng": 2.3522,\n  "isCircuitCut": false,\n  "timestamp": "2026-08-05T14:32:00Z"\n}'}
          </pre>
        </div>

        <div className="mb-5">
          <p className="text-xs font-semibold text-slate-700 mb-1">Réponses</p>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>
              <code className="text-slate-900">200</code> — position enregistrée (ou ignorée si sans changement)
            </li>
            <li>
              <code className="text-slate-900">401</code> — clé API invalide ou révoquée
            </li>
            <li>
              <code className="text-slate-900">400</code> — corps de requête invalide
            </li>
            <li>
              <code className="text-slate-900">429</code> — trop de requêtes envoyées
            </li>
          </ul>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            data-testid="btn-close-vehicle-api-doc"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
