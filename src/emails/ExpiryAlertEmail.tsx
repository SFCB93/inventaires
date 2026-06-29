import { Body, Container, Head, Heading, Hr, Html, Section, Text } from '@react-email/components'
import type { ExpiryAlertItem } from '@/shared/domain/alerts'
import { formatDate } from '@/shared/lib/format'

interface ExpiryAlertEmailProps {
  expired: ExpiryAlertItem[]
  atRisk: ExpiryAlertItem[]
}

function ItemRow({ item }: { item: ExpiryAlertItem }) {
  return (
    <Text style={{ marginBottom: '8px', color: '#1e293b' }}>
      <strong>{item.itemName}</strong>{' '}
      <span style={{ color: '#94a3b8' }}>({item.inventoryName} · {item.compartmentName})</span>
      {' '}— {formatDate(item.latestExpiryDate)}
    </Text>
  )
}

export function ExpiryAlertEmail({ expired, atRisk }: ExpiryAlertEmailProps) {
  const total = expired.length + atRisk.length
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc', margin: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
          <Heading style={{ color: '#0f172a', fontSize: '20px', marginBottom: '4px' }}>
            Alertes péremption
          </Heading>
          <Text style={{ color: '#64748b', marginTop: 0 }}>
            {total} matériel{total > 1 ? 's' : ''} nécessite{total > 1 ? 'nt' : ''} une attention immédiate.
          </Text>

          {expired.length > 0 && (
            <Section>
              <Hr style={{ borderColor: '#e2e8f0' }} />
              <Heading as="h2" style={{ color: '#dc2626', fontSize: '16px' }}>
                ⛔ Périmés ({expired.length})
              </Heading>
              {expired.map((item) => <ItemRow key={`${item.itemId}|${item.inventoryId}`} item={item} />)}
            </Section>
          )}

          {atRisk.length > 0 && (
            <Section>
              <Hr style={{ borderColor: '#e2e8f0' }} />
              <Heading as="h2" style={{ color: '#d97706', fontSize: '16px' }}>
                ⚠ Bientôt périmés ({atRisk.length})
              </Heading>
              {atRisk.map((item) => <ItemRow key={`${item.itemId}|${item.inventoryId}`} item={item} />)}
            </Section>
          )}

          <Hr style={{ borderColor: '#e2e8f0', marginTop: '24px' }} />
          <Text style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>
            Ces matériels ne figureront plus dans les alertes une fois remplacés et un nouveau contrôle soumis.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
