'use client'

import { useState } from 'react'
import { logFuelAction } from '../../domain/actions'

export function useFuelLog(inventoryId: string, driverName: string, onSuccess: () => void) {
  const [liters, setLiters] = useState('')
  const [amount, setAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  async function handleSubmit() {
    setIsSubmitting(true)
    setError(undefined)
    const result = await logFuelAction({
      inventoryId,
      submittedBy: driverName,
      fuelLiters: Number(liters),
      amountEuros: amount ? Number(amount) : undefined,
    })
    setIsSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setLiters('')
    setAmount('')
    onSuccess()
  }

  return {
    liters,
    setLiters,
    amount,
    setAmount,
    isSubmitting,
    error,
    handleSubmit,
  }
}
