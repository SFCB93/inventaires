'use client'

import type { InventoryWithCompartmentCount } from '../domain/types'
import { useInventoryListPage } from './hooks/useInventoryListPage'
import { InventoryList } from './InventoryList'
import { CreateInventoryForm } from './CreateInventoryForm'

interface InventoryListPageProps {
  inventories: InventoryWithCompartmentCount[]
}

export function InventoryListPage({ inventories }: InventoryListPageProps) {
  const { showCreate, isPending, createError, handleCreate, openCreate, closeCreate } = useInventoryListPage()

  return (
    <>
      <InventoryList inventories={inventories} onCreateClick={openCreate} />
      <CreateInventoryForm
        isOpen={showCreate}
        isSubmitting={isPending}
        error={createError ?? undefined}
        onSubmit={handleCreate}
        onCancel={closeCreate}
      />
    </>
  )
}
