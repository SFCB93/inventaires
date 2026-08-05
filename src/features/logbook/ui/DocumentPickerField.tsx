'use client'

interface DocumentPickerFieldProps {
  fileName: string | null
  isUploading?: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: () => void
}

export function DocumentPickerField({
  fileName,
  isUploading = false,
  fileInputRef,
  onFileChange,
  onRemove,
}: DocumentPickerFieldProps) {
  return (
    <div>
      <p className="block text-sm font-medium text-slate-700 mb-1.5">Justificatif (facultatif)</p>
      <button
        type="button"
        data-testid="btn-pick-document"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        className="w-full h-14 rounded-xl border-2 border-dashed border-slate-300 text-slate-500
                   flex items-center justify-center gap-2 text-base disabled:opacity-50"
      >
        <span aria-hidden="true">📎</span>
        {isUploading ? 'Envoi en cours…' : fileName ? fileName : 'Ajouter une photo ou un document'}
      </button>
      {fileName && !isUploading && (
        <button
          type="button"
          data-testid="btn-remove-document"
          onClick={onRemove}
          className="text-sm text-red-500 mt-1.5"
        >
          Retirer le fichier
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        data-testid="input-document-file"
        onChange={onFileChange}
      />
    </div>
  )
}
