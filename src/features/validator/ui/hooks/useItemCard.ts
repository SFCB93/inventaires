'use client'

import { useRef, useState } from 'react'
import type { Item } from '../../domain/types'

const SWIPE_THRESHOLD = 100
const SWIPE_DOWN_THRESHOLD = 120
const BADGE_THRESHOLD = 30
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
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

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
    setIsModalOpen(true)
  }

  function handleConfirmAnomaly(comment: string) {
    setIsModalOpen(false)
    onAnomaly(comment, expiryDate.trim() || undefined)
  }

  function handleMarkAbsent() {
    onAnomaly('Absent', undefined)
  }

  function handleTouchStart(e: React.TouchEvent) {
    if ((e.target as HTMLElement).closest('input, textarea')) return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    setIsDragging(true)
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return
    const newDragX = e.touches[0].clientX - touchStartX.current
    const newDragY = e.touches[0].clientY - touchStartY.current
    setDragX(newDragX)
    setDragY(newDragY)
    onDragChange?.(newDragX)
  }

  function resetDrag() {
    touchStartX.current = null
    touchStartY.current = null
    setIsDragging(false)
    setDragX(0)
    setDragY(0)
    onDragChange?.(null)
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    const deltaY = e.changedTouches[0].clientY - touchStartY.current
    resetDrag()
    if (deltaY > SWIPE_DOWN_THRESHOLD && deltaY > Math.abs(deltaX)) {
      handleMarkAbsent()
    } else if (deltaX > SWIPE_THRESHOLD) {
      handleOpenAnomaly()
    } else if (deltaX < -SWIPE_THRESHOLD) {
      handleMarkPresent()
    }
  }

  function handleTouchCancel() {
    if (touchStartX.current === null) return
    resetDrag()
  }

  const isDownDominant = dragY > Math.abs(dragX)
  const glowOpacity = isDownDominant ? 0 : Math.min(Math.abs(dragX) / OPACITY_SCALE, MAX_GLOW_OPACITY)
  const showAbsentBadge = isDownDominant && dragY > BADGE_THRESHOLD
  const showAnomalyBadge = !isDownDominant && dragX > BADGE_THRESHOLD
  const showOkBadge = !isDownDominant && dragX < -BADGE_THRESHOLD
  const cardRotate = isDownDominant ? 0 : dragX * ROTATION_FACTOR

  return {
    expiryDate, setExpiryDate,
    dateError,
    isModalOpen, setIsModalOpen,
    dragX, dragY, isDragging,
    glowOpacity, showAnomalyBadge, showOkBadge, showAbsentBadge, cardRotate,
    handleMarkPresent,
    handleOpenAnomaly,
    handleConfirmAnomaly,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
  }
}
