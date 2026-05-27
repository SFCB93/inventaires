import type { Inventory } from '../domain/types'

interface WelcomeScreenProps {
  inventory: Inventory
  compartmentCount: number
  itemCount: number
  onStart: () => void
}

export function WelcomeScreen({
  inventory,
  compartmentCount,
  itemCount,
  onStart,
}: WelcomeScreenProps) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="bg-blue-600 px-6 pt-16 pb-12 text-white">
        <p className="text-blue-200 text-sm font-medium uppercase tracking-widest mb-2">
          Contrôle d'inventaire
        </p>
        <h1 className="text-3xl font-bold leading-tight">{inventory.name}</h1>
      </div>

      <div className="flex-1 flex flex-col px-6 pt-8">
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-slate-50 rounded-2xl px-4 py-5 text-center">
            <p className="text-3xl font-bold text-slate-900">{compartmentCount}</p>
            <p className="text-sm text-slate-500 mt-1">
              emplacement{compartmentCount > 1 ? 's' : ''}
            </p>
          </div>
          <div className="bg-slate-50 rounded-2xl px-4 py-5 text-center">
            <p className="text-3xl font-bold text-slate-900">{itemCount}</p>
            <p className="text-sm text-slate-500 mt-1">
              matériel{itemCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <p className="text-slate-500 text-sm text-center mb-8">
          Vérifiez chaque matériel emplacement par emplacement.
        </p>
      </div>

      <div className="px-6 pb-12">
        <button
          data-testid="btn-start"
          onClick={onStart}
          className="w-full h-16 rounded-2xl bg-blue-600 text-white text-lg font-semibold
                     shadow-md shadow-blue-200 active:scale-95 transition-transform"
        >
          Commencer le contrôle
        </button>
      </div>
    </div>
  )
}
