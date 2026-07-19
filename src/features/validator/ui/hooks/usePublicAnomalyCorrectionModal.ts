'use client'

import { useState } from 'react'
import type { AnomalyAlertItem } from '@/shared/domain/alerts'
import { createPublicAnomalyCorrectionAction } from '@/features/controls/domain/public-actions'

export function usePublicAnomalyCorrectionModal(onSuccess: () => void, correctorName: string) {
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
    if (!correctorName.trim()) { setError('Le nom du correcteur est obligatoire.'); return }
    setIsSubmitting(true)
    setError(undefined)
    const result = await createPublicAnomalyCorrectionAction({
      itemId: selectedItem.itemId,
      inventoryId: selectedItem.inventoryId,
      correctedBy: correctorName.trim(),
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
