import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/shared/lib/auth'
import { listAssociationsUseCase } from '@/features/superadmin/domain/use-cases'
import { SuperadminPage } from '@/features/superadmin/ui/SuperadminPage'

export default async function AdminRoute() {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')
  if (user.role !== 'superadmin') redirect('/dashboard/inventaires')

  const result = await listAssociationsUseCase(user)
  if (!result.ok) return <p className="text-red-600 p-8">{result.error}</p>

  return <SuperadminPage associations={result.value} />
}
