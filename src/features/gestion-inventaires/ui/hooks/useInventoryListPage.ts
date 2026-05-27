'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createInventoryAction } from '../../domain/actions'

export function useInventoryListPage() {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [createError, setCreateError] = useState<string | null>(null)

  function handleCreate(name: string) {
    setCreateError(null)
    startTransition(async () => {
      const result = await createInventoryAction(name)
      if (!result.ok) { setCreateError(result.error); return }
      setShowCreate(false)
      router.push(`/dashboard/inventaires/${result.value.id}`)
    })
  }

  function openCreate() {
    setCreateError(null)
    setShowCreate(true)
  }

  function closeCreate() {
    setShowCreate(false)
    setCreateError(null)
  }

  return { showCreate, isPending, createError, handleCreate, openCreate, closeCreate }
}
