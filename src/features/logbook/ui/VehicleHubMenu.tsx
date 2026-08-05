'use client'

import type { HubAction } from '../domain/types'

interface VehicleHubMenuProps {
  inventoryName: string
  driverName: string
  onDriverNameChange: (name: string) => void
  nameError?: boolean
  onSelectAction: (action: HubAction) => void
}

const ACTIONS: { action: HubAction; label: string; icon: string }[] = [
  { action: 'inventory', label: 'Inventaire', icon: '📋' },
  { action: 'mileage', label: 'Kilométrage', icon: '🛣️' },
  { action: 'fuel', label: 'Carburant', icon: '⛽' },
  { action: 'anomaly', label: 'Avarie', icon: '⚠️' },
  { action: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { action: 'disinfection', label: 'Désinfection', icon: '🧴' },
]

export function VehicleHubMenu({
  inventoryName,
  driverName,
  onDriverNameChange,
  nameError = false,
  onSelectAction,
}: VehicleHubMenuProps) {
  return (
    <div className="flex flex-col min-h-dvh bg-white">
      <div className="bg-blue-600 px-6 pt-16 pb-8 text-white">
        <p className="text-blue-200 text-sm font-medium uppercase tracking-widest mb-2">Carnet de bord</p>
        <h1 className="text-3xl font-bold leading-tight">{inventoryName}</h1>
      </div>

      <div className="px-6 pt-6 pb-4">
        <label htmlFor="input-driver-name" className="block text-sm font-medium text-slate-700 mb-1.5">
          Votre nom <span className="text-red-500">*</span>
        </label>
        <input
          id="input-driver-name"
          data-testid="input-driver-name"
          type="text"
          value={driverName}
          onChange={(e) => onDriverNameChange(e.target.value)}
          placeholder="Prénom Nom"
          autoComplete="name"
          className={`w-full h-12 rounded-xl border-2 px-3 text-base focus:outline-none focus:border-blue-500 transition-colors ${
            nameError ? 'border-red-400 bg-red-50' : 'border-slate-200'
          }`}
        />
        {nameError && (
          <p role="alert" className="mt-1.5 text-sm text-red-600">
            Votre nom est requis pour continuer.
          </p>
        )}
      </div>

      <div className="flex-1 px-6 pb-12 space-y-3">
        {ACTIONS.map(({ action, label, icon }) => (
          <button
            key={action}
            type="button"
            data-testid={`btn-hub-${action}`}
            onClick={() => onSelectAction(action)}
            className="w-full h-16 rounded-2xl border-2 border-slate-200 bg-white flex items-center gap-4 px-5
                       text-left active:scale-95 transition-transform"
          >
            <span className="text-2xl" aria-hidden="true">{icon}</span>
            <span className="text-lg font-semibold text-slate-900">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
