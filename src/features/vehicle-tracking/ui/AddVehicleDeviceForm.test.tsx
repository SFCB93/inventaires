import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddVehicleDeviceForm } from './AddVehicleDeviceForm'

const defaultProps = {
  isOpen: true,
  candidates: [{ inventoryId: 'inv-1', name: 'Fourgon' }],
  isSubmitting: false,
  onSubmit: vi.fn(),
  onClose: vi.fn(),
}

describe('AddVehicleDeviceForm', () => {
  it('ne rend rien si isOpen est false', () => {
    const { container } = render(<AddVehicleDeviceForm {...defaultProps} isOpen={false} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('affiche un message informatif si tous les inventaires sont déjà équipés', () => {
    render(<AddVehicleDeviceForm {...defaultProps} candidates={[]} />)
    expect(screen.getByText('Tous les inventaires ont déjà un device associé.')).toBeInTheDocument()
    expect(screen.queryByTestId('select-vehicle-inventory')).not.toBeInTheDocument()
  })

  it('affiche une erreur de chargement distincte du message "tous équipés"', () => {
    render(<AddVehicleDeviceForm {...defaultProps} candidates={[]} loadError="Firestore indisponible." />)
    expect(screen.getByRole('alert')).toHaveTextContent('Firestore indisponible.')
    expect(screen.queryByText('Tous les inventaires ont déjà un device associé.')).not.toBeInTheDocument()
  })

  it('appelle onSubmit avec l’inventaire sélectionné', async () => {
    const onSubmit = vi.fn()
    render(
      <AddVehicleDeviceForm
        {...defaultProps}
        candidates={[{ inventoryId: 'inv-1', name: 'Fourgon' }, { inventoryId: 'inv-2', name: 'Camion' }]}
        onSubmit={onSubmit}
      />,
    )

    await userEvent.selectOptions(screen.getByTestId('select-vehicle-inventory'), 'inv-2')
    await userEvent.click(screen.getByTestId('btn-submit-add-vehicle-device'))

    expect(onSubmit).toHaveBeenCalledWith('inv-2')
  })

  it('affiche l’erreur de soumission sous le select', () => {
    render(<AddVehicleDeviceForm {...defaultProps} error="Accès non autorisé." />)
    expect(screen.getByRole('alert')).toHaveTextContent('Accès non autorisé.')
  })

  it('affiche la clé générée et masque le select', () => {
    render(<AddVehicleDeviceForm {...defaultProps} newApiKey="abc123" />)
    expect(screen.getByTestId('device-api-key-reveal')).toHaveTextContent('abc123')
    expect(screen.queryByTestId('select-vehicle-inventory')).not.toBeInTheDocument()
  })

  it('appelle onClose au clic sur Terminé une fois la clé générée', async () => {
    const onClose = vi.fn()
    render(<AddVehicleDeviceForm {...defaultProps} newApiKey="abc123" onClose={onClose} />)

    await userEvent.click(screen.getByTestId('btn-close-add-vehicle-device'))

    expect(onClose).toHaveBeenCalled()
  })
})
