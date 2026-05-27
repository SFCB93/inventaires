'use client'

import { useState } from 'react'

interface CreateCompartmentFormProps {
  isSubmitting?: boolean
  onSubmit: (name: string) => void
  onCancel: () => void
}

export function CreateCompartmentForm({
  isSubmitting = false,
  onSubmit,
  onCancel,
}: CreateCompartmentFormProps) {
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setNameError(true)
      return
    }
    // TODO: brancher sur createCompartmentUseCase
    onSubmit(name.trim())
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-blue-300
                 bg-blue-50"
    >
      <input
        data-testid="input-new-compartment-name"
        type="text"
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          if (nameError) setNameError(false)
        }}
        placeholder="Nom de l'emplacement (ex. : Poche avant, Tiroir 1…)"
        autoFocus
        className={`flex-1 h-9 rounded-lg border-2 px-3 text-sm bg-white
                    focus:outline-none focus:border-blue-500 transition-colors
                    ${nameError ? 'border-red-400' : 'border-slate-200'}`}
      />
      {nameError && (
        <p role="alert" className="sr-only">Le nom est obligatoire.</p>
      )}
      <button
        type="submit"
        data-testid="btn-submit-new-compartment"
        disabled={isSubmitting}
        className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white
                   bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50
                   flex-shrink-0"
      >
        {isSubmitting ? '…' : 'Ajouter'}
      </button>
      <button
        type="button"
        data-testid="btn-cancel-new-compartment"
        onClick={onCancel}
        disabled={isSubmitting}
        className="px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:bg-slate-100
                   transition-colors flex-shrink-0"
      >
        Annuler
      </button>
    </form>
  )
}
