import { render } from '@react-email/render'
import { resend } from '@/shared/lib/resend'
import { fromAddress } from '@/shared/lib/email-slug'
import { LogbookNotificationEmail } from '@/emails/LogbookNotificationEmail'
import { vehicleTrackingRepository } from '@/features/vehicle-tracking/data/repository'
import type { DisinfectionProtocol, LogbookEntryType } from './types'

interface SendLogbookNotificationParams {
  inventoryId: string
  associationId: string
  submittedBy: string
  kind: Extract<LogbookEntryType, 'anomaly' | 'fuel' | 'disinfection'>
  description?: string
  fuelLiters?: number
  amountEuros?: number
  documentUrl?: string | null
  disinfectionProtocol?: DisinfectionProtocol
}

export async function sendLogbookNotificationEmail(params: SendLogbookNotificationParams): Promise<void> {
  try {
    const [namesResult, configsResult] = await Promise.all([
      vehicleTrackingRepository.listInventoryNames([params.inventoryId]),
      vehicleTrackingRepository.listAssociationNotificationConfigs([params.associationId]),
    ])
    if (!namesResult.ok || !configsResult.ok) return

    const config = configsResult.value.get(params.associationId)
    if (!config || config.notificationEmails.length === 0) return

    const vehicleName = namesResult.value.get(params.inventoryId) ?? 'Véhicule'
    const html = await render(
      LogbookNotificationEmail({
        vehicleName,
        submittedBy: params.submittedBy,
        kind: params.kind,
        description: params.description,
        fuelLiters: params.fuelLiters,
        amountEuros: params.amountEuros,
        documentUrl: params.documentUrl,
        disinfectionProtocol: params.disinfectionProtocol,
      }),
    )

    await resend.emails.send({
      from: fromAddress(config.name),
      to: config.notificationEmails,
      subject: `Carnet de bord — ${vehicleName}`,
      html,
    })
  } catch (e) {
    console.error('[email] sendLogbookNotificationEmail failed:', e)
  }
}
