import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import { expiryAlertsRepository } from '../data/repository'
import { getActiveExpiryAlertsUseCase } from '@/features/controles/domain/use-cases'
import { sendExpiryAlertEmail } from './email-service'
import type { CronReport } from './types'

export async function runExpiryAlertsCronUseCase(): Promise<Result<CronReport>> {
  try {
    const assocResult = await expiryAlertsRepository.getAllAssociationsConfig()
    if (!assocResult.ok) return assocResult

    let sent = 0
    const errors: string[] = []

    for (const assoc of assocResult.value) {
      try {
        if (assoc.notificationEmails.length === 0) continue

        const alertsResult = await getActiveExpiryAlertsUseCase(assoc.id, assoc.alertThresholdDays)
        if (!alertsResult.ok) { errors.push(`${assoc.name}: ${alertsResult.error}`); continue }

        const { expired, atRisk } = alertsResult.value
        const allItems = [...expired, ...atRisk]
        if (allItems.length === 0) continue

        const alertLog = await expiryAlertsRepository.getAlertLog(assoc.id)
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - assoc.alertIntervalDays)

        const itemsToAlert = allItems.filter((item) => {
          const entry = alertLog.get(item.itemId)
          return !entry || entry.lastSentAt <= cutoff
        })
        if (itemsToAlert.length === 0) continue

        const alertedIds = new Set(itemsToAlert.map((i) => i.itemId))
        const expiredToAlert = expired.filter((i) => alertedIds.has(i.itemId))
        const atRiskToAlert = atRisk.filter((i) => alertedIds.has(i.itemId))

        await sendExpiryAlertEmail({
          expired: expiredToAlert,
          atRisk: atRiskToAlert,
          recipients: assoc.notificationEmails,
          associationName: assoc.name,
        })
        await expiryAlertsRepository.upsertAlertLogEntries(
          itemsToAlert.map((i) => ({ itemId: i.itemId, inventoryId: i.inventoryId, associationId: assoc.id })),
        )
        sent++
      } catch (error) {
        errors.push(`${assoc.name}: ${(error as Error).message}`)
      }
    }

    return ok({ processed: assocResult.value.length, sent, errors })
  } catch (error) {
    return err(`Erreur fatale CRON alertes: ${(error as Error).message}`)
  }
}
