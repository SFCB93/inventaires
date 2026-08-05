'use client'

import { useState } from 'react'
import { useRememberedName } from '@/shared/ui/hooks/useRememberedName'

export function useSummaryScreen(onSubmit: (verifierName: string) => void) {
  const { rememberedName: verifierName, setRememberedName: setVerifierNameRaw } = useRememberedName()
  const [nameError, setNameError] = useState(false)

  function setVerifierName(value: string) {
    setVerifierNameRaw(value)
    if (nameError) setNameError(false)
  }

  function handleSubmit() {
    if (!verifierName.trim()) { setNameError(true); return }
    onSubmit(verifierName.trim())
  }

  return { verifierName, setVerifierName, nameError, handleSubmit }
}
