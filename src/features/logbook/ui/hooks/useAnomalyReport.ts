'use client'

import { useState } from 'react'
import { reportAnomalyAction } from '../../domain/actions'

export function useAnomalyReport(inventoryId: string, driverName: string, onSuccess: () => void) {
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  async function handleSubmit() {
    setIsSubmitting(true)
    setError(undefined)
    const result = await reportAnomalyAction({ inventoryId, submittedBy: driverName, description })
    setIsSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setDescription('')
    onSuccess()
  }

  return { description, setDescription, isSubmitting, error, handleSubmit }
}
