import type { InventoryWithCompartmentCount } from '../domain/types'
import { InventoryListItem } from './InventoryListItem'

interface InventoryListProps {
  inventories: InventoryWithCompartmentCount[]
  onCreateClick: () => void
}

export function InventoryList({ inventories, onCreateClick }: InventoryListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Mes inventaires</h1>
        <button
          data-testid="btn-create-inventory"
          onClick={onCreateClick}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white
                     text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <span aria-hidden="true">+</span>
          Créer un inventaire
        </button>
      </div>

      {inventories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4" aria-hidden="true">📦</div>
          <p className="text-slate-600 font-medium mb-1">Aucun inventaire pour le moment.</p>
          <p className="text-slate-400 text-sm mb-6">
            Créez votre premier inventaire pour commencer à gérer votre matériel.
          </p>
          <button
            data-testid="btn-create-inventory-empty"
            onClick={onCreateClick}
            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold
                       hover:bg-blue-700 transition-colors"
          >
            Créer un inventaire
          </button>
        </div>
      ) : (
        <ul className="space-y-2" data-testid="inventory-list">
          {inventories.map((inventory) => (
            <InventoryListItem key={inventory.id} inventory={inventory} />
          ))}
        </ul>
      )}
    </div>
  )
}
