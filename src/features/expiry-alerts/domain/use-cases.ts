import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import { expiryAlertsRepository } from '../data/repository'
import { getActiveAlerts } from '@/shared/data/alerts-repository'
import { sendExpiryAlertEmail } from './email-service'
import type { CronReport } from './types'

export async function runExpiryAlertsCronUseCase(): Promise<Result<CronReport>> {
  try {
    const assocResult = await expiryAlertsRepository.getAllAssociationsConfig()
    if (!assocResult.ok) return assocResult

    const outcomes = await Promise.all(
      assocResult.value.map(async (assoc) => {
        try {
          if (assoc.notificationEmails.length === 0) return { sent: false, error: null }

          const alertsResult = await getActiveAlerts(assoc.id, assoc.alertThresholdDays, false)
          if (!alertsResult.ok) return { sent: false, error: `${assoc.name}: ${alertsResult.error}` }

          const { expired, atRisk } = alertsResult.value
          const allItems = [...expired, ...atRisk]
          if (allItems.length === 0) return { sent: false, error: null }

          const alertLog = await expiryAlertsRepository.getAlertLog(assoc.id)
          const cutoff = new Date()
          cutoff.setDate(cutoff.getDate() - assoc.alertIntervalDays)

          const itemsToAlert = allItems.filter((item) => {
            const entry = alertLog.get(item.itemId)
            return !entry || entry.lastSentAt <= cutoff
          })
          if (itemsToAlert.length === 0) return { sent: false, error: null }

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
          return { sent: true, error: null }
        } catch (error) {
          return { sent: false, error: `${assoc.name}: ${(error as Error).message}` }
        }
      }),
    )

    const sent = outcomes.filter((outcome) => outcome.sent).length
    const errors = outcomes.map((outcome) => outcome.error).filter((error): error is string => error !== null)

    return ok({ processed: assocResult.value.length, sent, errors })
  } catch (error) {
    return err(`Erreur fatale CRON alertes: ${(error as Error).message}`)
  }
}
