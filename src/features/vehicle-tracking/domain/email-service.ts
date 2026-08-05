import { render } from '@react-email/render'
import { resend } from '@/shared/lib/resend'
import { fromAddress } from '@/shared/lib/email-slug'
import { VehiclePoweredAlertEmail } from '@/emails/VehiclePoweredAlertEmail'
import { POWERED_ALERT_THRESHOLD_HOURS } from './constants'

export async function sendVehiclePoweredAlertEmail({
  recipients,
  associationName,
  vehicles,
}: {
  recipients: string[]
  associationName: string
  vehicles: { name: string; since: Date }[]
}): Promise<void> {
  if (recipients.length === 0) return
  try {
    const html = await render(
      VehiclePoweredAlertEmail({ vehicles, thresholdHours: POWERED_ALERT_THRESHOLD_HOURS }),
    )
    await resend.emails.send({
      from: fromAddress(associationName),
      to: recipients,
      subject: `⚠ Véhicule(s) laissé(s) alimenté(s) — ${associationName}`,
      html,
    })
  } catch (e) {
    console.error('[email] sendVehiclePoweredAlertEmail failed:', e)
  }
}
