import { loadInventoryUseCase } from '@/features/validator/domain/use-cases'
import { ValidatorOrchestrator } from '@/features/validator/ui/ValidatorOrchestrator'
import { ErrorScreen } from '@/features/validator/ui/ErrorScreen'

interface Props {
  params: Promise<{ inventaireId: string }>
}

export default async function InventairePage({ params }: Props) {
  const { inventaireId } = await params
  const result = await loadInventoryUseCase(inventaireId)

  if (!result.ok) {
    return <ErrorScreen message={result.error} />
  }

  return (
    <ValidatorOrchestrator
      inventory={result.value.inventory}
      compartments={result.value.compartments}
      lastExpiryDates={result.value.lastExpiryDates}
    />
  )
}
