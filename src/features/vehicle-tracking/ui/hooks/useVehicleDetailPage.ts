'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { linkDeviceAction, revokeDeviceAction, getVehiclePositionHistoryAction } from '../../domain/actions'
import type { PositionPoint, TimeRange } from '../../domain/types'

export function useVehicleDetailPage(inventoryId: string, initialIsLinked: boolean) {
  const [isLinked, setIsLinked] = useState(initialIsLinked)
  const [newApiKey, setNewApiKey] = useState<string | undefined>(undefined)
  const [isSubmittingDevice, setIsSubmittingDevice] = useState(false)
  const [deviceError, setDeviceError] = useState<string | null>(null)

  const [timeRange, setTimeRange] = useState<TimeRange>('24h')
  const [positions, setPositions] = useState<PositionPoint[]>([])
  const [isLoadingHistory, startHistoryTransition] = useTransition()

  const loadHistory = useCallback(
    (range: TimeRange) => {
      startHistoryTransition(async () => {
        const result = await getVehiclePositionHistoryAction(inventoryId, range)
        if (result.ok) setPositions(result.value)
      })
    },
    [inventoryId],
  )

  useEffect(() => {
    loadHistory(timeRange)
  }, [timeRange, loadHistory])

  async function handleGenerate() {
    setIsSubmittingDevice(true)
    setDeviceError(null)
    const result = await linkDeviceAction(inventoryId)
    setIsSubmittingDevice(false)
    if (!result.ok) {
      setDeviceError(result.error)
      return
    }
    setIsLinked(true)
    setNewApiKey(result.value.apiKey)
  }

  async function handleRevoke() {
    setIsSubmittingDevice(true)
    setDeviceError(null)
    const result = await revokeDeviceAction(inventoryId)
    setIsSubmittingDevice(false)
    if (!result.ok) {
      setDeviceError(result.error)
      return
    }
    setIsLinked(false)
    setNewApiKey(undefined)
  }

  return {
    isLinked,
    newApiKey,
    isSubmittingDevice,
    deviceError,
    handleGenerate,
    handleRevoke,
    timeRange,
    setTimeRange,
    positions,
    isLoadingHistory,
  }
}
