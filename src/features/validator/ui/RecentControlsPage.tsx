import Link from 'next/link'
import type { PublicControlSummary } from '../domain/types'
import { ControlsAccordion } from './ControlsAccordion'

interface RecentControlsPageProps {
  inventoryId: string
  inventoryName: string
  controls: PublicControlSummary[]
}

export function RecentControlsPage({
  inventoryId,
  inventoryName,
  controls,
}: RecentControlsPageProps) {
  return (
    <div className="flex flex-col min-h-dvh bg-white">
      <div className="bg-blue-600 px-6 pt-16 pb-8 text-white">
        <Link
          href={`/inventaire/${inventoryId}`}
          className="inline-flex items-center gap-1 text-blue-200 text-sm mb-4"
        >
          ← Retour
        </Link>
        <h1 className="text-2xl font-bold leading-tight">{inventoryName}</h1>
        <p className="text-blue-200 text-sm mt-1">Derniers contrôles</p>
      </div>

      <div className="flex-1 px-6 pt-6 pb-12">
        {controls.length === 0 ? (
          <p className="text-slate-500 text-center mt-12">
            Aucun contrôle réalisé pour l'instant.
          </p>
        ) : (
          <ControlsAccordion controls={controls} />
        )}
      </div>
    </div>
  )
}
