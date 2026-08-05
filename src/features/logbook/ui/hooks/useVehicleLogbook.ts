'use client'

import { useState } from 'react'
import { useRememberedName } from '@/shared/ui/hooks/useRememberedName'
import type { HubAction } from '../../domain/types'
import { useMileageLog } from './useMileageLog'
import { useFuelLog } from './useFuelLog'
import { useAnomalyReport } from './useAnomalyReport'
import { useMaintenanceLog } from './useMaintenanceLog'
import { useDisinfectionLog } from './useDisinfectionLog'

export type LogbookScreen = 'hub' | HubAction | 'confirmation'

export function useVehicleLogbook(inventoryId: string) {
  const { rememberedName: driverName, setRememberedName: setDriverName } = useRememberedName()
  const [nameError, setNameError] = useState(false)
  const [screen, setScreen] = useState<LogbookScreen>('hub')
  const [confirmationMessage, setConfirmationMessage] = useState('')

  function goToConfirmation(message: string) {
    setConfirmationMessage(message)
    setScreen('confirmation')
  }

  function selectAction(action: HubAction) {
    if (!driverName.trim()) {
      setNameError(true)
      return
    }
    setNameError(false)
    setScreen(action)
  }

  function backToHub() {
    setScreen('hub')
  }

  const mileage = useMileageLog(inventoryId, driverName, () => goToConfirmation('Kilométrage enregistré.'))
  const fuel = useFuelLog(inventoryId, driverName, () => goToConfirmation('Plein enregistré.'))
  const anomaly = useAnomalyReport(inventoryId, driverName, () => goToConfirmation('Avarie signalée.'))
  const maintenance = useMaintenanceLog(inventoryId, driverName, () => goToConfirmation('Maintenance enregistrée.'))
  const disinfection = useDisinfectionLog(inventoryId, driverName, () => goToConfirmation('Désinfection enregistrée.'))

  return {
    screen,
    driverName,
    setDriverName,
    nameError,
    selectAction,
    backToHub,
    confirmationMessage,
    mileage,
    fuel,
    anomaly,
    maintenance,
    disinfection,
  }
}
