'use client'

import { useState, useEffect, useCallback } from 'react'
import QRCode from 'qrcode'

export function useQrCodeModal(inventoryId: string) {
  const [isOpen, setIsOpen] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [inventoryUrl, setInventoryUrl] = useState('')

  useEffect(() => {
    setInventoryUrl(`${window.location.origin}/inventaire/${inventoryId}`)
  }, [inventoryId])

  useEffect(() => {
    if (!isOpen || !inventoryUrl) return
    setQrDataUrl('')
    setError(undefined)
    QRCode.toDataURL(inventoryUrl, { width: 256, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => setError('Impossible de générer le QR code.'))
  }, [isOpen, inventoryUrl])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false) }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen])

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inventoryUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable
    }
  }, [inventoryUrl])

  const handlePrint = useCallback(() => window.print(), [])

  return { isOpen, open, close, qrDataUrl, inventoryUrl, copied, error, handleCopy, handlePrint }
}
