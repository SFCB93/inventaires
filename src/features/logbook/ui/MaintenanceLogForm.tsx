'use client'

import { LogFormHeader } from './LogFormHeader'
import { DocumentPickerField } from './DocumentPickerField'

interface MaintenanceLogFormProps {
  description: string
  onDescriptionChange: (value: string) => void
  fileName: string | null
  isUploading?: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveFile: () => void
  isSubmitting?: boolean
  error?: string
  onSubmit: () => void
  onBack: () => void
}

export function MaintenanceLogForm({
  description,
  onDescriptionChange,
  fileName,
  isUploading = false,
  fileInputRef,
  onFileChange,
  onRemoveFile,
  isSubmitting = false,
  error,
  onSubmit,
  onBack,
}: MaintenanceLogFormProps) {
  return (
    <div className="flex flex-col min-h-dvh bg-white">
      <LogFormHeader title="Maintenance" onBack={onBack} />

      <div className="flex-1 px-5 py-5 space-y-6">
        <div>
          <label htmlFor="textarea-maintenance-description" className="block text-sm font-medium text-slate-700 mb-1.5">
            Description de l&apos;intervention <span className="text-red-500">*</span>
          </label>
          <textarea
            id="textarea-maintenance-description"
            data-testid="textarea-maintenance-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={5}
            placeholder="Ex. : vidange effectuée, pneu avant droit changé…"
            className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-base resize-none focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <DocumentPickerField
          fileName={fileName}
          isUploading={isUploading}
          fileInputRef={fileInputRef}
          onFileChange={onFileChange}
          onRemove={onRemoveFile}
        />

        {error && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
        )}

        <button
          type="button"
          data-testid="btn-submit-maintenance"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full h-14 rounded-2xl bg-blue-600 text-white text-base font-semibold shadow-md shadow-blue-100 disabled:opacity-50 active:scale-95 transition-transform"
        >
          {isSubmitting ? 'Envoi en cours…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
