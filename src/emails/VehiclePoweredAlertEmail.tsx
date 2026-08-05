import { Body, Container, Head, Heading, Hr, Html, Section, Text } from '@react-email/components'
import { formatRelativeDuration } from '@/shared/lib/format'

interface VehiclePoweredAlertEmailProps {
  vehicles: { name: string; since: Date }[]
  thresholdHours: number
}

export function VehiclePoweredAlertEmail({ vehicles, thresholdHours }: VehiclePoweredAlertEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc', margin: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
          <Heading style={{ color: '#0f172a', fontSize: '20px', marginBottom: '4px' }}>
            ⚠ Véhicule{vehicles.length > 1 ? 's' : ''} laissé{vehicles.length > 1 ? 's' : ''} alimenté{vehicles.length > 1 ? 's' : ''}
          </Heading>
          <Text style={{ color: '#64748b', marginTop: 0 }}>
            Alimenté{vehicles.length > 1 ? 's' : ''} en continu depuis plus de {thresholdHours}h, sans avoir bougé.
          </Text>

          <Section>
            <Hr style={{ borderColor: '#e2e8f0' }} />
            {vehicles.map((vehicle) => (
              <Text key={vehicle.name} style={{ marginBottom: '8px', color: '#1e293b' }}>
                <strong>{vehicle.name}</strong>{' '}
                <span style={{ color: '#94a3b8' }}>— alimenté depuis {formatRelativeDuration(vehicle.since)}</span>
              </Text>
            ))}
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
