import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import { vehicleTrackingRepository } from '../data/repository'
import { sendVehiclePoweredAlertEmail } from './email-service'
import { POWERED_ALERT_THRESHOLD_HOURS, MS_PER_HOUR } from './constants'

export interface PoweredAlertCronReport {
  processed: number
  sent: number
  errors: string[]
}

export async function runVehiclePoweredAlertsCronUseCase(): Promise<Result<PoweredAlertCronReport>> {
  try {
    const before = new Date(Date.now() - POWERED_ALERT_THRESHOLD_HOURS * MS_PER_HOUR)
    const overdueResult = await vehicleTrackingRepository.listPoweredTooLong(before)
    if (!overdueResult.ok) return overdueResult
    if (overdueResult.value.length === 0) return ok({ processed: 0, sent: 0, errors: [] })

    const namesResult = await vehicleTrackingRepository.listInventoryNames(
      overdueResult.value.map((vehicle) => vehicle.inventoryId),
    )
    if (!namesResult.ok) return namesResult

    const associationIds = Array.from(new Set(overdueResult.value.map((vehicle) => vehicle.associationId)))
    const configsResult = await vehicleTrackingRepository.listAssociationNotificationConfigs(associationIds)
    if (!configsResult.ok) return configsResult

    const byAssociation = new Map<string, typeof overdueResult.value>()
    for (const vehicle of overdueResult.value) {
      const list = byAssociation.get(vehicle.associationId) ?? []
      list.push(vehicle)
      byAssociation.set(vehicle.associationId, list)
    }

    let sent = 0
    const errors: string[] = []

    for (const [associationId, vehicles] of byAssociation) {
      try {
        const config = configsResult.value.get(associationId)
        if (!config || config.notificationEmails.length === 0) continue

        await sendVehiclePoweredAlertEmail({
          recipients: config.notificationEmails,
          associationName: config.name,
          vehicles: vehicles.map((vehicle) => ({
            name: namesResult.value.get(vehicle.inventoryId) ?? 'Véhicule',
            since: vehicle.stableSince,
          })),
        })

        for (const vehicle of vehicles) {
          await vehicleTrackingRepository.markPoweredAlertSent(vehicle.inventoryId)
        }
        sent++
      } catch (error) {
        errors.push(`${associationId}: ${(error as Error).message}`)
      }
    }

    return ok({ processed: overdueResult.value.length, sent, errors })
  } catch (error) {
    return err(`Erreur fatale CRON alertes véhicules: ${(error as Error).message}`)
  }
}
