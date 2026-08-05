import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VehicleFleetStatus } from './VehicleFleetStatus'
import type { VehicleStatus } from '../domain/types'

const vehicle: VehicleStatus = {
  inventoryId: 'inv-1',
  name: 'Fourgon',
  isCircuitCut: false,
  position: { lat: 48.85, lng: 2.35 },
  stableSince: new Date(),
  lastSeenAt: new Date(),
}

describe('VehicleFleetStatus', () => {
  it('affiche un squelette de chargement', () => {
    render(<VehicleFleetStatus vehicles={[]} isLoading onSelectVehicle={vi.fn()} onAddClick={vi.fn()} />)
    expect(screen.getByTestId('vehicle-fleet-skeleton')).toBeInTheDocument()
  })

  it('affiche un état vide avec un bouton Ajouter quand aucun véhicule n’est associé', () => {
    render(<VehicleFleetStatus vehicles={[]} onSelectVehicle={vi.fn()} onAddClick={vi.fn()} />)
    expect(screen.getByText("Aucun véhicule associé pour l'instant.")).toBeInTheDocument()
    expect(screen.getByTestId('btn-add-vehicle-device-empty')).toBeInTheDocument()
  })

  it('affiche la liste des véhicules associés', () => {
    render(<VehicleFleetStatus vehicles={[vehicle]} onSelectVehicle={vi.fn()} onAddClick={vi.fn()} />)
    expect(screen.getByTestId('vehicle-row-inv-1')).toBeInTheDocument()
  })

  it('appelle onAddClick au clic sur le bouton d’en-tête', async () => {
    const onAddClick = vi.fn()
    render(<VehicleFleetStatus vehicles={[vehicle]} onSelectVehicle={vi.fn()} onAddClick={onAddClick} />)

    await userEvent.click(screen.getByTestId('btn-add-vehicle-device'))

    expect(onAddClick).toHaveBeenCalled()
  })
})
