'use client'

import { useState } from 'react'
import { logFuelAction } from '../../domain/actions'
import { useDocumentUpload } from './useDocumentUpload'

export function useFuelLog(inventoryId: string, driverName: string, onSuccess: () => void) {
  const upload = useDocumentUpload(inventoryId)
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
      documentUrl: upload.documentUrl,
    })
    setIsSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setLiters('')
    setAmount('')
    upload.handleRemoveFile()
    onSuccess()
  }

  return {
    liters,
    setLiters,
    amount,
    setAmount,
    fileName: upload.fileName,
    isUploading: upload.isUploading,
    fileInputRef: upload.fileInputRef,
    handleFileChange: upload.handleFileChange,
    handleRemoveFile: upload.handleRemoveFile,
    isSubmitting,
    error: error ?? upload.uploadError,
    handleSubmit,
  }
}
