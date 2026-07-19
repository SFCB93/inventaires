'use client'

import { useRef, useState } from 'react'

const SWIPE_DOWN_THRESHOLD = 100

export function useAnomalyModal(
  isOpen: boolean,
  onConfirm: (comment: string) => void,
  onCancel: () => void,
) {
  const [comment, setCommentRaw] = useState('')
  const [error, setError] = useState(false)
  const touchStartY = useRef<number | null>(null)

  function setComment(value: string) {
    setCommentRaw(value)
    if (error) setError(false)
  }

  function handleConfirm() {
    if (!comment.trim()) { setError(true); return }
    setCommentRaw('')
    setError(false)
    onConfirm(comment.trim())
  }

  function handleCancel() {
    setCommentRaw('')
    setError(false)
    onCancel()
  }

  function handleTouchStart(e: React.TouchEvent) {
    if ((e.target as HTMLElement).closest('textarea')) return
    touchStartY.current = e.touches[0].clientY
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartY.current === null) return
    const deltaY = e.changedTouches[0].clientY - touchStartY.current
    touchStartY.current = null
    if (deltaY > SWIPE_DOWN_THRESHOLD) handleCancel()
  }

  function handleTouchCancel() {
    touchStartY.current = null
  }

  return {
    comment, setComment, error, handleConfirm, handleCancel,
    handleTouchStart, handleTouchEnd, handleTouchCancel,
  }
}
