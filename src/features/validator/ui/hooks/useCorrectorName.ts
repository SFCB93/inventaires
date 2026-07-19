'use client'

import { useState } from 'react'

const STORAGE_KEY = 'inventaires:correctorName'

export function useCorrectorName() {
  const [correctorName, setCorrectorNameRaw] = useState(() => {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem(STORAGE_KEY) ?? ''
  })

  function setCorrectorName(value: string) {
    setCorrectorNameRaw(value)
    window.localStorage.setItem(STORAGE_KEY, value)
  }

  return { correctorName, setCorrectorName }
}
