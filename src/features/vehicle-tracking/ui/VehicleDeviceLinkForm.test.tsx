import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VehicleDeviceLinkForm } from './VehicleDeviceLinkForm'

const defaultProps = {
  inventoryName: 'Fourgon',
  isLinked: false,
  isSubmitting: false,
  onGenerate: vi.fn(),
  onRevoke: vi.fn(),
}

describe('VehicleDeviceLinkForm', () => {
  it('propose d’associer un device quand aucun n’est lié', () => {
    render(<VehicleDeviceLinkForm {...defaultProps} />)
    expect(screen.getByTestId('btn-generate-device-key')).toHaveTextContent('Associer un device')
    expect(screen.queryByTestId('btn-revoke-device-key')).not.toBeInTheDocument()
  })

  it('propose de régénérer et révoquer quand un device est lié', () => {
    render(<VehicleDeviceLinkForm {...defaultProps} isLinked />)
    expect(screen.getByTestId('btn-generate-device-key')).toHaveTextContent('Régénérer la clé')
    expect(screen.getByTestId('btn-revoke-device-key')).toBeInTheDocument()
  })

  it('appelle onGenerate au clic sur le bouton principal', async () => {
    const onGenerate = vi.fn()
    render(<VehicleDeviceLinkForm {...defaultProps} onGenerate={onGenerate} />)

    await userEvent.click(screen.getByTestId('btn-generate-device-key'))

    expect(onGenerate).toHaveBeenCalled()
  })

  it('n’appelle pas onRevoke tant que la confirmation n’est pas validée', async () => {
    const onRevoke = vi.fn()
    render(<VehicleDeviceLinkForm {...defaultProps} isLinked onRevoke={onRevoke} />)

    await userEvent.click(screen.getByTestId('btn-revoke-device-key'))

    expect(onRevoke).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('appelle onRevoke une fois la confirmation validée', async () => {
    const onRevoke = vi.fn()
    render(<VehicleDeviceLinkForm {...defaultProps} isLinked onRevoke={onRevoke} />)

    await userEvent.click(screen.getByTestId('btn-revoke-device-key'))
    await userEvent.click(screen.getByTestId('btn-confirm-delete'))

    expect(onRevoke).toHaveBeenCalled()
  })

  it('ouvre la popup de documentation HTTP au clic', async () => {
    render(<VehicleDeviceLinkForm {...defaultProps} />)

    await userEvent.click(screen.getByTestId('btn-show-vehicle-api-doc'))

    expect(screen.getByTestId('btn-close-vehicle-api-doc')).toBeInTheDocument()
  })
})
