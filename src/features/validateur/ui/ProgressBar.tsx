interface ProgressBarProps {
  currentItem: number
  totalItems: number
  currentCompartment: number
  totalCompartments: number
}

export function ProgressBar({
  currentItem,
  totalItems,
  currentCompartment,
  totalCompartments,
}: ProgressBarProps) {
  const percentage = Math.round((currentItem / totalItems) * 100)

  return (
    <div className="px-5 pt-4 pb-2">
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progression : ${percentage}%`}
        className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-400 mt-1.5">
        <span>Matériel {currentItem} / {totalItems}</span>
        <span>Emplacement {currentCompartment} / {totalCompartments}</span>
      </div>
    </div>
  )
}
