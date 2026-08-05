import { saveDeviceKey, revokeDeviceKey, findDeviceByKeyHash, hasDevice, listLinkedInventoryIds } from './device-repository'
import {
  getVehicleStatus,
  touchLastSeen,
  recordVehiclePoint,
  listFleetStatus,
  listInventoryNames,
  listPositionHistory,
  deleteVehicleData,
} from './vehicle-status-repository'
import { listPoweredTooLong, markPoweredAlertSent, listAssociationNotificationConfigs } from './powered-alert-repository'

export const vehicleTrackingRepository = {
  saveDeviceKey,
  revokeDeviceKey,
  findDeviceByKeyHash,
  hasDevice,
  listLinkedInventoryIds,
  getVehicleStatus,
  touchLastSeen,
  recordVehiclePoint,
  listFleetStatus,
  listInventoryNames,
  listPositionHistory,
  deleteVehicleData,
  listPoweredTooLong,
  markPoweredAlertSent,
  listAssociationNotificationConfigs,
}
