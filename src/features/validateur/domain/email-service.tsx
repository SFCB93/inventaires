import { render } from "@react-email/render";
import { resend } from "@/shared/lib/resend";
import { ControlCompletedEmail } from "@/emails/ControlCompletedEmail";
import type { Result } from "@/shared/domain/result";
import { ok, err } from "@/shared/domain/result";
import type { ControlEmailContext } from "./types";

export async function sendControlCompletedEmail(
  context: ControlEmailContext,
  verifierName: string,
  itemCount: number,
  recipients: string[],
  associationName: string,
  controlDate: string,
): Promise<Result<void>> {
  if (recipients.length === 0) return ok(undefined);

  try {
    const html = await render(
      ControlCompletedEmail({
        inventoryName: context.inventoryName,
        verifierName,
        controlDate,
        itemCount,
        anomalies: context.anomalies,
        expiryDates: context.expiryDates,
      }),
    );

    await resend.emails.send({
      from: `Inventaire ${associationName} <onboarding@resend.dev>`,
      to: recipients,
      subject: `Contrôle terminé — ${context.inventoryName}`,
      html,
    });

    return ok(undefined);
  } catch (e) {
    console.error('[email] sendControlCompletedEmail failed:', e)
    return err("Échec de l'envoi du mail de synthèse");
  }
}
