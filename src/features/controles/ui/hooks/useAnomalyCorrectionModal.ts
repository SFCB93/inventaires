'use client'

import { useState } from 'react'
import type { AnomalyAlertItem } from '../../domain/types'
import { createAnomalyCorrectionAction } from '../../domain/actions'

export function useAnomalyCorrectionModal(onSuccess: () => void) {
  const [selectedItem, setSelectedItem] = useState<AnomalyAlertItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | undefined>()

  function open(item: AnomalyAlertItem) {
    setSelectedItem(item)
    setError(undefined)
  }

  function close() {
    setSelectedItem(null)
    setIsSubmitting(false)
  }

  async function handleConfirm() {
    if (!selectedItem) return
    setIsSubmitting(true)
    setError(undefined)
    const result = await createAnomalyCorrectionAction({
      itemId: selectedItem.itemId,
      inventoryId: selectedItem.inventoryId,
    })
    if (!result.ok) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }
    setIsSubmitting(false)
    close()
    onSuccess()
  }

  return { selectedItem, isSubmitting, error, open, close, handleConfirm }
}
