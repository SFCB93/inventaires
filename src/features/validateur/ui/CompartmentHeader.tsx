interface CompartmentHeaderProps {
  name: string
  currentCompartment: number
  totalCompartments: number
}

export function CompartmentHeader({
  name,
  currentCompartment,
  totalCompartments,
}: CompartmentHeaderProps) {
  return (
    <div className="px-5 py-3 border-b border-slate-100">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Emplacement {currentCompartment} / {totalCompartments}
      </p>
      <h2 className="text-lg font-semibold text-slate-800 mt-0.5">{name}</h2>
    </div>
  )
}
