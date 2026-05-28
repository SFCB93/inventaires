'use client'

import { useItemForm } from './hooks/useItemForm'
import { PhotoPickerField } from './PhotoPickerField'
import { ItemExpiryFields } from './ItemExpiryFields'

export interface ItemFormValues {
  name: string
  photoUrl: string
  hasExpiry: boolean
  isCritical: boolean
}

interface ItemFormProps {
  initialValues?: ItemFormValues
  isSubmitting?: boolean
  error?: string
  submitLabel?: string
  onSubmit: (values: ItemFormValues) => void
  onCancel: () => void
}

export function ItemForm({ initialValues, isSubmitting = false, error, submitLabel = 'Ajouter', onSubmit, onCancel }: ItemFormProps) {
  const {
    name, setName, hasExpiry, setHasExpiry, isCritical, setIsCritical,
    nameError, setNameError, getValues,
    isResizing, previewUrl, fileInputRef,
    handlePhotoChange, handlePhotoPaste, handleRemovePhoto,
  } = useItemForm(initialValues)

  function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault()
    const values = getValues()
    if (!values.name) { setNameError(true); return }
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} onPaste={handlePhotoPaste} noValidate className="space-y-4">
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

      <fieldset className="border-0 p-0 m-0">
        <legend className="block text-sm font-medium text-slate-700 mb-1">
          Photo <span className="text-xs font-normal text-slate-400">(facultatif)</span>
        </legend>
        <PhotoPickerField
          previewUrl={previewUrl}
          isResizing={isResizing}
          fileInputRef={fileInputRef}
          handlePhotoChange={handlePhotoChange}
          handleRemovePhoto={handleRemovePhoto}
        />
      </fieldset>

      <ItemExpiryFields
        hasExpiry={hasExpiry} isCritical={isCritical}
        onHasExpiryChange={setHasExpiry} onIsCriticalChange={setIsCritical}
      />

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
