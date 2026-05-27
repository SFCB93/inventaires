'use client'

import { useState } from 'react'

export function useCreateInventoryForm(onCancel: () => void) {
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState(false)

  function handleSubmit(e: React.FormEvent, onSubmit: (name: string) => void) {
    e.preventDefault()
    if (!name.trim()) { setNameError(true); return }
    onSubmit(name.trim())
  }

  function handleCancel() {
    setName('')
    setNameError(false)
    onCancel()
  }

  return { name, setName, nameError, setNameError, handleSubmit, handleCancel }
}
