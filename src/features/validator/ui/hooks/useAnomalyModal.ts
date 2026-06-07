'use client'

import { useState } from 'react'

export function useAnomalyModal(
  isOpen: boolean,
  onConfirm: (comment: string) => void,
  onCancel: () => void,
) {
  const [comment, setCommentRaw] = useState('')
  const [error, setError] = useState(false)

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

  return { comment, setComment, error, handleConfirm, handleCancel }
}
