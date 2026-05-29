// On utilise Resend pour contrôler le contenu et le sujet des emails auth.
import { headers } from 'next/headers'
import { render } from '@react-email/render'
import { resend } from '@/shared/lib/resend'
import { fromAddress } from '@/shared/lib/email-slug'
import { WelcomeAdminEmail } from '@/emails/WelcomeAdminEmail'

async function getLoginUrl(): Promise<string | undefined> {
  try {
    const h = await headers()
    const host = h.get('host')
    if (!host) return undefined
    const proto = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    return `${proto}://${host}/login`
  } catch {
    return undefined
  }
}

export async function sendInvitationEmail(adminEmail: string, associationName: string, resetLink: string) {
  try {
    const loginUrl = await getLoginUrl()
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
    await resend.emails.send({
      from: fromAddress(associationName),
      to: adminEmail,
      subject: 'Réinitialisation de votre mot de passe',
      text: `Bonjour,\n\nVous avez demandé à réinitialiser votre mot de passe.\n\nCliquez sur ce lien :\n${resetLink}\n\nCe lien expire dans 24 heures.`,
    })
  } catch (e) {
    console.error('[sendPasswordResetEmail] Envoi échoué:', e)
  }
}
