'use client'

import Image from 'next/image'
import { useItemForm } from './hooks/useItemForm'

export interface ItemFormValues {
  name: string
  photoUrl: string
  hasExpiry: boolean
  isCritical: boolean
}

interface ItemFormProps {
  initialValues?: Partial<ItemFormValues>
  isSubmitting?: boolean
  error?: string
  submitLabel?: string
  onSubmit: (values: ItemFormValues) => void
  onCancel: () => void
}

export function ItemForm({ initialValues, isSubmitting = false, error, submitLabel = 'Ajouter', onSubmit, onCancel }: ItemFormProps) {
  const { name, setName, hasExpiry, setHasExpiry, isCritical, setIsCritical, nameError, setNameError, isResizing, previewUrl, fileInputRef, handlePhotoChange, handleRemovePhoto, getValues } = useItemForm(initialValues)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const values = getValues()
    if (!values.name) { setNameError(true); return }
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="input-item-name" className="block text-sm font-medium text-slate-700 mb-1">
          Nom <span className="text-red-500">*</span>
        </label>
        <input
          id="input-item-name"
          data-testid="input-item-name"
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); if (nameError) setNameError(false) }}
          placeholder="Ex. : Défibrillateur, Masque à oxygène…"
          className={`w-full h-10 rounded-lg border-2 px-3 text-sm focus:outline-none focus:border-blue-500 transition-colors ${nameError ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
        />
        {nameError && <p role="alert" className="mt-1 text-xs text-red-600">Le nom est obligatoire.</p>}
      </div>

      <div>
        <span className="block text-sm font-medium text-slate-700 mb-1">
          Photo <span className="text-xs font-normal text-slate-400">(facultatif)</span>
        </span>
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-lg border-2 border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
            {previewUrl ? (
              <Image src={previewUrl} alt="Aperçu" width={64} height={64} className="object-cover w-full h-full" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-slate-300" aria-hidden="true">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
              </svg>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <button type="button" data-testid="btn-upload-photo" onClick={() => fileInputRef.current?.click()}
              disabled={isResizing}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
              {isResizing ? 'Chargement…' : previewUrl ? 'Changer la photo' : 'Choisir une photo'}
            </button>
            {previewUrl && (
              <button type="button" data-testid="btn-remove-photo" onClick={handleRemovePhoto}
                className="text-xs text-red-500 hover:text-red-700 text-left">
                Supprimer la photo
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" data-testid="input-photo-file" onChange={handlePhotoChange} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            data-testid="checkbox-has-expiry"
            checked={hasExpiry}
            onChange={(e) => setHasExpiry(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 accent-blue-600"
          />
          <span className="text-sm text-slate-700">
            Matériel périssable
            <span className="block text-xs text-slate-400 font-normal">La date de péremption sera demandée lors du contrôle.</span>
          </span>
        </label>
        {hasExpiry && (
          <label className="flex items-center gap-3 cursor-pointer pl-7">
            <input
              type="checkbox"
              data-testid="checkbox-is-critical"
              checked={isCritical}
              onChange={(e) => setIsCritical(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 accent-red-600"
            />
            <span className="text-sm text-slate-700">
              Critique
              <span className="block text-xs text-slate-400 font-normal">La date sera obligatoire lors du contrôle.</span>
            </span>
          </label>
        )}
      </div>

      {error && <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-2 justify-end pt-1">
        <button type="button" data-testid="btn-cancel-item-form" onClick={onCancel} disabled={isSubmitting}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50">
          Annuler
        </button>
        <button type="submit" data-testid="btn-submit-item-form" disabled={isSubmitting}
          className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50">
          {isSubmitting ? 'Enregistrement…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
