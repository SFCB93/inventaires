interface ConfirmationScreenProps {
  inventoryName: string
  submittedAt: string
}

export function ConfirmationScreen({ inventoryName, submittedAt }: ConfirmationScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 py-12 text-center bg-white">
      <div
        className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-8"
        aria-hidden="true"
      >
        <span className="text-4xl">✓</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Contrôle enregistré</h1>
      <p className="text-base text-slate-500">{inventoryName}</p>
      <p className="text-sm text-slate-400 mt-1">{submittedAt}</p>
      <p className="mt-10 text-slate-500 text-base">Merci pour votre vérification.</p>
    </div>
  )
}
