import type { VehicleStatus } from '../domain/types'
import { formatRelativeDuration } from '@/shared/lib/format'

interface VehicleStatusRowProps {
  vehicle: VehicleStatus
  onSelect: () => void
}

export function VehicleStatusRow({ vehicle, onSelect }: VehicleStatusRowProps) {
  const { name, isCircuitCut, position, stableSince, lastSeenAt } = vehicle

  return (
    <li data-testid={`vehicle-row-${vehicle.inventoryId}`}>
      <button
        type="button"
        onClick={onSelect}
        aria-label={`Voir l'historique de ${name}`}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-white rounded-xl border
                   border-slate-200 hover:border-slate-300 transition-colors text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-900 truncate">{name}</p>
            {isCircuitCut === null ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border bg-slate-100 text-slate-500 border-slate-200">
                En attente de signal
              </span>
            ) : (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                  isCircuitCut
                    ? 'bg-red-100 text-red-700 border-red-200'
                    : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                }`}
              >
                {isCircuitCut ? 'Coupe-circuit activé' : 'Circuit actif'}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            {position ? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : 'Position inconnue'}
            {stableSince && ` · depuis ${formatRelativeDuration(stableSince)}`}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {lastSeenAt ? `Dernier signal il y a ${formatRelativeDuration(lastSeenAt)}` : 'Aucun signal reçu'}
          </p>
        </div>
        <span className="text-blue-600 text-sm font-medium flex-shrink-0" aria-hidden="true">
          Historique →
        </span>
      </button>
    </li>
  )
}
