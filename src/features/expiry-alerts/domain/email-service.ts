import { render } from '@react-email/render'
import { resend } from '@/shared/lib/resend'
import { fromAddress } from '@/shared/lib/email-slug'
import { ExpiryAlertEmail } from '@/emails/ExpiryAlertEmail'
import type { ExpiryAlertItem } from '@/features/controles/domain/types'

export async function sendExpiryAlertEmail({
  expired,
  atRisk,
  recipients,
  associationName,
}: {
  expired: ExpiryAlertItem[]
  atRisk: ExpiryAlertItem[]
  recipients: string[]
  associationName: string
}): Promise<void> {
  if (recipients.length === 0) return
  try {
    const html = await render(ExpiryAlertEmail({ expired, atRisk }))
    await resend.emails.send({
      from: fromAddress(associationName),
      to: recipients,
      subject: `⚠ Alertes péremption — ${associationName}`,
      html,
    })
  } catch (e) {
    console.error('[email] sendExpiryAlertEmail failed:', e)
  }
}
