import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PublicCorrectionModal } from './PublicCorrectionModal'

const defaultProps = {
  isOpen: true,
  itemName: 'SHA 100ml',
  currentExpiryDate: '01/05/2026',
  dateValue: '',
  correctorName: '',
  isSubmitting: false,
  onDateChange: vi.fn(),
  onCorrectorNameChange: vi.fn(),
  onConfirm: vi.fn(),
  onClose: vi.fn(),
}

describe('PublicCorrectionModal', () => {
  it("ne rend rien si isOpen est false", () => {
    const { container } = render(<PublicCorrectionModal {...defaultProps} isOpen={false} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("affiche 'Réessayer' au lieu de 'Confirmer' quand une erreur serveur est présente", () => {
    render(<PublicCorrectionModal {...defaultProps} error="Erreur réseau" />)
    expect(screen.getByTestId('btn-confirm-public-correction')).toHaveTextContent('Réessayer')
  })

  it("désactive le bouton Confirmer pendant la soumission", () => {
    render(<PublicCorrectionModal {...defaultProps} isSubmitting={true} />)
    expect(screen.getByTestId('btn-confirm-public-correction')).toBeDisabled()
  })

  it("affiche le message d'erreur de validation de date", () => {
    render(<PublicCorrectionModal {...defaultProps} dateError="Cette date ne résout pas l'alerte (doit être > J+30)." />)
    expect(screen.getByRole('alert')).toHaveTextContent('J+30')
  })

  it("préremplit le champ Corrigé par avec correctorName", () => {
    render(<PublicCorrectionModal {...defaultProps} correctorName="Jean" />)
    expect(screen.getByTestId('input-corrector-name-expiry')).toHaveValue('Jean')
  })

  it("appelle onCorrectorNameChange à la saisie du nom", async () => {
    const onCorrectorNameChange = vi.fn()
    render(<PublicCorrectionModal {...defaultProps} onCorrectorNameChange={onCorrectorNameChange} />)
    await userEvent.type(screen.getByTestId('input-corrector-name-expiry'), 'J')
    expect(onCorrectorNameChange).toHaveBeenCalledWith('J')
  })

  it("appelle onConfirm au clic sur Confirmer", async () => {
    const onConfirm = vi.fn()
    render(<PublicCorrectionModal {...defaultProps} onConfirm={onConfirm} />)
    await userEvent.click(screen.getByTestId('btn-confirm-public-correction'))
    expect(onConfirm).toHaveBeenCalled()
  })

  it("appelle onClose au clic sur le bouton Fermer", async () => {
    const onClose = vi.fn()
    render(<PublicCorrectionModal {...defaultProps} onClose={onClose} />)
    await userEvent.click(screen.getByLabelText('Fermer'))
    expect(onClose).toHaveBeenCalled()
  })
})
