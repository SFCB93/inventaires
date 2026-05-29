import { Body, Button, Container, Head, Heading, Hr, Html, Section, Text } from '@react-email/components'

interface WelcomeAdminEmailProps {
  associationName: string
  resetLink: string
  loginUrl?: string
}

export function WelcomeAdminEmail({ associationName, resetLink, loginUrl }: WelcomeAdminEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc', margin: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
          <Heading style={{ color: '#0f172a', fontSize: '20px', marginBottom: '4px' }}>
            Bienvenue sur Inventaires
          </Heading>
          <Text style={{ color: '#475569', marginTop: 0 }}>
            Vous avez été invité à gérer les inventaires de <strong>{associationName}</strong>.
          </Text>

          <Text style={{ color: '#1e293b' }}>
            Pour activer votre compte, définissez votre mot de passe en cliquant sur le bouton ci-dessous.
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
              Définir mon mot de passe
            </Button>
          </Section>

          <Text style={{ color: '#64748b', fontSize: '13px' }}>
            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :{' '}
            <a href={resetLink} style={{ color: '#2563eb', wordBreak: 'break-all' }}>{resetLink}</a>
          </Text>

          {loginUrl && (
            <Text style={{ color: '#475569', fontSize: '14px', textAlign: 'center' as const }}>
              Une fois votre mot de passe défini,{' '}
              <a href={loginUrl} style={{ color: '#2563eb' }}>connectez-vous ici</a>.
            </Text>
          )}

          <Hr style={{ borderColor: '#e2e8f0', marginTop: '24px' }} />
          <Text style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>
            Vous recevez cet email car un administrateur vous a invité sur la plateforme Inventaires.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
