import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Section,
  Text,
} from '@react-email/components'
import { formatDate } from '@/shared/lib/format'

function expiryStatus(iso: string, alertThresholdDays: number): 'expired' | 'at-risk' | 'ok' {
  const date = new Date(iso)
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const risk = new Date(now); risk.setDate(risk.getDate() + alertThresholdDays)
  if (date <= now) return 'expired'
  if (date <= risk) return 'at-risk'
  return 'ok'
}

const STATUS_LABEL = {
  expired: { text: '⛔ Périmé', color: '#dc2626' },
  'at-risk': { text: '⚠ Bientôt périmé', color: '#d97706' },
  ok: { text: '', color: '' },
}

interface ControlCompletedEmailProps {
  inventoryName: string
  verifierName: string
  controlDate: string
  itemCount: number
  anomalies: { itemName: string; compartmentName: string; comment: string }[]
  expiryDates: { itemName: string; compartmentName: string; date: string }[]
  alertThresholdDays: number
}

export function ControlCompletedEmail({
  inventoryName,
  verifierName,
  controlDate,
  itemCount,
  anomalies,
  expiryDates,
  alertThresholdDays,
}: ControlCompletedEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc', margin: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
          <Heading style={{ color: '#0f172a', fontSize: '20px', marginBottom: '4px' }}>
            Contrôle terminé — {inventoryName}
          </Heading>
          <Text style={{ color: '#64748b', marginTop: 0 }}>
            <strong>{verifierName}</strong> a réalisé le contrôle
            de <strong>{inventoryName}</strong> le {controlDate}.
            <br />
            {itemCount} matériel{itemCount > 1 ? 's' : ''} vérifiés ·{' '}
            {anomalies.length > 0
              ? `${anomalies.length} anomalie${anomalies.length > 1 ? 's' : ''}`
              : 'Aucune anomalie'}
          </Text>

          {anomalies.length > 0 && (
            <Section>
              <Hr style={{ borderColor: '#e2e8f0' }} />
              <Heading as="h2" style={{ color: '#b45309', fontSize: '16px' }}>
                ⚠ Anomalies signalées
              </Heading>
              {anomalies.map((a, i) => (
                <Text key={i} style={{ marginBottom: '8px', color: '#1e293b' }}>
                  <strong>{a.itemName}</strong>{' '}
                  <span style={{ color: '#94a3b8' }}>({a.compartmentName})</span>
                  <br />
                  {a.comment}
                </Text>
              ))}
            </Section>
          )}

          {expiryDates.length > 0 && (
            <Section>
              <Hr style={{ borderColor: '#e2e8f0' }} />
              <Heading as="h2" style={{ color: '#0f172a', fontSize: '16px' }}>
                Dates de péremption saisies
              </Heading>
              {expiryDates.map((e, i) => {
                const status = expiryStatus(e.date, alertThresholdDays)
                const label = STATUS_LABEL[status]
                return (
                  <Text key={i} style={{ marginBottom: '8px', color: '#1e293b' }}>
                    <strong>{e.itemName}</strong>{' '}
                    <span style={{ color: '#94a3b8' }}>({e.compartmentName})</span>
                    {' '}— {formatDate(e.date)}
                    {label.text && (
                      <span style={{ color: label.color, fontWeight: 'bold' }}> · {label.text}</span>
                    )}
                  </Text>
                )
              })}
            </Section>
          )}
        </Container>
      </Body>
    </Html>
  )
}
