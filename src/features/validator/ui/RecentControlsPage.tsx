'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ActiveAlertsReport, ExpiryAlertItem, AnomalyAlertItem } from '@/shared/domain/alerts'
import { formatDate } from '@/shared/lib/format'
import type { PublicControlSummary } from '../domain/types'
import { ControlsAccordion } from './ControlsAccordion'
import { AnomalyAlertsBlock } from '@/features/controls/ui/AnomalyAlertsBlock'
import { PublicCorrectionModal } from './PublicCorrectionModal'
import { PublicAnomalyCorrectionModal } from './PublicAnomalyCorrectionModal'
import { useCorrectorName } from './hooks/useCorrectorName'
import { usePublicCorrectionModal } from './hooks/usePublicCorrectionModal'
import { usePublicAnomalyCorrectionModal } from './hooks/usePublicAnomalyCorrectionModal'

interface RecentControlsPageProps {
  inventoryId: string
  inventoryName: string
  controls: PublicControlSummary[]
  alerts: ActiveAlertsReport
  alertThresholdDays: number
}

export function RecentControlsPage({
  inventoryId,
  inventoryName,
  controls,
  alerts,
  alertThresholdDays,
}: RecentControlsPageProps) {
  const router = useRouter()
  const { correctorName, setCorrectorName } = useCorrectorName()
  const correction = usePublicCorrectionModal(() => router.refresh(), correctorName, alertThresholdDays)
  const anomalyCorrection = usePublicAnomalyCorrectionModal(() => router.refresh(), correctorName)

  const hasAlerts = alerts.anomalies.length > 0 || alerts.expired.length > 0 || alerts.atRisk.length > 0

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
        {hasAlerts && (
          <AnomalyAlertsBlock
            anomalies={alerts.anomalies}
            expired={alerts.expired}
            atRisk={alerts.atRisk}
            onCorrect={(item: ExpiryAlertItem) => correction.open(item)}
            onCorrectAnomaly={(item: AnomalyAlertItem) => anomalyCorrection.open(item)}
          />
        )}

        {controls.length === 0 ? (
          <p className="text-slate-500 text-center mt-12">
            Aucun contrôle réalisé pour l'instant.
          </p>
        ) : (
          <ControlsAccordion controls={controls} />
        )}
      </div>

      <PublicCorrectionModal
        isOpen={!!correction.selectedItem}
        itemName={correction.selectedItem?.itemName ?? ''}
        currentExpiryDate={correction.selectedItem ? formatDate(correction.selectedItem.latestExpiryDate) : ''}
        dateValue={correction.dateValue}
        dateError={correction.dateError}
        correctorName={correctorName}
        isSubmitting={correction.isSubmitting}
        error={correction.error}
        onDateChange={correction.handleDateChange}
        onCorrectorNameChange={setCorrectorName}
        onConfirm={correction.handleConfirm}
        onClose={correction.close}
      />

      <PublicAnomalyCorrectionModal
        isOpen={!!anomalyCorrection.selectedItem}
        itemName={anomalyCorrection.selectedItem?.itemName ?? ''}
        comment={anomalyCorrection.selectedItem?.comment ?? null}
        correctorName={correctorName}
        isSubmitting={anomalyCorrection.isSubmitting}
        error={anomalyCorrection.error}
        onCorrectorNameChange={setCorrectorName}
        onConfirm={anomalyCorrection.handleConfirm}
        onClose={anomalyCorrection.close}
      />
    </div>
  )
}
