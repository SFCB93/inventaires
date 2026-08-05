'use client'

import { useRef, useState } from 'react'

export function useDocumentUpload(inventoryId: string) {
  const [documentUrl, setDocumentUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | undefined>(undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    setUploadError(undefined)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('inventoryId', inventoryId)
      const response = await fetch('/api/logbook-upload', { method: 'POST', body: formData })
      const data = await response.json()
      if (!data.ok) {
        setUploadError(data.error)
        return
      }
      setDocumentUrl(data.url)
      setFileName(file.name)
    } catch {
      setUploadError("L'upload a échoué. Veuillez réessayer.")
    } finally {
      setIsUploading(false)
    }
  }

  function handleRemoveFile() {
    setDocumentUrl(null)
    setFileName(null)
    setUploadError(undefined)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return { documentUrl, fileName, isUploading, uploadError, fileInputRef, handleFileChange, handleRemoveFile }
}
