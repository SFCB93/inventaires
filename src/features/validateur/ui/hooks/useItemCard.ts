'use client'

import { useRef, useState } from 'react'
import type { Item } from '../../domain/types'

const SWIPE_THRESHOLD = 60
const BADGE_THRESHOLD = 20
const ROTATION_FACTOR = 0.04
const OPACITY_SCALE = 100
const MAX_GLOW_OPACITY = 0.5

export function useItemCard(
  item: Item,
  onPresent: (expiryDate: string | undefined) => void,
  onAnomaly: (comment: string, expiryDate: string | undefined) => void,
  onDragChange?: (dragX: number | null) => void,
) {
  const [expiryDate, setExpiryDateRaw] = useState('')
  const [dateError, setDateError] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
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
    if ((e.target as HTMLElement).closest('input, textarea')) return
    touchStartX.current = e.touches[0].clientX
    setIsDragging(true)
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const newDragX = e.touches[0].clientX - touchStartX.current
    setDragX(newDragX)
    onDragChange?.(newDragX)
  }

  function resetDrag() {
    touchStartX.current = null
    setIsDragging(false)
    setDragX(0)
    onDragChange?.(null)
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    resetDrag()
    if (delta > SWIPE_THRESHOLD) handleOpenAnomaly()
    else if (delta < -SWIPE_THRESHOLD) handleMarkPresent()
  }

  function handleTouchCancel() {
    if (touchStartX.current === null) return
    resetDrag()
  }

  const glowOpacity = Math.min(Math.abs(dragX) / OPACITY_SCALE, MAX_GLOW_OPACITY)
  const showAnomalyBadge = dragX > BADGE_THRESHOLD
  const showOkBadge = dragX < -BADGE_THRESHOLD
  const cardRotate = dragX * ROTATION_FACTOR

  return {
    expiryDate, setExpiryDate,
    dateError,
    isModalOpen, setIsModalOpen,
    dragX, isDragging,
    glowOpacity, showAnomalyBadge, showOkBadge, cardRotate,
    handleMarkPresent,
    handleOpenAnomaly,
    handleConfirmAnomaly,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
  }
}
