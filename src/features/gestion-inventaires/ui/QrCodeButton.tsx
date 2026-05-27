'use client'

interface QrCodeButtonProps {
  onClick: () => void
}

export function QrCodeButton({ onClick }: QrCodeButtonProps) {
  return (
    <button
      type="button"
      data-testid="btn-show-qrcode"
      onClick={onClick}
      aria-label="Afficher le QR code"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M3 3h7v7H3zm1 1v5h5V4zm1 1h3v3H5zM14 3h7v7h-7zm1 1v5h5V4zm1 1h3v3h-3zM3 14h7v7H3zm1 1v5h5v-5zm1 1h3v3H5zM16 14h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm2 2h2v2h-2zm2-6h2v2h-2zm0 4h2v2h-2zm-4-2h2v2h-2z"/>
      </svg>
      QR Code
    </button>
  )
}
