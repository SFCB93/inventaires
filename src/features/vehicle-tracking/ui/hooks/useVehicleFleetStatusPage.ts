'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { linkDeviceAction, listUnlinkedInventoriesAction } from '../../domain/actions'
import type { UnlinkedInventory } from '../../domain/types'

export function useVehicleFleetStatusPage() {
  const router = useRouter()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [candidates, setCandidates] = useState<UnlinkedInventory[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newApiKey, setNewApiKey] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)
  const [loadError, setLoadError] = useState<string | undefined>(undefined)

  async function openAdd() {
    setIsAddOpen(true)
    setNewApiKey(undefined)
    setError(undefined)
    setLoadError(undefined)
    const result = await listUnlinkedInventoriesAction()
    if (result.ok) {
      setCandidates(result.value)
    } else {
      setLoadError(result.error)
    }
  }

  function closeAdd() {
    setIsAddOpen(false)
    if (newApiKey) router.refresh()
  }

  async function handleAdd(inventoryId: string) {
    setIsSubmitting(true)
    setError(undefined)
    const result = await linkDeviceAction(inventoryId)
    setIsSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setNewApiKey(result.value.apiKey)
  }

  return {
    isAddOpen,
    candidates,
    isSubmitting,
    newApiKey,
    error,
    loadError,
    openAdd,
    closeAdd,
    handleAdd,
    goToVehicle: (inventoryId: string) => router.push(`/dashboard/vehicules/${inventoryId}`),
  }
}
