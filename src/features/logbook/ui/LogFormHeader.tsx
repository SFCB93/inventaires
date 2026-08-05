interface LogFormHeaderProps {
  title: string
  onBack: () => void
}

export function LogFormHeader({ title, onBack }: LogFormHeaderProps) {
  return (
    <div className="bg-slate-800 px-5 pt-12 pb-6 text-white flex items-center gap-3">
      <button
        type="button"
        data-testid="btn-back-to-hub"
        onClick={onBack}
        aria-label="Retour au menu"
        className="text-2xl leading-none w-10 h-10 flex items-center justify-center -ml-2"
      >
        ←
      </button>
      <h2 className="text-2xl font-bold">{title}</h2>
    </div>
  )
}
