import { Body, Container, Head, Heading, Hr, Html, Section, Text } from '@react-email/components'
import type { DisinfectionProtocol, LogbookEntryType } from '@/features/logbook/domain/types'

interface LogbookNotificationEmailProps {
  vehicleName: string
  submittedBy: string
  kind: Extract<LogbookEntryType, 'anomaly' | 'fuel' | 'disinfection'>
  description?: string
  fuelLiters?: number
  amountEuros?: number
  documentUrl?: string | null
  disinfectionProtocol?: DisinfectionProtocol
}

const TITLES: Record<LogbookNotificationEmailProps['kind'], string> = {
  anomaly: '⚠ Avarie signalée',
  fuel: '⛽ Plein effectué',
  disinfection: '🧴 Désinfection effectuée',
}

export function LogbookNotificationEmail({
  vehicleName,
  submittedBy,
  kind,
  description,
  fuelLiters,
  amountEuros,
  documentUrl,
  disinfectionProtocol,
}: LogbookNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc', margin: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
          <Heading style={{ color: '#0f172a', fontSize: '20px', marginBottom: '4px' }}>
            {TITLES[kind]} — {vehicleName}
          </Heading>
          <Text style={{ color: '#64748b', marginTop: 0 }}>Déclaré par {submittedBy}.</Text>

          <Section>
            <Hr style={{ borderColor: '#e2e8f0' }} />
            {kind === 'anomaly' && <Text style={{ color: '#1e293b' }}>{description}</Text>}
            {kind === 'fuel' && (
              <Text style={{ color: '#1e293b' }}>
                Quantité : {fuelLiters} L
                {amountEuros !== undefined ? ` · ${amountEuros} €` : ''}
                {documentUrl ? ' · justificatif joint' : ''}
              </Text>
            )}
            {kind === 'disinfection' && (
              <Text style={{ color: '#1e293b' }}>
                Protocole réalisé : {disinfectionProtocol === 'approfondie' ? 'approfondie' : 'périodique'}
              </Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
