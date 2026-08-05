'use client'

import { useState } from 'react'
import { logMaintenanceAction } from '../../domain/actions'
import { useDocumentUpload } from './useDocumentUpload'

export function useMaintenanceLog(inventoryId: string, driverName: string, onSuccess: () => void) {
  const upload = useDocumentUpload(inventoryId)
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  async function handleSubmit() {
    setIsSubmitting(true)
    setError(undefined)
    const result = await logMaintenanceAction({
      inventoryId,
      submittedBy: driverName,
      description,
      documentUrl: upload.documentUrl,
    })
    setIsSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setDescription('')
    upload.handleRemoveFile()
    onSuccess()
  }

  return {
    description,
    setDescription,
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
