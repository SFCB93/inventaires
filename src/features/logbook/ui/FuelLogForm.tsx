'use client'

import { LogFormHeader } from './LogFormHeader'
import { DocumentPickerField } from './DocumentPickerField'

interface FuelLogFormProps {
  liters: string
  onLitersChange: (value: string) => void
  amount: string
  onAmountChange: (value: string) => void
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

export function FuelLogForm({
  liters,
  onLitersChange,
  amount,
  onAmountChange,
  fileName,
  isUploading = false,
  fileInputRef,
  onFileChange,
  onRemoveFile,
  isSubmitting = false,
  error,
  onSubmit,
  onBack,
}: FuelLogFormProps) {
  return (
    <div className="flex flex-col min-h-dvh bg-white">
      <LogFormHeader title="Carburant" onBack={onBack} />

      <div className="flex-1 px-5 py-5 space-y-6">
        <div>
          <label htmlFor="input-fuel-liters" className="block text-sm font-medium text-slate-700 mb-1.5">
            Quantité (litres) <span className="text-red-500">*</span>
          </label>
          <input
            id="input-fuel-liters"
            data-testid="input-fuel-liters"
            type="number"
            inputMode="decimal"
            value={liters}
            onChange={(e) => onLitersChange(e.target.value)}
            placeholder="Ex. : 45"
            className="w-full h-12 rounded-xl border-2 border-slate-200 px-3 text-base focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="input-fuel-amount" className="block text-sm font-medium text-slate-700 mb-1.5">
            Montant payé (€)
          </label>
          <input
            id="input-fuel-amount"
            data-testid="input-fuel-amount"
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="Ex. : 68.50"
            className="w-full h-12 rounded-xl border-2 border-slate-200 px-3 text-base focus:outline-none focus:border-blue-500 transition-colors"
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
          data-testid="btn-submit-fuel"
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
