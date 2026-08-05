import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/shared/lib/auth'
import { getFleetStatusUseCase } from '@/features/vehicle-tracking/domain/use-cases'
import { VehicleFleetStatusPage } from '@/features/vehicle-tracking/ui/VehicleFleetStatusPage'

export default async function VehiculesPage() {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const result = await getFleetStatusUseCase(user.associationId)
  if (!result.ok) {
    return (
      <p role="alert" className="text-sm text-red-600">
        {result.error}
      </p>
    )
  }

  return <VehicleFleetStatusPage vehicles={result.value} />
}
