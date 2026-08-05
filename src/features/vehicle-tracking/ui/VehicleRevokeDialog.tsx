"use client";

interface VehicleRevokeDialogProps {
  isOpen: boolean;
  inventoryName: string;
  isSubmitting?: boolean;
  onRevoke: () => void;
  onRevokeAndDelete: () => void;
  onCancel: () => void;
}

export function VehicleRevokeDialog({
  isOpen,
  inventoryName,
  isSubmitting = false,
  onRevoke,
  onRevokeAndDelete,
  onCancel,
}: VehicleRevokeDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="revoke-vehicle-title"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 mx-4">
        <h2
          id="revoke-vehicle-title"
          className="text-lg font-bold text-slate-900 mb-2"
        >
          Révoquer la clé du device
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Le device associé à {inventoryName} ne pourra plus envoyer de données
          tant qu&apos;une nouvelle clé n&apos;est pas générée.
        </p>

        <div className="flex flex-col gap-3">
          <div>
            <button
              type="button"
              data-testid="btn-revoke-only"
              onClick={onRevoke}
              disabled={isSubmitting}
              className="w-full px-4 py-2 rounded-lg text-sm font-semibold text-white
                         bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Révocation…" : "Révoquer"}
            </button>
            <p className="text-xs text-slate-400 mt-1">
              Garde l&apos;historique des positions — à utiliser pour une simple
              rotation de clé.
            </p>
          </div>

          <div>
            <button
              type="button"
              data-testid="btn-revoke-and-delete"
              onClick={onRevokeAndDelete}
              disabled={isSubmitting}
              className="w-full px-4 py-2 rounded-lg text-sm font-semibold text-red-700 border border-red-300
                         hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              ‼️ Révoquer et supprimer toutes les données ‼️
            </button>
            <p className="text-xs text-slate-400 mt-1">
              ⚠️ Supprime aussi l&apos;état courant et tout l&apos;historique —
              irréversible, à réserver aux cas d&apos;erreur.
            </p>
          </div>

          <button
            type="button"
            data-testid="btn-cancel-revoke"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100
                       transition-colors disabled:opacity-50 self-end"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
