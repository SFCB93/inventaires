import { Body, Button, Container, Head, Heading, Hr, Html, Section, Text } from '@react-email/components'

interface PasswordResetEmailProps {
  resetLink: string
}

export function PasswordResetEmail({ resetLink }: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc', margin: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
          <Heading style={{ color: '#0f172a', fontSize: '20px', marginBottom: '4px' }}>
            Réinitialisation de votre mot de passe
          </Heading>
          <Text style={{ color: '#475569', marginTop: 0 }}>
            Vous avez demandé à réinitialiser votre mot de passe.
            Ce lien est valable <strong>24 heures</strong>.
          </Text>

          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button
              href={resetLink}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                padding: '12px 28px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '15px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Réinitialiser mon mot de passe
            </Button>
          </Section>

          <Text style={{ color: '#64748b', fontSize: '13px' }}>
            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :{' '}
            <a href={resetLink} style={{ color: '#2563eb', wordBreak: 'break-all' }}>{resetLink}</a>
          </Text>

          <Hr style={{ borderColor: '#e2e8f0', marginTop: '24px' }} />
          <Text style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>
            Si vous n&apos;avez pas demandé cette réinitialisation, ignorez cet email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
