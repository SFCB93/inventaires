interface NotificationEmailsEditorProps {
  emails: string[]
  newEmail: string
  emailError: string | undefined
  onNewEmailChange: (v: string) => void
  onAdd: () => void
  onRemove: (email: string) => void
  isSaving?: boolean
  saveError?: string
  saveSuccess?: boolean
}

export function NotificationEmailsEditor({
  emails, newEmail, emailError, onNewEmailChange, onAdd, onRemove,
  isSaving, saveError, saveSuccess,
}: NotificationEmailsEditorProps) {
  return (
    <div className="space-y-3">
      {emails.length === 0 ? (
        <p className="text-sm text-slate-400">Aucun email de notification configuré.</p>
      ) : (
        <ul className="space-y-2">
          {emails.map((email) => (
            <li key={email} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
              <span className="text-sm text-slate-700">{email}</span>
              <button
                onClick={() => onRemove(email)}
                aria-label={`Supprimer ${email}`}
                data-testid={`btn-remove-email-${email}`}
                className="text-slate-400 hover:text-red-600 transition-colors"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          type="email"
          value={newEmail}
          onChange={(e) => onNewEmailChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAdd()}
          placeholder="nouveau@email.fr"
          data-testid="input-new-email"
          className="flex-1 h-9 rounded-lg border-2 border-slate-200 px-3 text-sm
                     focus:outline-none focus:border-blue-500 transition-colors"
        />
        <button
          onClick={onAdd}
          data-testid="btn-add-email"
          className="px-3 h-9 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold
                     hover:bg-slate-200 transition-colors"
        >
          Ajouter
        </button>
      </div>

      {emailError && (
        <p role="alert" className="text-sm text-red-600">{emailError}</p>
      )}
      {isSaving && (
        <p className="text-sm text-slate-400">Enregistrement…</p>
      )}
      {saveError && (
        <p role="alert" className="text-sm text-red-600">{saveError}</p>
      )}
      {saveSuccess && !isSaving && (
        <p className="text-sm text-green-600">Enregistré.</p>
      )}
    </div>
  )
}
