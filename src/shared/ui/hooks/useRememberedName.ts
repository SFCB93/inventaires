'use client'

import { useState } from 'react'

const STORAGE_KEY = 'inventaires:correctorName'

export function useRememberedName() {
  const [rememberedName, setRememberedNameRaw] = useState(() => {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem(STORAGE_KEY) ?? ''
  })

  function setRememberedName(value: string) {
    setRememberedNameRaw(value)
    window.localStorage.setItem(STORAGE_KEY, value)
  }

  return { rememberedName, setRememberedName }
}
