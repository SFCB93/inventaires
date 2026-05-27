'use client'

import { useRef, useState } from 'react'
import type { Item } from '../../domain/types'

export function useItemCard(
  item: Item,
  onPresent: (expiryDate: string | undefined) => void,
  onAnomaly: (comment: string, expiryDate: string | undefined) => void,
) {
  const [expiryDate, setExpiryDateRaw] = useState('')
  const [dateError, setDateError] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const touchStartX = useRef<number | null>(null)

  function setExpiryDate(value: string) {
    setExpiryDateRaw(value)
    if (dateError) setDateError(false)
  }

  function validateDate(): boolean {
    if (item.hasExpiry && item.isCritical && !expiryDate.trim()) {
      setDateError(true)
      return false
    }
    return true
  }

  function handleMarkPresent() {
    if (!validateDate()) return
    onPresent(expiryDate.trim() || undefined)
  }

  function handleOpenAnomaly() {
    if (!validateDate()) return
    setIsModalOpen(true)
  }

  function handleConfirmAnomaly(comment: string) {
    setIsModalOpen(false)
    onAnomaly(comment, expiryDate.trim() || undefined)
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (delta > 60) handleMarkPresent()
    else if (delta < -60) handleOpenAnomaly()
  }

  return {
    expiryDate, setExpiryDate,
    dateError,
    isModalOpen, setIsModalOpen,
    handleMarkPresent,
    handleOpenAnomaly,
    handleConfirmAnomaly,
    handleTouchStart,
    handleTouchEnd,
  }
}
