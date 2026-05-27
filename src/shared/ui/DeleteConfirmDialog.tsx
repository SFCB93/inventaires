'use client'

interface DeleteConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  isDeleting?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Supprimer',
  isDeleting = false,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 mx-4">
        <h2
          id="delete-dialog-title"
          className="text-lg font-bold text-slate-900 mb-2"
        >
          {title}
        </h2>
        <p className="text-sm text-slate-500 mb-6">{message}</p>

        <div className="flex gap-3 justify-end">
          <button
            data-testid="btn-cancel-delete"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600
                       hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            data-testid="btn-confirm-delete"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white
                       bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'Suppression…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
