'use client'

import Image from 'next/image'

export interface PhotoPickerFieldProps {
  photoMode: 'file' | 'url'
  urlInput: string
  urlError: boolean
  previewUrl: string | null
  isResizing: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onPhotoModeChange: (mode: 'file' | 'url') => void
  onPhotoUrlChange: (url: string) => void
  handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  handleRemovePhoto: () => void
}

export function PhotoPickerField({
  photoMode, urlInput, urlError, previewUrl, isResizing,
  fileInputRef, onPhotoModeChange, onPhotoUrlChange, handlePhotoChange, handleRemovePhoto,
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
        {photoMode === 'url' ? (
          <>
            <input data-testid="input-photo-url" type="url" value={urlInput}
              onChange={(e) => onPhotoUrlChange(e.target.value)}
              placeholder="https://example.com/photo.jpg" aria-label="URL de la photo"
              className={`w-full h-9 rounded-lg border-2 px-3 text-sm focus:outline-none focus:border-blue-500 transition-colors ${urlError ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
            />
            {urlError && <p role="alert" className="text-xs text-red-600">L'URL doit commencer par https://</p>}
            <button type="button" data-testid="btn-switch-to-file" onClick={() => onPhotoModeChange('file')}
              className="text-xs text-slate-400 hover:text-slate-600 text-left transition-colors">
              ← Choisir un fichier à la place
            </button>
          </>
        ) : (
          <>
            <button type="button" data-testid="btn-upload-photo" disabled={isResizing}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 text-left">
              {isResizing ? 'Chargement…' : previewUrl ? 'Changer la photo' : 'Choisir une photo'}
            </button>
            <button type="button" data-testid="btn-switch-to-url" onClick={() => onPhotoModeChange('url')}
              className="text-xs text-slate-400 hover:text-slate-600 text-left transition-colors">
              ou entrer une URL
            </button>
          </>
        )}
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
