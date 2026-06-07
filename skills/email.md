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
    const html = render(
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

**Uniquement dans les Server Actions ou les API routes.**
Jamais côté client.

```ts
// features/validator/domain/actions.ts
'use server'

import { ok } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import { submitControlUseCase } from './use-cases'
import { sendControlCompletedEmail } from './email-service'
import { validatorRepository } from '../data/repository'

export async function submitControlAction(/* ... */): Promise<Result<{ controlId: string }>> {
  const result = await submitControlUseCase(/* ... */)
  if (!result.ok) return result

  // Mail non-bloquant : une erreur d'envoi ne fait pas échouer la soumission
  const { emails } = await validatorRepository.getAssociationEmails(result.value.associationId)
  if (emails.length > 0) {
    await sendControlCompletedEmail({
      recipients: emails,
      inventoryName: result.value.inventoryName,
      verifierName: result.value.verifierName,
      controlDate: new Date().toLocaleDateString('fr-FR'),
      anomalies: result.value.anomalies,
    })
  }

  return ok({ controlId: result.value.controlId })
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

Même pattern. Créer un template `PeremptionImminente.tsx` et un service dédié.
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
- ❌ Envoyer les mails directement dans les use cases (passer par le service)
- ❌ Oublier le `try/catch` — Resend peut échouer, ne pas bloquer le flux principal
