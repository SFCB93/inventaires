import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ControlsAccordion } from './ControlsAccordion'
import type { PublicControlSummary } from '../domain/types'

const makeControl = (overrides: Partial<PublicControlSummary> = {}): PublicControlSummary => ({
  id: 'ctrl-1',
  verifierName: 'Jean Dupont',
  submittedAt: '2026-06-15T10:30:00.000Z',
  anomalyCount: 0,
  anomalies: [],
  expiryDates: [],
  ...overrides,
})

describe('ControlsAccordion — affichage initial', () => {
  it('affiche tous les contrôles', () => {
    render(
      <ControlsAccordion
        controls={[
          makeControl({ id: 'ctrl-1', verifierName: 'Jean Dupont' }),
          makeControl({ id: 'ctrl-2', verifierName: 'Marie Martin' }),
        ]}
      />,
    )
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
    expect(screen.getByText('Marie Martin')).toBeInTheDocument()
  })

  it('tous les contrôles sont fermés par défaut', () => {
    render(
      <ControlsAccordion
        controls={[makeControl({ id: 'ctrl-1' }), makeControl({ id: 'ctrl-2' })]}
      />,
    )
    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => expect(btn).toHaveAttribute('aria-expanded', 'false'))
  })

  it('affiche la liste vide sans erreur', () => {
    render(<ControlsAccordion controls={[]} />)
    expect(screen.getByTestId('controls-list')).toBeInTheDocument()
  })
})

describe('ControlsAccordion — ouverture / fermeture', () => {
  it("ouvre un contrôle au clic et affiche son contenu", async () => {
    const user = userEvent.setup()
    render(
      <ControlsAccordion
        controls={[makeControl({ anomalies: [], expiryDates: [] })]}
      />,
    )
    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('✓ Aucune anomalie — contrôle conforme')).toBeInTheDocument()
  })

  it("ferme le contrôle au second clic", async () => {
    const user = userEvent.setup()
    render(<ControlsAccordion controls={[makeControl()]} />)
    const btn = screen.getByRole('button')
    await user.click(btn)
    await user.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('✓ Aucune anomalie — contrôle conforme')).not.toBeInTheDocument()
  })

  it("un seul contrôle ouvert à la fois", async () => {
    const user = userEvent.setup()
    render(
      <ControlsAccordion
        controls={[
          makeControl({ id: 'ctrl-1', verifierName: 'Jean Dupont' }),
          makeControl({ id: 'ctrl-2', verifierName: 'Marie Martin' }),
        ]}
      />,
    )
    const [btn1, btn2] = screen.getAllByRole('button')
    await user.click(btn1)
    expect(btn1).toHaveAttribute('aria-expanded', 'true')
    await user.click(btn2)
    expect(btn1).toHaveAttribute('aria-expanded', 'false')
    expect(btn2).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('ControlsAccordion — contenu détaillé', () => {
  it("affiche les anomalies avec compartiment, matériel et commentaire", async () => {
    const user = userEvent.setup()
    render(
      <ControlsAccordion
        controls={[
          makeControl({
            anomalyCount: 1,
            anomalies: [
              { itemName: 'Défibrillateur', compartmentName: 'Poche avant', comment: 'Absent' },
            ],
          }),
        ]}
      />,
    )
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Poche avant / Défibrillateur')).toBeInTheDocument()
    expect(screen.getByText(/Absent/)).toBeInTheDocument()
  })

  it("affiche les dates de péremption avec compartiment et matériel", async () => {
    const user = userEvent.setup()
    render(
      <ControlsAccordion
        controls={[
          makeControl({
            expiryDates: [
              { itemName: 'Gants', compartmentName: 'Tiroir 1', date: '2026-12-01' },
            ],
          }),
        ]}
      />,
    )
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Tiroir 1 / Gants')).toBeInTheDocument()
    expect(screen.getByText('décembre 2026')).toBeInTheDocument()
  })

  it("affiche le message conforme quand anomalies et péremptions sont vides", async () => {
    const user = userEvent.setup()
    render(
      <ControlsAccordion
        controls={[makeControl({ anomalies: [], expiryDates: [] })]}
      />,
    )
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('✓ Aucune anomalie — contrôle conforme')).toBeInTheDocument()
  })
})
