'use client'

import { useState } from 'react'
import type { ExpiryAlertItem } from '../../domain/types'
import { createCorrectionAction } from '../../domain/actions'

export function useCorrectionModal(onSuccess: () => void) {
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
    if (!dateValue) { setDateError('La date est obligatoire.'); return }
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + 30)
    if (new Date(dateValue) <= cutoff) {
      setDateError("Cette date ne résout pas l'alerte (doit être > J+30).")
      return
    }
    setIsSubmitting(true)
    setError(undefined)
    const result = await createCorrectionAction({
      itemId: selectedItem.itemId,
      inventoryId: selectedItem.inventoryId,
      newExpiryDate: dateValue,
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
