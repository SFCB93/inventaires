'use client'

import { useState } from 'react'
import { VehicleRevokeDialog } from './VehicleRevokeDialog'
import { VehicleApiDocModal } from './VehicleApiDocModal'

interface VehicleDeviceLinkFormProps {
  inventoryName: string
  isLinked: boolean
  newApiKey?: string
  isSubmitting?: boolean
  onGenerate: () => void
  onRevoke: () => void
  onRevokeAndDelete: () => void
}

export function VehicleDeviceLinkForm({
  inventoryName,
  isLinked,
  newApiKey,
  isSubmitting = false,
  onGenerate,
  onRevoke,
  onRevokeAndDelete,
}: VehicleDeviceLinkFormProps) {
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false)
  const [isApiDocOpen, setIsApiDocOpen] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-slate-900">Device IoT</h2>
        <button
          type="button"
          data-testid="btn-show-vehicle-api-doc"
          onClick={() => setIsApiDocOpen(true)}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          Voir la requête HTTP
        </button>
      </div>
      <p className="text-sm text-slate-400 mb-4">
        {isLinked ? `Un device est associé à ${inventoryName}.` : `Aucun device associé à ${inventoryName}.`}
      </p>

      {newApiKey && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200" data-testid="device-api-key-reveal">
          <p className="text-xs text-amber-700 font-medium mb-1">
            Clé API générée — à noter maintenant, elle ne sera plus affichée.
          </p>
          <code className="block text-sm text-slate-900 break-all">{newApiKey}</code>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          data-testid="btn-generate-device-key"
          onClick={onGenerate}
          disabled={isSubmitting}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold
                     hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Génération…' : isLinked ? 'Régénérer la clé' : 'Associer un device'}
        </button>

        {isLinked && (
          <button
            type="button"
            data-testid="btn-revoke-device-key"
            onClick={() => setIsRevokeDialogOpen(true)}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50
                       transition-colors disabled:opacity-50"
          >
            Révoquer
          </button>
        )}
      </div>

      <VehicleRevokeDialog
        isOpen={isRevokeDialogOpen}
        inventoryName={inventoryName}
        isSubmitting={isSubmitting}
        onRevoke={() => {
          onRevoke()
          setIsRevokeDialogOpen(false)
        }}
        onRevokeAndDelete={() => {
          onRevokeAndDelete()
          setIsRevokeDialogOpen(false)
        }}
        onCancel={() => setIsRevokeDialogOpen(false)}
      />

      <VehicleApiDocModal isOpen={isApiDocOpen} onClose={() => setIsApiDocOpen(false)} />
    </div>
  )
}
