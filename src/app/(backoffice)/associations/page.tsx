import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/shared/lib/auth'
import { listUserAssociationsUseCase } from '@/features/team/domain/use-cases'
import { AssociationsPickerPage } from '@/features/team/ui/AssociationsPickerPage'

export default async function AssociationsPage() {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')
  if (user.role === 'superadmin') redirect('/admin')
  if (user.associationIds.length <= 1) redirect('/dashboard/inventaires')

  const result = await listUserAssociationsUseCase(user)
  if (!result.ok) return <p className="text-red-600 p-8">{result.error}</p>

  return <AssociationsPickerPage associations={result.value} />
}
