import { notFound } from 'next/navigation'
import { getAuthenticatedUser } from '@/shared/lib/auth'
import { getVehicleDetailUseCase } from '@/features/vehicle-tracking/domain/use-cases'
import { VehicleDetailPage } from '@/features/vehicle-tracking/ui/VehicleDetailPage'

export default async function VehiculeDetailPage({
  params,
}: {
  params: Promise<{ inventoryId: string }>
}) {
  const { inventoryId } = await params
  const user = await getAuthenticatedUser()
  if (!user) notFound()

  const result = await getVehicleDetailUseCase(inventoryId, user.associationId)
  if (!result.ok) notFound()

  return (
    <VehicleDetailPage
      inventoryId={inventoryId}
      inventoryName={result.value.name}
      isLinked={result.value.isLinked}
    />
  )
}
