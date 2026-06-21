import { loadInventoryUseCase, listRecentControlsUseCase } from '@/features/validator/domain/use-cases'
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

  return (
    <RecentControlsPage
      inventoryId={inventaireId}
      inventoryName={inventoryResult.value.inventory.name}
      controls={controlsResult.ok ? controlsResult.value : []}
    />
  )
}
