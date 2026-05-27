'use client'

import { useRef, useState } from 'react'
import { resizeImageToBase64 } from '@/shared/lib/resize-image'
import type { ItemFormValues } from '../ItemForm'

export function useItemForm(initialValues?: Partial<ItemFormValues>) {
  const initUrl = initialValues?.photoUrl ?? ''
  const initMode: 'file' | 'url' = initUrl.startsWith('https://') && !initUrl.startsWith('https://firebasestorage.googleapis.com') ? 'url' : 'file'

  const [name, setName] = useState(initialValues?.name ?? '')
  const [initialPhotoUrl] = useState(initUrl)
  const [photoMode, setPhotoMode] = useState<'file' | 'url'>(initMode)
  const [photoBase64, setPhotoBase64] = useState('')
  const [urlInput, setUrlInput] = useState(initMode === 'url' ? initUrl : '')
  const [photoCleared, setPhotoCleared] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [hasExpiry, setHasExpiryRaw] = useState(initialValues?.hasExpiry ?? false)
  const [isCritical, setIsCriticalRaw] = useState(initialValues?.isCritical ?? false)
  const [nameError, setNameError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const urlError = urlInput !== '' && !urlInput.startsWith('https://')
  const isInitialFileUrl = !initialPhotoUrl.startsWith('https://') || initialPhotoUrl.startsWith('https://firebasestorage.googleapis.com')
  const filePreview = photoBase64 || (photoCleared ? null : (isInitialFileUrl ? initialPhotoUrl || null : null))
  const previewUrl = photoMode === 'url' ? (urlInput.startsWith('https://') ? urlInput : null) : filePreview

  function setHasExpiry(v: boolean) { setHasExpiryRaw(v); if (!v) setIsCriticalRaw(false) }
  function setIsCritical(v: boolean) { setIsCriticalRaw(v); if (v) setHasExpiryRaw(true) }

  function onPhotoModeChange(mode: 'file' | 'url') {
    setPhotoMode(mode)
    if (mode === 'file') { setUrlInput('') }
    else { setPhotoBase64(''); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  function onPhotoUrlChange(url: string) {
    setUrlInput(url)
    setPhotoBase64('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    setPhotoCleared(false)
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsResizing(true)
    setUrlInput('')
    setPhotoMode('file')
    try {
      setPhotoBase64(await resizeImageToBase64(file))
      setPhotoCleared(false)
    } catch {
      // ignore — photo stays unchanged
    } finally {
      setIsResizing(false)
    }
  }

  function handleRemovePhoto() { setPhotoBase64(''); setUrlInput(''); setPhotoCleared(true); setPhotoMode('file') }

  function getValues(): ItemFormValues {
    return {
      name: name.trim(),
      photoUrl: photoMode === 'url' ? urlInput.trim() : (photoBase64 || (photoCleared ? '' : initialPhotoUrl)),
      hasExpiry,
      isCritical,
    }
  }

  return {
    name, setName, hasExpiry, setHasExpiry, isCritical, setIsCritical, nameError, setNameError,
    isResizing, previewUrl, fileInputRef, handlePhotoChange, handleRemovePhoto, getValues,
    photoMode, urlInput, urlError, onPhotoModeChange, onPhotoUrlChange,
  }
}
