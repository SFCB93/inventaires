import { notFound } from 'next/navigation'
import { getAuthenticatedUser } from '@/shared/lib/auth'
import { getVehicleDetailUseCase } from '@/features/vehicle-tracking/domain/use-cases'
import { getLogbookHistoryUseCase } from '@/features/logbook/domain/use-cases'
import { VehicleDetailPage } from '@/features/vehicle-tracking/ui/VehicleDetailPage'

export default async function VehiculeDetailPage({
  params,
}: {
  params: Promise<{ inventoryId: string }>
}) {
  const { inventoryId } = await params
  const user = await getAuthenticatedUser()
  if (!user) notFound()

  const [vehicleResult, logbookResult] = await Promise.all([
    getVehicleDetailUseCase(inventoryId, user.associationId),
    getLogbookHistoryUseCase(inventoryId, user.associationId),
  ])
  if (!vehicleResult.ok) notFound()

  return (
    <VehicleDetailPage
      inventoryId={inventoryId}
      inventoryName={vehicleResult.value.name}
      isLinked={vehicleResult.value.isLinked}
      logbookEntries={logbookResult.ok ? logbookResult.value : []}
    />
  )
}
