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
  onRevokeAndDelete: vi.fn(),
}

describe('VehicleDeviceLinkForm', () => {
  it('propose d’associer un device quand aucun n’est lié', () => {
    render(<VehicleDeviceLinkForm {...defaultProps} />)
    expect(screen.getByTestId('btn-generate-device-key')).toHaveTextContent('Associer un device')
    expect(screen.queryByTestId('btn-revoke-device-key')).not.toBeInTheDocument()
  })

  it('ne propose que Révoquer quand un device est lié, pas de raccourci de régénération', () => {
    render(<VehicleDeviceLinkForm {...defaultProps} isLinked />)
    expect(screen.queryByTestId('btn-generate-device-key')).not.toBeInTheDocument()
    expect(screen.getByTestId('btn-revoke-device-key')).toBeInTheDocument()
  })

  it('appelle onGenerate au clic sur le bouton principal', async () => {
    const onGenerate = vi.fn()
    render(<VehicleDeviceLinkForm {...defaultProps} onGenerate={onGenerate} />)

    await userEvent.click(screen.getByTestId('btn-generate-device-key'))

    expect(onGenerate).toHaveBeenCalled()
  })

  it('n’appelle ni onRevoke ni onRevokeAndDelete tant qu’aucun choix n’est fait dans la modale', async () => {
    const onRevoke = vi.fn()
    const onRevokeAndDelete = vi.fn()
    render(<VehicleDeviceLinkForm {...defaultProps} isLinked onRevoke={onRevoke} onRevokeAndDelete={onRevokeAndDelete} />)

    await userEvent.click(screen.getByTestId('btn-revoke-device-key'))

    expect(onRevoke).not.toHaveBeenCalled()
    expect(onRevokeAndDelete).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('appelle onRevoke (sans suppression) au clic sur "Révoquer"', async () => {
    const onRevoke = vi.fn()
    const onRevokeAndDelete = vi.fn()
    render(<VehicleDeviceLinkForm {...defaultProps} isLinked onRevoke={onRevoke} onRevokeAndDelete={onRevokeAndDelete} />)

    await userEvent.click(screen.getByTestId('btn-revoke-device-key'))
    await userEvent.click(screen.getByTestId('btn-revoke-only'))

    expect(onRevoke).toHaveBeenCalled()
    expect(onRevokeAndDelete).not.toHaveBeenCalled()
  })

  it('appelle onRevokeAndDelete au clic sur "Révoquer et supprimer toutes les données"', async () => {
    const onRevoke = vi.fn()
    const onRevokeAndDelete = vi.fn()
    render(<VehicleDeviceLinkForm {...defaultProps} isLinked onRevoke={onRevoke} onRevokeAndDelete={onRevokeAndDelete} />)

    await userEvent.click(screen.getByTestId('btn-revoke-device-key'))
    await userEvent.click(screen.getByTestId('btn-revoke-and-delete'))

    expect(onRevokeAndDelete).toHaveBeenCalled()
    expect(onRevoke).not.toHaveBeenCalled()
  })

  it('ferme la modale sans rien appeler au clic sur Annuler', async () => {
    const onRevoke = vi.fn()
    const onRevokeAndDelete = vi.fn()
    render(<VehicleDeviceLinkForm {...defaultProps} isLinked onRevoke={onRevoke} onRevokeAndDelete={onRevokeAndDelete} />)

    await userEvent.click(screen.getByTestId('btn-revoke-device-key'))
    await userEvent.click(screen.getByTestId('btn-cancel-revoke'))

    expect(onRevoke).not.toHaveBeenCalled()
    expect(onRevokeAndDelete).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('ouvre la popup de documentation HTTP au clic', async () => {
    render(<VehicleDeviceLinkForm {...defaultProps} />)

    await userEvent.click(screen.getByTestId('btn-show-vehicle-api-doc'))

    expect(screen.getByTestId('btn-close-vehicle-api-doc')).toBeInTheDocument()
  })
})
