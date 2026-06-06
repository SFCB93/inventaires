import { render } from '@react-email/render'
import { resend } from '@/shared/lib/resend'
import { fromAddress } from '@/shared/lib/email-slug'
import { PasswordResetEmail } from '@/emails/PasswordResetEmail'

export async function sendPasswordResetEmail(adminEmail: string, associationName: string, resetLink: string) {
  try {
    const html = await render(PasswordResetEmail({ resetLink }))
    await resend.emails.send({
      from: fromAddress(associationName),
      to: adminEmail,
      subject: 'Réinitialisation de votre mot de passe',
      html,
    })
  } catch (e) {
    console.error('[sendPasswordResetEmail] Envoi échoué:', e)
  }
}
