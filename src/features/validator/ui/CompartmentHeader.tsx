interface CompartmentHeaderProps {
  name: string
  currentCompartment: number
  totalCompartments: number
  canGoBack: boolean
  onBack: () => void
}

export function CompartmentHeader({
  name,
  currentCompartment,
  totalCompartments,
  canGoBack,
  onBack,
}: CompartmentHeaderProps) {
  return (
    <div className="flex items-stretch border-b border-slate-100">
      {canGoBack && (
        <button
          onClick={onBack}
          aria-label="Emplacement précédent"
          className="flex items-center px-3 active:bg-slate-50"
        >
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-600 text-xl font-bold">
            ←
          </span>
        </button>
      )}
      <div className={`flex-1 pr-5 py-3 ${canGoBack ? '' : 'pl-5'}`}>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Emplacement {currentCompartment} / {totalCompartments}
        </p>
        <h2 className="text-lg font-semibold text-slate-800 mt-0.5">{name}</h2>
      </div>
    </div>
  )
}
