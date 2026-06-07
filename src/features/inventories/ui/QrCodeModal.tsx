'use client'

interface QrCodeModalProps {
  isOpen: boolean
  inventoryName: string
  inventoryUrl: string
  qrDataUrl: string
  copied: boolean
  error?: string
  onCopy: () => void
  onPrint: () => void
  onClose: () => void
}

export function QrCodeModal({ isOpen, inventoryName, inventoryUrl, qrDataUrl, copied, error, onCopy, onPrint, onClose }: QrCodeModalProps) {
  if (!isOpen) return null

  return (
    <>
      <div role="dialog" aria-modal="true" aria-label="QR Code" className="fixed inset-0 z-50 flex items-center justify-center print:hidden">
        <div className="absolute inset-0 bg-black/50" aria-hidden="true" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 flex flex-col items-center gap-4">
          <button type="button" onClick={onClose} aria-label="Fermer"
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>

          <div className="text-center">
            <h2 className="text-lg font-bold text-slate-900">QR Code</h2>
            <p className="text-sm text-slate-500 mt-0.5">{inventoryName}</p>
          </div>

          {error ? (
            <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 w-full text-center">{error}</p>
          ) : qrDataUrl ? (
            <img src={qrDataUrl} alt={`QR code — ${inventoryName}`} width={220} height={220} className="rounded-lg" />
          ) : (
            <div className="w-[220px] h-[220px] bg-slate-100 rounded-lg animate-pulse" aria-label="Génération en cours…" />
          )}

          <div className="flex items-center gap-2 w-full bg-slate-50 rounded-xl px-3 py-2">
            <p className="flex-1 text-xs text-slate-500 truncate">{inventoryUrl}</p>
            <button type="button" data-testid="btn-copy-link" onClick={onCopy}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap transition-colors">
              {copied ? 'Copié !' : 'Copier le lien'}
            </button>
          </div>

          <button type="button" data-testid="btn-print-qrcode" onClick={onPrint}
            disabled={!qrDataUrl && !error}
            className="w-full h-11 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50">
            Imprimer
          </button>
        </div>
      </div>

      <div data-qr-print className="hidden">
        <h1 className="text-3xl font-bold text-slate-900">{inventoryName}</h1>
        {qrDataUrl && <img src={qrDataUrl} alt={`QR code — ${inventoryName}`} width={256} height={256} />}
        <p className="text-sm text-slate-600 break-all max-w-xs">{inventoryUrl}</p>
      </div>
    </>
  )
}
