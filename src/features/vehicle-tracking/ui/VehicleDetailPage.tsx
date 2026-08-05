'use client'

import { useVehicleDetailPage } from './hooks/useVehicleDetailPage'
import { VehicleDeviceLinkForm } from './VehicleDeviceLinkForm'
import { TimeRangeSelector } from './TimeRangeSelector'
import { VehiclePositionHistoryMap } from './VehiclePositionHistoryMap'

interface VehicleDetailPageProps {
  inventoryId: string
  inventoryName: string
  isLinked: boolean
}

export function VehicleDetailPage({ inventoryId, inventoryName, isLinked }: VehicleDetailPageProps) {
  const {
    isLinked: currentIsLinked,
    newApiKey,
    isSubmittingDevice,
    deviceError,
    handleGenerate,
    handleRevoke,
    handleRevokeAndDelete,
    timeRange,
    setTimeRange,
    positions,
    historyError,
    isLoadingHistory,
  } = useVehicleDetailPage(inventoryId, isLinked)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{inventoryName}</h1>

      <VehicleDeviceLinkForm
        inventoryName={inventoryName}
        isLinked={currentIsLinked}
        newApiKey={newApiKey}
        isSubmitting={isSubmittingDevice}
        onGenerate={handleGenerate}
        onRevoke={handleRevoke}
        onRevokeAndDelete={handleRevokeAndDelete}
      />
      {deviceError && (
        <p role="alert" className="text-sm text-red-600">
          {deviceError}
        </p>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">Historique des positions</h2>
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </div>
        {historyError && (
          <p role="alert" className="text-sm text-red-600 mb-3">
            {historyError}
          </p>
        )}
        <VehiclePositionHistoryMap positions={positions} isLoading={isLoadingHistory} />
      </div>
    </div>
  )
}
