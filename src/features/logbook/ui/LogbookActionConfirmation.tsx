interface LogbookActionConfirmationProps {
  message: string
  onBackToMenu: () => void
}

export function LogbookActionConfirmation({ message, onBackToMenu }: LogbookActionConfirmationProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 py-12 text-center bg-white">
      <div
        className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-8"
        aria-hidden="true"
      >
        <span className="text-4xl">✓</span>
      </div>
      <p className="text-slate-700 text-base leading-relaxed mb-8 max-w-xs">{message}</p>
      <button
        type="button"
        data-testid="btn-back-to-menu"
        onClick={onBackToMenu}
        className="w-full max-w-xs h-14 rounded-2xl bg-blue-600 text-white text-base font-semibold
                   shadow-md shadow-blue-100 active:scale-95 transition-transform"
      >
        Retour au menu
      </button>
    </div>
  )
}
