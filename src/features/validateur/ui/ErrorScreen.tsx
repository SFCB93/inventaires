interface ErrorScreenProps {
  message: string
  onRetry?: () => void
}

export function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 text-center bg-white">
      <div
        className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-8"
        aria-hidden="true"
      >
        <span className="text-4xl">⚠</span>
      </div>
      <p className="text-slate-700 text-base leading-relaxed mb-8 max-w-xs">{message}</p>
      {onRetry && (
        <button
          data-testid="btn-retry"
          onClick={onRetry}
          className="h-12 px-8 rounded-2xl border-2 border-slate-200 text-slate-700 text-base
                     font-medium active:scale-95 transition-transform"
        >
          Réessayer
        </button>
      )}
    </div>
  )
}
