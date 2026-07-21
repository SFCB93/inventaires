import Link from 'next/link'
import type { InventoryWithCompartmentCount } from '../domain/types'

interface InventoryListItemProps {
  inventory: InventoryWithCompartmentCount
  isDuplicating?: boolean
  duplicateError?: string | null
  onDuplicate?: () => void
}

export function InventoryListItem({ inventory, isDuplicating, duplicateError, onDuplicate }: InventoryListItemProps) {
  return (
    <li
      data-testid={`inventory-item-${inventory.id}`}
      className="flex flex-col gap-1 px-5 py-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{inventory.name}</p>
          <p className="text-sm text-slate-400 mt-0.5">
            {inventory.compartmentCount === 0
              ? 'Aucun emplacement'
              : `${inventory.compartmentCount} emplacement${inventory.compartmentCount > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            data-testid={`btn-duplicate-inventory-${inventory.id}`}
            onClick={onDuplicate}
            disabled={isDuplicating}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50"
            aria-label={`Dupliquer l'inventaire ${inventory.name}`}
          >
            {isDuplicating ? 'Duplication…' : 'Dupliquer'}
          </button>
          <Link
            href={`/dashboard/inventaires/${inventory.id}`}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
            aria-label={`Gérer l'inventaire ${inventory.name}`}
          >
            Gérer →
          </Link>
        </div>
      </div>
      {duplicateError && (
        <p role="alert" className="text-xs text-red-600">{duplicateError}</p>
      )}
    </li>
  )
}
