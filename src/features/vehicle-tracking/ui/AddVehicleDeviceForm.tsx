'use client'

import { useState } from 'react'
import type { UnlinkedInventory } from '../domain/types'

interface AddVehicleDeviceFormProps {
  isOpen: boolean
  candidates: UnlinkedInventory[]
  isSubmitting?: boolean
  newApiKey?: string
  error?: string
  loadError?: string
  onSubmit: (inventoryId: string) => void
  onClose: () => void
}

export function AddVehicleDeviceForm({
  isOpen,
  candidates,
  isSubmitting = false,
  newApiKey,
  error,
  loadError,
  onSubmit,
  onClose,
}: AddVehicleDeviceFormProps) {
  const [selectedId, setSelectedId] = useState('')
  const effectiveSelectedId = candidates.some((candidate) => candidate.inventoryId === selectedId)
    ? selectedId
    : (candidates[0]?.inventoryId ?? '')

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-vehicle-device-title"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 mx-4">
        <h2 id="add-vehicle-device-title" className="text-lg font-bold text-slate-900 mb-5">
          Associer un device
        </h2>

        {newApiKey ? (
          <>
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200" data-testid="device-api-key-reveal">
              <p className="text-xs text-amber-700 font-medium mb-1">
                Clé API générée — à noter maintenant, elle ne sera plus affichée.
              </p>
              <code className="block text-sm text-slate-900 break-all">{newApiKey}</code>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                data-testid="btn-close-add-vehicle-device"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Terminé
              </button>
            </div>
          </>
        ) : loadError ? (
          <>
            <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-5">
              {loadError}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                data-testid="btn-cancel-add-vehicle-device"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Fermer
              </button>
            </div>
          </>
        ) : candidates.length === 0 ? (
          <>
            <p className="text-sm text-slate-500 mb-5">
              Tous les inventaires ont déjà un device associé.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                data-testid="btn-cancel-add-vehicle-device"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Fermer
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-5">
              <label htmlFor="select-vehicle-inventory" className="block text-sm font-medium text-slate-700 mb-1.5">
                Inventaire à équiper <span className="text-red-500">*</span>
              </label>
              <select
                id="select-vehicle-inventory"
                data-testid="select-vehicle-inventory"
                value={effectiveSelectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full h-11 rounded-lg border-2 border-slate-200 px-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              >
                {candidates.map((candidate) => (
                  <option key={candidate.inventoryId} value={candidate.inventoryId}>
                    {candidate.name}
                  </option>
                ))}
              </select>
            </div>
            {error && (
              <p role="alert" className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                data-testid="btn-cancel-add-vehicle-device"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                data-testid="btn-submit-add-vehicle-device"
                onClick={() => onSubmit(effectiveSelectedId)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Génération…' : 'Générer la clé'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
