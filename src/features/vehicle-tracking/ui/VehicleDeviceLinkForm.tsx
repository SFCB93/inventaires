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
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <p className="text-sm text-slate-500">
        <span className="font-medium text-slate-700">Device IoT</span>
        {' — '}
        {isLinked ? `associé à ${inventoryName}.` : `aucun device associé à ${inventoryName}.`}
      </p>

      <div className="flex gap-3 shrink-0">
        {isLinked ? (
          <button
            type="button"
            data-testid="btn-revoke-device-key"
            onClick={() => setIsRevokeDialogOpen(true)}
            disabled={isSubmitting}
            className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
          >
            Révoquer
          </button>
        ) : (
          <button
            type="button"
            data-testid="btn-generate-device-key"
            onClick={onGenerate}
            disabled={isSubmitting}
            className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-50"
          >
            {isSubmitting ? 'Génération…' : 'Associer un device'}
          </button>
        )}

        <button
          type="button"
          data-testid="btn-show-vehicle-api-doc"
          onClick={() => setIsApiDocOpen(true)}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          Voir la requête HTTP
        </button>
      </div>

      {newApiKey && (
        <div
          className="w-full p-3 rounded-lg bg-amber-50 border border-amber-200"
          data-testid="device-api-key-reveal"
        >
          <p className="text-xs text-amber-700 font-medium mb-1">
            Clé API générée — à noter maintenant, elle ne sera plus affichée.
          </p>
          <code className="block text-sm text-slate-900 break-all">{newApiKey}</code>
        </div>
      )}

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
