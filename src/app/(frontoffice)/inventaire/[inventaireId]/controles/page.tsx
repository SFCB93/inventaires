import { loadInventoryUseCase, listRecentControlsUseCase } from '@/features/validator/domain/use-cases'
import { getInventoryActiveAlertsUseCase, getAlertThresholdUseCase } from '@/features/controls/domain/use-cases'
import { RecentControlsPage } from '@/features/validator/ui/RecentControlsPage'
import { ErrorScreen } from '@/features/validator/ui/ErrorScreen'

interface Props {
  params: Promise<{ inventaireId: string }>
}

export default async function ControlesPage({ params }: Props) {
  const { inventaireId } = await params
  const [inventoryResult, controlsResult] = await Promise.all([
    loadInventoryUseCase(inventaireId),
    listRecentControlsUseCase(inventaireId),
  ])

  if (!inventoryResult.ok) {
    return <ErrorScreen message={inventoryResult.error} />
  }

  if (!controlsResult.ok) {
    return <ErrorScreen message={controlsResult.error} />
  }

  const associationId = inventoryResult.value.inventory.associationId
  const alertThresholdDays = await getAlertThresholdUseCase(associationId)
  const alertsResult = await getInventoryActiveAlertsUseCase(inventaireId, associationId, alertThresholdDays)
  const alerts = alertsResult.ok ? alertsResult.value : { anomalies: [], expired: [], atRisk: [] }

  return (
    <RecentControlsPage
      inventoryId={inventaireId}
      inventoryName={inventoryResult.value.inventory.name}
      controls={controlsResult.value}
      alerts={alerts}
      alertThresholdDays={alertThresholdDays}
    />
  )
}
