'use client'

import { useEffect, useState } from 'react'
import { listMileageHistoryAction, logMileageAction } from '../../domain/actions'
import type { MileageEntry } from '../../domain/types'

export function useMileageLog(inventoryId: string, driverName: string, onSuccess: () => void) {
  const [history, setHistory] = useState<MileageEntry[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [historyError, setHistoryError] = useState<string | undefined>(undefined)
  const [km, setKm] = useState('')
  const [mission, setMission] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    listMileageHistoryAction(inventoryId).then((result) => {
      if (result.ok) {
        setHistory(result.value)
      } else {
        setHistoryError(result.error)
      }
      setIsLoadingHistory(false)
    })
  }, [inventoryId])

  async function handleSubmit() {
    setIsSubmitting(true)
    setError(undefined)
    const result = await logMileageAction({ inventoryId, submittedBy: driverName, km: Number(km), mission })
    setIsSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setKm('')
    setMission('')
    onSuccess()
  }

  return { history, isLoadingHistory, historyError, km, setKm, mission, setMission, isSubmitting, error, handleSubmit }
}
