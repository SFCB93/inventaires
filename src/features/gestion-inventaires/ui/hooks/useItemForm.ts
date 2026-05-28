'use client'

import { useRef, useState } from 'react'
import { resizeImageToBase64 } from '@/shared/lib/resize-image'
import type { ItemFormValues } from '../ItemForm'

export function useItemForm(initialValues?: ItemFormValues) {
  const [initialPhotoUrl] = useState(initialValues?.photoUrl ?? '')

  const [name, setName] = useState(initialValues?.name ?? '')
  const [photoBase64, setPhotoBase64] = useState('')
  const [photoCleared, setPhotoCleared] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [hasExpiry, setHasExpiryRaw] = useState(initialValues?.hasExpiry ?? false)
  const [isCritical, setIsCriticalRaw] = useState(initialValues?.isCritical ?? false)
  const [nameError, setNameError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const previewUrl = photoBase64 || (photoCleared ? null : initialPhotoUrl || null)

  function setHasExpiry(v: boolean) { setHasExpiryRaw(v); if (!v) setIsCriticalRaw(false) }
  function setIsCritical(v: boolean) { setIsCriticalRaw(v); if (v) setHasExpiryRaw(true) }

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

  async function handlePhotoPaste(e: React.ClipboardEvent) {
    const imageItem = Array.from(e.clipboardData.items).find(item => item.type.startsWith('image/'))
    if (!imageItem) return
    const file = imageItem.getAsFile()
    if (!file) return
    if (isResizing) return
    e.preventDefault()
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
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function getValues(): ItemFormValues {
    return {
      name: name.trim(),
      photoUrl: photoBase64 || (photoCleared ? '' : initialPhotoUrl),
      hasExpiry,
      isCritical,
    }
  }

  return {
    name, setName,
    hasExpiry, setHasExpiry,
    isCritical, setIsCritical,
    nameError, setNameError,
    isResizing, previewUrl, fileInputRef,
    handlePhotoChange, handlePhotoPaste, handleRemovePhoto,
    getValues,
  }
}
