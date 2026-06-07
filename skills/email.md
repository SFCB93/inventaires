---
name: email
description: >
  Resend + react-email patterns for sending transactional emails in this project.
  Use whenever creating or modifying email templates, adding email sending to a use case,
  or setting up a new cron-triggered alert. Also reference when debugging email delivery,
  previewing templates in dev, or checking where email calls belong in the architecture.
---

# Skill — Email (Resend + react-email)

## Setup

```ts
// shared/lib/resend.ts
import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)
```

Variable d'env requise : `RESEND_API_KEY`
Domaine expéditeur à vérifier dans le dashboard Resend.

---

## Templates react-email

Les templates vivent dans `emails/`. Ce sont des composants React
qui génèrent du HTML email-compatible.

```tsx
// emails/ControlCompleted.tsx
import {
  Html, Head, Body, Container, Heading, Text, Section, Hr
} from '@react-email/components'

interface Props {
  inventoryName: string
  verifierName: string
  controlDate: string
  anomalyCount: number
  anomalies: { itemName: string; comment: string }[]
}

export function ControlCompletedEmail({
  inventoryName,
  verifierName,
  controlDate,
  anomalyCount,
  anomalies,
}: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f4f4f5' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
          <Heading>Contrôle terminé — {inventoryName}</Heading>

          <Text>
            <strong>{verifierName}</strong> a réalisé un contrôle
            de <strong>{inventoryName}</strong> le {controlDate}.
          </Text>

          {anomalyCount > 0 ? (
            <Section>
              <Hr />
              <Heading as="h2">
                ⚠ {anomalyCount} anomalie{anomalyCount > 1 ? 's' : ''} signalée{anomalyCount > 1 ? 's' : ''}
              </Heading>
              {anomalies.map((a, i) => (
                <Text key={i}>
                  <strong>{a.itemName}</strong> — {a.comment}
                </Text>
              ))}
            </Section>
          ) : (
            <Text>✓ Aucune anomalie signalée.</Text>
          )}
        </Container>
      </Body>
    </Html>
  )
}
```

---

## Service d'envoi

Encapsuler l'envoi dans un service dans `shared/lib/` ou dans
le domaine de la feature concernée.

```ts
// features/validator/domain/email-service.ts
import { resend } from '@/shared/lib/resend'
import { render } from '@react-email/render'
import { ControlCompletedEmail } from '@/emails/ControlCompleted'
import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'

interface SendControlCompletedParams {
  recipients: string[]
  inventoryName: string
  verifierName: string
  controlDate: string
  anomalies: { itemName: string; comment: string }[]
}

export async function sendControlCompletedEmail(
  params: SendControlCompletedParams
): Promise<Result<void>> {
  try {
    const html = await render(
      ControlCompletedEmail({
        inventoryName: params.inventoryName,
        verifierName: params.verifierName,
        controlDate: params.controlDate,
        anomalyCount: params.anomalies.length,
        anomalies: params.anomalies,
      })
    )

    await resend.emails.send({
      from: 'Secourisme <noreply@votredomaine.fr>',
      to: params.recipients,
      subject: `Contrôle terminé — ${params.inventoryName}`,
      html,
    })

    return ok(undefined)
  } catch (error) {
    return err(`Échec de l'envoi de l'alerte mail : ${(error as Error).message}`)
  }
}
```

---

## Où appeler les services mail

**Dans les use cases, via le service d'email. Jamais dans les actions, jamais côté client.**

L'email est un side effect de l'opération principale — il appartient donc au use case.
L'appel est non-bloquant : une erreur d'envoi ne doit pas faire échouer la soumission.

```ts
// features/validator/domain/use-cases.ts
export async function submitControlUseCase(
  submission: ControlSubmission,
  emailContext: ControlEmailContext,
): Promise<Result<{ controlId: string }>> {
  // ... validation, récupération contexte ...

  const result = await validatorRepository.saveControl(submission, associationId)
  if (!result.ok) return result

  // Mail non-bloquant : une erreur ne fait pas échouer la soumission
  sendControlCompletedEmail({ /* ... */ }).catch((e) =>
    console.error('[submitControlUseCase] email failure', e)
  )

  return result
}

// features/validator/domain/actions.ts — coquille, aucune logique
'use server'
export async function submitControlAction(
  submission: ControlSubmission,
  emailContext: ControlEmailContext,
): Promise<Result<{ controlId: string }>> {
  return submitControlUseCase(submission, emailContext)
}
```

---

## Preview en développement

react-email fournit un serveur de preview :

```bash
npx email dev --dir emails --port 3001
```

Permet de visualiser les templates dans le navigateur sans envoyer de vrai mail.

---

## Alertes péremption

Même pattern. Créer un template `ExpiryAlertEmail.tsx` et un service dédié.
L'envoi se fait via un cron job (Vercel Cron ou GitHub Actions) qui appelle
une API route protégée :

```ts
// app/api/cron/peremptions/route.ts
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // vérifier les péremptions, envoyer les alertes
  // ...
}
```

---

## Ce qu'il ne faut pas faire

- ❌ Appeler `resend.emails.send` côté client
- ❌ Mettre la clé API Resend dans une variable `NEXT_PUBLIC_*`
- ❌ Appeler `resend.emails.send` directement depuis un use case — passer par le service d'email
- ❌ Déclencher l'envoi depuis une action — l'email appartient au use case
- ❌ Oublier le `try/catch` — Resend peut échouer, ne pas bloquer le flux principal
