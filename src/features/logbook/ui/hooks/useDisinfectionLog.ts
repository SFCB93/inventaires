'use client'

import { useState } from 'react'
import { logDisinfectionAction } from '../../domain/actions'
import type { DisinfectionProtocol } from '../../domain/types'

export function useDisinfectionLog(inventoryId: string, driverName: string, onSuccess: () => void) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  async function handleSubmit(protocol: DisinfectionProtocol) {
    setIsSubmitting(true)
    setError(undefined)
    const result = await logDisinfectionAction({ inventoryId, submittedBy: driverName, disinfectionProtocol: protocol })
    setIsSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onSuccess()
  }

  return { isSubmitting, error, handleSubmit }
}
