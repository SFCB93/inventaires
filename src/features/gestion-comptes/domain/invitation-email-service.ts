// On utilise Resend pour contrôler le contenu et le sujet des emails auth.
import { resend } from '@/shared/lib/resend'
import { fromAddress } from '@/shared/lib/email-slug'

export async function sendInvitationEmail(adminEmail: string, associationName: string, resetLink: string) {
  try {
    await resend.emails.send({
      from: fromAddress(associationName),
      to: adminEmail,
      subject: `Invitation — ${associationName}`,
      text: `Bonjour,\n\nVous avez été invité à gérer l'association "${associationName}".\n\nDéfinissez votre mot de passe :\n${resetLink}\n\nCe lien expire dans 24 heures.`,
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
