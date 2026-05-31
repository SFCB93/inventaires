// Dépasse 100 lignes : cette page combine le bloc alertes, le tableau paginé et les deux modales de correction.
// La logique est extraite dans useControlsListPage, useCorrectionModal et useAnomalyCorrectionModal.
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ControlSummary, ExpiryAlertReport, ExpiryAlertItem, AnomalyAlertItem } from '../domain/types'
import { useControlsListPage } from './hooks/useControlsListPage'
import { useCorrectionModal } from './hooks/useCorrectionModal'
import { useAnomalyCorrectionModal } from './hooks/useAnomalyCorrectionModal'
import { AnomalyAlertsBlock } from './AnomalyAlertsBlock'
import { CorrectionModal } from './CorrectionModal'
import { AnomalyCorrectionModal } from './AnomalyCorrectionModal'
import { formatDate, formatDateTime } from '@/shared/lib/format'

interface ControlsListPageProps {
  controls: ControlSummary[]
  alerts: ExpiryAlertReport
  alertThresholdDays: number
}

export function ControlsListPage({ controls, alerts, alertThresholdDays }: ControlsListPageProps) {
  const router = useRouter()
  const { paginatedControls, currentPage, totalPages, goToPage } = useControlsListPage(controls)
  const correction = useCorrectionModal(() => router.refresh(), alertThresholdDays)
  const anomalyCorrection = useAnomalyCorrectionModal(() => router.refresh())

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Contrôles</h1>

      <AnomalyAlertsBlock
        anomalies={alerts.anomalies}
        expired={alerts.expired}
        atRisk={alerts.atRisk}
        onCorrect={(item: ExpiryAlertItem) => correction.open(item)}
        onCorrectAnomaly={(item: AnomalyAlertItem) => anomalyCorrection.open(item)}
      />

      {controls.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">Aucun contrôle enregistré pour l'instant.</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Inventaire</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Vérificateur</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Date</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">Anomalies</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">À risque</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">À corriger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedControls.map((control) => {
                  return (
                  <tr key={control.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <Link href={`/dashboard/controles/${control.id}`} className="hover:text-blue-600 transition-colors">
                        {control.inventoryName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{control.verifierName}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDateTime(control.submittedAt)}</td>
                    <td className="px-4 py-3 text-center">
                      {control.anomalyCount > 0
                        ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold">{control.anomalyCount}</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {control.atRiskCount > 0
                        ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">{control.atRiskCount}</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {control.anomalyCount > 0
                        ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">{control.anomalyCount}</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors">
                ← Précédent
              </button>
              <span className="text-sm text-slate-500">{currentPage} / {totalPages}</span>
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors">
                Suivant →
              </button>
            </div>
          )}
        </>
      )}

      <CorrectionModal
        isOpen={!!correction.selectedItem}
        itemName={correction.selectedItem?.itemName ?? ''}
        currentExpiryDate={correction.selectedItem ? formatDate(correction.selectedItem.latestExpiryDate) : ''}
        dateValue={correction.dateValue}
        dateError={correction.dateError}
        isSubmitting={correction.isSubmitting}
        error={correction.error}
        onDateChange={correction.handleDateChange}
        onConfirm={correction.handleConfirm}
        onClose={correction.close}
      />

      <AnomalyCorrectionModal
        isOpen={!!anomalyCorrection.selectedItem}
        itemName={anomalyCorrection.selectedItem?.itemName ?? ''}
        comment={anomalyCorrection.selectedItem?.comment ?? null}
        isSubmitting={anomalyCorrection.isSubmitting}
        error={anomalyCorrection.error}
        onConfirm={anomalyCorrection.handleConfirm}
        onClose={anomalyCorrection.close}
      />
    </div>
  )
}
