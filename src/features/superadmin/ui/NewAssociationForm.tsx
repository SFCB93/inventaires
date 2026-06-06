interface NewAssociationFormProps {
  name: string
  email: string
  isSubmitting: boolean
  error: string | undefined
  onNameChange: (v: string) => void
  onEmailChange: (v: string) => void
  onSubmit: () => void
  onCancel: () => void
}

export function NewAssociationForm({
  name, email, isSubmitting, error,
  onNameChange, onEmailChange, onSubmit, onCancel,
}: NewAssociationFormProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Nouvelle association</h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="assoc-name" className="block text-sm font-medium text-slate-700 mb-1">
            Nom de l'association
          </label>
          <input
            id="assoc-name"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            data-testid="input-assoc-name"
            placeholder="Ex. Croix-Rouge Bordeaux"
            className="w-full h-10 rounded-lg border-2 border-slate-200 px-3 text-sm
                       focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="admin-email" className="block text-sm font-medium text-slate-700 mb-1">
            Email du responsable
          </label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            data-testid="input-admin-email"
            placeholder="responsable@association.fr"
            className="w-full h-10 rounded-lg border-2 border-slate-200 px-3 text-sm
                       focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onSubmit}
            disabled={isSubmitting || !name.trim() || !email.trim()}
            data-testid="btn-invite-submit"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold
                       hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Envoi…' : 'Inviter'}
          </button>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold
                       hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}
