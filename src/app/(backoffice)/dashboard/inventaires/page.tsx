import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/shared/lib/auth'
import { listInventoriesUseCase } from '@/features/gestion-inventaires/domain/use-cases'
import { InventoryListPage } from '@/features/gestion-inventaires/ui/InventoryListPage'

export default async function InventairesPage() {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')
  if (user.role === 'superadmin' && !user.associationId) redirect('/admin')

  const result = await listInventoriesUseCase(user.associationId)
  if (!result.ok) {
    return (
      <p role="alert" className="text-sm text-red-600">
        {result.error}
      </p>
    )
  }

  return <InventoryListPage inventories={result.value} />
}
