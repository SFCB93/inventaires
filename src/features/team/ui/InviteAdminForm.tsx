'use client'

interface InviteAdminFormProps {
  email: string
  isSubmitting: boolean
  error?: string
  onEmailChange: (v: string) => void
  onSubmit: () => void
  onCancel: () => void
}

export function InviteAdminForm({ email, isSubmitting, error, onEmailChange, onSubmit, onCancel }: InviteAdminFormProps) {
  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="email"
          data-testid="input-invite-email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="email@exemple.com"
          className={`flex-1 h-9 rounded-lg border-2 px-3 text-sm focus:outline-none focus:border-blue-500 transition-colors ${error ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
        />
        <button
          type="button"
          data-testid="btn-submit-invite"
          onClick={onSubmit}
          disabled={isSubmitting || !email.trim()}
          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Envoi…' : 'Inviter'}
        </button>
        <button
          type="button"
          data-testid="btn-cancel-invite"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:bg-slate-100 transition-colors"
        >
          Annuler
        </button>
      </div>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
