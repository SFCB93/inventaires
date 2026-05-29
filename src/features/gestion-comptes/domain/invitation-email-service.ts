// On utilise Resend pour contrôler le contenu et le sujet des emails auth.
import { render } from '@react-email/render'
import { resend } from '@/shared/lib/resend'
import { fromAddress } from '@/shared/lib/email-slug'
import { WelcomeAdminEmail } from '@/emails/WelcomeAdminEmail'
import { PasswordResetEmail } from '@/emails/PasswordResetEmail'

export async function sendInvitationEmail(adminEmail: string, associationName: string, resetLink: string, loginUrl?: string) {
  try {
    const html = await render(WelcomeAdminEmail({ associationName, resetLink, loginUrl }))
    await resend.emails.send({
      from: fromAddress(associationName),
      to: adminEmail,
      subject: `Invitation — ${associationName}`,
      html,
    })
  } catch (e) {
    console.error('[sendInvitationEmail] Envoi échoué:', e)
  }
}

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
