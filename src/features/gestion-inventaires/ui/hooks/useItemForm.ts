'use client'

import { useRef, useState } from 'react'
import { resizeImageToBase64 } from '@/shared/lib/resize-image'
import type { ItemFormValues } from '../ItemForm'

export function useItemForm(initialValues?: Partial<ItemFormValues>) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [photoBase64, setPhotoBase64] = useState('')
  const [photoUrl] = useState(initialValues?.photoUrl ?? '')
  const [photoCleared, setPhotoCleared] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [hasExpiry, setHasExpiryRaw] = useState(initialValues?.hasExpiry ?? false)
  const [isCritical, setIsCriticalRaw] = useState(initialValues?.isCritical ?? false)
  const [nameError, setNameError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const previewUrl = photoBase64 || (photoCleared ? null : photoUrl || null)

  function setHasExpiry(value: boolean) {
    setHasExpiryRaw(value)
    if (!value) setIsCriticalRaw(false)
  }

  function setIsCritical(value: boolean) {
    setIsCriticalRaw(value)
    if (value) setHasExpiryRaw(true)
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsResizing(true)
    try {
      setPhotoBase64(await resizeImageToBase64(file))
      setPhotoCleared(false)
    } catch {
      // ignore — photo stays unchanged
    } finally {
      setIsResizing(false)
    }
  }

  function handleRemovePhoto() {
    setPhotoBase64('')
    setPhotoCleared(true)
  }

  function getValues(): ItemFormValues {
    return {
      name: name.trim(),
      photoUrl: photoBase64 || (photoCleared ? '' : photoUrl),
      hasExpiry,
      isCritical,
    }
  }

  return {
    name, setName,
    hasExpiry, setHasExpiry,
    isCritical, setIsCritical,
    nameError, setNameError,
    isResizing,
    previewUrl,
    fileInputRef,
    handlePhotoChange,
    handleRemovePhoto,
    getValues,
  }
}
