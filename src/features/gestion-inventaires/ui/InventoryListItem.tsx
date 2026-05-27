import Link from 'next/link'
import type { InventoryWithCompartmentCount } from '../domain/types'

interface InventoryListItemProps {
  inventory: InventoryWithCompartmentCount
}

export function InventoryListItem({ inventory }: InventoryListItemProps) {
  return (
    <li
      data-testid={`inventory-item-${inventory.id}`}
      className="flex items-center justify-between px-5 py-4 bg-white rounded-xl
                 border border-slate-200 hover:border-slate-300 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <p className="font-semibold text-slate-900">{inventory.name}</p>
          <p className="text-sm text-slate-400 mt-0.5">
            {inventory.compartmentCount === 0
              ? 'Aucun emplacement'
              : `${inventory.compartmentCount} emplacement${inventory.compartmentCount > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      <Link
        href={`/dashboard/inventaires/${inventory.id}`}
        className="px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600
                   hover:bg-blue-50 transition-colors"
        aria-label={`Gérer l'inventaire ${inventory.name}`}
      >
        Gérer →
      </Link>
    </li>
  )
}
