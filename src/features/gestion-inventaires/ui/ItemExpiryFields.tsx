'use client'

interface ItemExpiryFieldsProps {
  hasExpiry: boolean
  isCritical: boolean
  onHasExpiryChange: (v: boolean) => void
  onIsCriticalChange: (v: boolean) => void
}

export function ItemExpiryFields({ hasExpiry, isCritical, onHasExpiryChange, onIsCriticalChange }: ItemExpiryFieldsProps) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" data-testid="checkbox-has-expiry" checked={hasExpiry}
          onChange={(e) => onHasExpiryChange(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 accent-blue-600" />
        <span className="text-sm text-slate-700">
          Matériel périssable
          <span className="block text-xs text-slate-400 font-normal">La date de péremption sera demandée lors du contrôle.</span>
        </span>
      </label>
      {hasExpiry && (
        <label className="flex items-center gap-3 cursor-pointer pl-7">
          <input type="checkbox" data-testid="checkbox-is-critical" checked={isCritical}
            onChange={(e) => onIsCriticalChange(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 accent-red-600" />
          <span className="text-sm text-slate-700">
            Critique
            <span className="block text-xs text-slate-400 font-normal">La date sera obligatoire lors du contrôle.</span>
          </span>
        </label>
      )}
    </div>
  )
}
