'use client'

import Image from 'next/image'

export interface PhotoPickerFieldProps {
  previewUrl: string | null
  isResizing: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  handleRemovePhoto: () => void
}

export function PhotoPickerField({
  previewUrl, isResizing, fileInputRef, handlePhotoChange, handleRemovePhoto,
}: PhotoPickerFieldProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-16 h-16 rounded-lg border-2 border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
        {previewUrl
          ? <Image src={previewUrl} alt="Aperçu" width={64} height={64} className="object-cover w-full h-full" unoptimized />
          : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-slate-300" aria-hidden="true">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>}
      </div>
      <div className="flex-1 flex flex-col gap-1.5">
        <button type="button" data-testid="btn-upload-photo" disabled={isResizing}
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 text-left">
          {isResizing ? 'Chargement…' : previewUrl ? 'Changer la photo' : 'Choisir une photo'}
        </button>
        <span className="text-xs text-slate-400">ou coller (Ctrl+V / ⌘V)</span>
        {previewUrl && (
          <button type="button" data-testid="btn-remove-photo" onClick={handleRemovePhoto}
            className="text-xs text-red-500 hover:text-red-700 text-left">
            Supprimer la photo
          </button>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        data-testid="input-photo-file" onChange={handlePhotoChange} />
    </div>
  )
}
