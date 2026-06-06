'use client'
import { useState } from 'react'
import { createAssociationAction } from '../../domain/actions'

export function useNewAssociationForm(onSuccess: () => void) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [isOpen, setIsOpen] = useState(false)

  function open() { setIsOpen(true) }

  function close() {
    setIsOpen(false)
    setName('')
    setEmail('')
    setError(undefined)
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    setError(undefined)
    const result = await createAssociationAction({ name, adminEmail: email })
    setIsSubmitting(false)
    if (!result.ok) { setError(result.error); return }
    close()
    onSuccess()
  }

  return { name, email, setName, setEmail, isSubmitting, error, isOpen, open, close, handleSubmit }
}
