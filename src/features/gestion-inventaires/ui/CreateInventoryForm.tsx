'use client'

import { useCreateInventoryForm } from './hooks/useCreateInventoryForm'

interface CreateInventoryFormProps {
  isOpen: boolean
  isSubmitting?: boolean
  error?: string
  onSubmit: (name: string) => void
  onCancel: () => void
}

export function CreateInventoryForm({ isOpen, isSubmitting = false, error, onSubmit, onCancel }: CreateInventoryFormProps) {
  const { name, setName, nameError, setNameError, handleSubmit, handleCancel } = useCreateInventoryForm(onCancel)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-labelledby="create-inventory-title">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 mx-4">
        <h2 id="create-inventory-title" className="text-lg font-bold text-slate-900 mb-5">
          Créer un inventaire
        </h2>
        <form onSubmit={(e) => handleSubmit(e, onSubmit)} noValidate>
          <div className="mb-5">
            <label htmlFor="input-inventory-name" className="block text-sm font-medium text-slate-700 mb-1.5">
              Nom de l'inventaire <span className="text-red-500">*</span>
            </label>
            <input
              id="input-inventory-name"
              data-testid="input-inventory-name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); if (nameError) setNameError(false) }}
              placeholder="Ex. : Véhicule VSL 42, Armoire salle de réunion…"
              autoFocus
              className={`w-full h-11 rounded-lg border-2 px-3 text-sm focus:outline-none focus:border-blue-500 transition-colors ${nameError ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
            />
            {nameError && <p role="alert" className="mt-1 text-sm text-red-600">Le nom est obligatoire.</p>}
          </div>
          {error && <p role="alert" className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button type="button" data-testid="btn-cancel-create-inventory" onClick={handleCancel} disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50">
              Annuler
            </button>
            <button type="submit" data-testid="btn-submit-create-inventory" disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50">
              {isSubmitting ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
