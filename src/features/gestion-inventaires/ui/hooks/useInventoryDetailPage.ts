'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Result } from '@/shared/domain/result'
import type { InventoryWithCompartments } from '../../domain/types'
import type { ItemFormValues } from '../ItemForm'
import {
  updateInventoryAction, deleteInventoryAction,
  createCompartmentAction, updateCompartmentAction, deleteCompartmentAction, reorderCompartmentsAction,
  createItemAction, updateItemAction, deleteItemAction, reorderItemsAction,
} from '../../domain/actions'

export function useInventoryDetailPage(inventory: InventoryWithCompartments) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const id = inventory.id

  function run<T>(action: () => Promise<Result<T>>, refresh = true) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (!result.ok) { setError(result.error); return }
      if (refresh) router.refresh()
    })
  }

  const handleRenameInventory = (name: string) => run(() => updateInventoryAction(id, name))
  const handleAddCompartment = (name: string) => run(() => createCompartmentAction(id, name))
  const handleRenameCompartment = (cid: string, name: string) => run(() => updateCompartmentAction(id, cid, name))
  const handleDeleteCompartment = (cid: string) => run(() => deleteCompartmentAction(id, cid))
  const handleReorderCompartments = (invId: string, ids: string[]) => run(() => reorderCompartmentsAction(invId, ids), false)
  const handleDeleteItem = (iid: string) => run(() => deleteItemAction(id, iid))
  const handleReorderItems = (cid: string, ids: string[]) => run(() => reorderItemsAction(id, cid, ids), false)

  function handleDeleteInventory() {
    setError(null)
    startTransition(async () => {
      const result = await deleteInventoryAction(id)
      if (!result.ok) { setError(result.error); return }
      router.push('/dashboard/inventaires')
    })
  }

  // photoStoragePath est toujours '' : l'upload Firebase Storage n'est pas implémenté,
  // les photos sont stockées en base64 dans photoUrl ou comme URL externe.
  const handleAddItem = (compartmentId: string, values: ItemFormValues) =>
    run(() => createItemAction(id, { compartmentId, name: values.name, photoUrl: values.photoUrl, photoStoragePath: '', hasExpiry: values.hasExpiry, isCritical: values.isCritical }))

  const handleEditItem = (itemId: string, values: ItemFormValues) =>
    run(() => updateItemAction(id, itemId, { name: values.name, photoUrl: values.photoUrl, photoStoragePath: '', hasExpiry: values.hasExpiry, isCritical: values.isCritical }))

  return {
    isPending, error,
    handleRenameInventory,
    handleDeleteInventory,
    handleAddCompartment,
    handleRenameCompartment,
    handleDeleteCompartment,
    handleReorderCompartments,
    handleAddItem,
    handleEditItem,
    handleDeleteItem,
    handleReorderItems,
  }
}
