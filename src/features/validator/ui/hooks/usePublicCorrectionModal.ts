'use client'

import { useState } from 'react'
import type { ExpiryAlertItem } from '@/shared/domain/alerts'
import { createPublicCorrectionAction } from '@/features/controls/domain/public-actions'
import { DEFAULT_ALERT_THRESHOLD_DAYS } from '@/shared/lib/alert-defaults'

export function usePublicCorrectionModal(
  onSuccess: () => void,
  correctorName: string,
  alertThresholdDays = DEFAULT_ALERT_THRESHOLD_DAYS,
) {
  const [selectedItem, setSelectedItem] = useState<ExpiryAlertItem | null>(null)
  const [dateValue, setDateValue] = useState('')
  const [dateError, setDateError] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | undefined>()

  function open(item: ExpiryAlertItem) {
    setSelectedItem(item)
    setDateValue('')
    setDateError(undefined)
    setError(undefined)
  }

  function close() {
    setSelectedItem(null)
    setIsSubmitting(false)
  }

  function handleDateChange(value: string) {
    setDateValue(value)
    if (dateError) setDateError(undefined)
  }

  async function handleConfirm() {
    if (!selectedItem) return
    if (!correctorName.trim()) { setError('Le nom du correcteur est obligatoire.'); return }
    if (!dateValue) { setDateError('La date est obligatoire.'); return }
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + alertThresholdDays)
    if (new Date(dateValue) <= cutoff) {
      setDateError(`Cette date ne résout pas l'alerte (doit être > J+${alertThresholdDays}).`)
      return
    }
    setIsSubmitting(true)
    setError(undefined)
    const result = await createPublicCorrectionAction({
      itemId: selectedItem.itemId,
      inventoryId: selectedItem.inventoryId,
      newExpiryDate: dateValue,
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

  return { selectedItem, dateValue, dateError, isSubmitting, error, open, close, handleDateChange, handleConfirm }
}
