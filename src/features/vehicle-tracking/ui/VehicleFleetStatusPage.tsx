'use client'

import type { VehicleStatus } from '../domain/types'
import { useVehicleFleetStatusPage } from './hooks/useVehicleFleetStatusPage'
import { VehicleFleetStatus } from './VehicleFleetStatus'
import { AddVehicleDeviceForm } from './AddVehicleDeviceForm'

interface VehicleFleetStatusPageProps {
  vehicles: VehicleStatus[]
}

export function VehicleFleetStatusPage({ vehicles }: VehicleFleetStatusPageProps) {
  const { isAddOpen, candidates, isSubmitting, newApiKey, error, loadError, openAdd, closeAdd, handleAdd, goToVehicle } =
    useVehicleFleetStatusPage()

  return (
    <>
      <VehicleFleetStatus vehicles={vehicles} onSelectVehicle={goToVehicle} onAddClick={openAdd} />
      <AddVehicleDeviceForm
        isOpen={isAddOpen}
        candidates={candidates}
        isSubmitting={isSubmitting}
        newApiKey={newApiKey}
        error={error}
        loadError={loadError}
        onSubmit={handleAdd}
        onClose={closeAdd}
      />
    </>
  )
}
