import { notFound } from 'next/navigation'
import { getAuthenticatedUser } from '@/shared/lib/auth'
import { getInventoryUseCase } from '@/features/gestion-inventaires/domain/use-cases'
import { InventoryDetailPage } from '@/features/gestion-inventaires/ui/InventoryDetailPage'

export default async function InventaireDetailPage({
  params,
}: {
  params: Promise<{ inventaireId: string }>
}) {
  const { inventaireId } = await params
  const user = await getAuthenticatedUser()
  if (!user) notFound()

  const result = await getInventoryUseCase(inventaireId, user.associationId)
  if (!result.ok) notFound()

  return <InventoryDetailPage inventory={result.value} />
}
