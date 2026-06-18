import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/shared/lib/auth'
import { listControlsUseCase, getActiveAlertsUseCase, getAlertThresholdUseCase } from '@/features/controls/domain/use-cases'
import { ControlsListPage } from '@/features/controls/ui/ControlsListPage'

export default async function ControlesPage() {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')
  if (user.role === 'superadmin' && !user.associationId) redirect('/admin')
  if (user.role === 'admin' && !user.associationId) redirect('/associations')

  const alertThresholdDays = await getAlertThresholdUseCase(user.associationId)
  const [controlsResult, alertsResult] = await Promise.all([
    listControlsUseCase(user.associationId),
    getActiveAlertsUseCase(user.associationId, alertThresholdDays),
  ])

  if (!controlsResult.ok) {
    return <p className="text-red-600 p-8">{controlsResult.error}</p>
  }

  return (
    <ControlsListPage
      controls={controlsResult.value}
      alerts={alertsResult.ok ? alertsResult.value : { anomalies: [], expired: [], atRisk: [] }}
      alertThresholdDays={alertThresholdDays}
    />
  )
}
