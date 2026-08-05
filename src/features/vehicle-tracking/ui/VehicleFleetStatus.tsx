import type { VehicleStatus } from '../domain/types'
import { VehicleStatusRow } from './VehicleStatusRow'

interface VehicleFleetStatusProps {
  vehicles: VehicleStatus[]
  isLoading?: boolean
  onSelectVehicle: (inventoryId: string) => void
  onAddClick: () => void
}

export function VehicleFleetStatus({ vehicles, isLoading = false, onSelectVehicle, onAddClick }: VehicleFleetStatusProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Suivi des véhicules</h1>
        <button
          data-testid="btn-add-vehicle-device"
          onClick={onAddClick}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white
                     text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <span aria-hidden="true">+</span>
          Ajouter
        </button>
      </div>

      {isLoading ? (
        <ul className="space-y-2" data-testid="vehicle-fleet-skeleton">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </ul>
      ) : vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4" aria-hidden="true">🚐</div>
          <p className="text-slate-600 font-medium mb-1">Aucun véhicule associé pour l&apos;instant.</p>
          <p className="text-slate-400 text-sm mb-6">
            Associez une carte IoT à un inventaire pour commencer le suivi.
          </p>
          <button
            data-testid="btn-add-vehicle-device-empty"
            onClick={onAddClick}
            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold
                       hover:bg-blue-700 transition-colors"
          >
            Ajouter
          </button>
        </div>
      ) : (
        <ul className="space-y-2" data-testid="vehicle-fleet-list">
          {vehicles.map((vehicle) => (
            <VehicleStatusRow
              key={vehicle.inventoryId}
              vehicle={vehicle}
              onSelect={() => onSelectVehicle(vehicle.inventoryId)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
