'use client'

interface DecisionButtonsProps {
  onPresent: () => void
  onAnomaly: () => void
  disabled?: boolean
}

export function DecisionButtons({
  onPresent,
  onAnomaly,
  disabled = false,
}: DecisionButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 px-4 pb-8 pt-2">
      <button
        data-testid="btn-present"
        onClick={onPresent}
        disabled={disabled}
        aria-label="Marquer comme présent"
        className="h-20 rounded-2xl bg-emerald-600 text-white flex flex-col items-center
                   justify-center gap-1 shadow-sm disabled:opacity-40
                   active:scale-95 transition-transform"
      >
        <span className="text-2xl leading-none">✓</span>
        <span className="text-base font-semibold tracking-wide">Présent</span>
      </button>
      <button
        data-testid="btn-anomaly"
        onClick={onAnomaly}
        disabled={disabled}
        aria-label="Signaler une anomalie"
        className="h-20 rounded-2xl bg-amber-500 text-white flex flex-col items-center
                   justify-center gap-1 shadow-sm disabled:opacity-40
                   active:scale-95 transition-transform"
      >
        <span className="text-2xl leading-none">⚠</span>
        <span className="text-base font-semibold tracking-wide">Anomalie</span>
      </button>
    </div>
  )
}
