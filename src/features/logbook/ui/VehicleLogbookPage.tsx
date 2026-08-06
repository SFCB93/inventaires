// Dépasse 120 lignes : aiguille entre le menu, les 5 formulaires du carnet de bord et le contrôle d'inventaire existant.
'use client'

import type { CompartmentWithItems, Inventory } from '@/features/validator/domain/types'
import { ValidatorOrchestrator } from '@/features/validator/ui/ValidatorOrchestrator'
import { useVehicleLogbook } from './hooks/useVehicleLogbook'
import { VehicleHubMenu } from './VehicleHubMenu'
import { MileageLogForm } from './MileageLogForm'
import { FuelLogForm } from './FuelLogForm'
import { AnomalyReportForm } from './AnomalyReportForm'
import { MaintenanceLogForm } from './MaintenanceLogForm'
import { DisinfectionLogForm } from './DisinfectionLogForm'
import { LogbookActionConfirmation } from './LogbookActionConfirmation'

interface VehicleLogbookPageProps {
  inventory: Inventory
  compartments: CompartmentWithItems[]
  lastExpiryDates: Record<string, string>
}

export function VehicleLogbookPage({ inventory, compartments, lastExpiryDates }: VehicleLogbookPageProps) {
  const {
    screen, driverName, setDriverName, nameError, selectAction, backToHub, confirmationMessage,
    mileage, fuel, anomaly, maintenance, disinfection,
  } = useVehicleLogbook(inventory.id)

  if (screen === 'inventory') {
    return <ValidatorOrchestrator inventory={inventory} compartments={compartments} lastExpiryDates={lastExpiryDates} />
  }

  if (screen === 'confirmation') {
    return <LogbookActionConfirmation message={confirmationMessage} onBackToMenu={backToHub} />
  }

  if (screen === 'mileage') {
    return (
      <MileageLogForm
        history={mileage.history}
        isLoadingHistory={mileage.isLoadingHistory}
        historyError={mileage.historyError}
        km={mileage.km}
        onKmChange={mileage.setKm}
        mission={mileage.mission}
        onMissionChange={mileage.setMission}
        isSubmitting={mileage.isSubmitting}
        error={mileage.error}
        onSubmit={mileage.handleSubmit}
        onBack={backToHub}
      />
    )
  }

  if (screen === 'fuel') {
    return (
      <FuelLogForm
        liters={fuel.liters}
        onLitersChange={fuel.setLiters}
        amount={fuel.amount}
        onAmountChange={fuel.setAmount}
        isSubmitting={fuel.isSubmitting}
        error={fuel.error}
        onSubmit={fuel.handleSubmit}
        onBack={backToHub}
      />
    )
  }

  if (screen === 'anomaly') {
    return (
      <AnomalyReportForm
        description={anomaly.description}
        onDescriptionChange={anomaly.setDescription}
        isSubmitting={anomaly.isSubmitting}
        error={anomaly.error}
        onSubmit={anomaly.handleSubmit}
        onBack={backToHub}
      />
    )
  }

  if (screen === 'maintenance') {
    return (
      <MaintenanceLogForm
        description={maintenance.description}
        onDescriptionChange={maintenance.setDescription}
        isSubmitting={maintenance.isSubmitting}
        error={maintenance.error}
        onSubmit={maintenance.handleSubmit}
        onBack={backToHub}
      />
    )
  }

  if (screen === 'disinfection') {
    return (
      <DisinfectionLogForm
        isSubmitting={disinfection.isSubmitting}
        error={disinfection.error}
        onSubmit={disinfection.handleSubmit}
        onBack={backToHub}
      />
    )
  }

  return (
    <VehicleHubMenu
      inventoryName={inventory.name}
      driverName={driverName}
      onDriverNameChange={setDriverName}
      nameError={nameError}
      onSelectAction={selectAction}
    />
  )
}
