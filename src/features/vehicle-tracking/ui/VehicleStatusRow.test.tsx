import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VehicleStatusRow } from './VehicleStatusRow'
import type { VehicleStatus } from '../domain/types'

const baseVehicle: VehicleStatus = {
  inventoryId: 'inv-1',
  name: 'Fourgon',
  isCircuitCut: null,
  position: null,
  stableSince: null,
  lastSeenAt: null,
}

describe('VehicleStatusRow', () => {
  it('affiche "En attente de signal" quand le véhicule n’a jamais émis', () => {
    render(<VehicleStatusRow vehicle={baseVehicle} onSelect={vi.fn()} />)
    expect(screen.getByText('En attente de signal')).toBeInTheDocument()
    expect(screen.getByText('Position inconnue')).toBeInTheDocument()
  })

  it('affiche "Coupe-circuit activé" quand isCircuitCut est true', () => {
    render(<VehicleStatusRow vehicle={{ ...baseVehicle, isCircuitCut: true }} onSelect={vi.fn()} />)
    expect(screen.getByText('Coupe-circuit activé')).toBeInTheDocument()
  })

  it('affiche "Circuit actif" quand isCircuitCut est false', () => {
    render(<VehicleStatusRow vehicle={{ ...baseVehicle, isCircuitCut: false }} onSelect={vi.fn()} />)
    expect(screen.getByText('Circuit actif')).toBeInTheDocument()
  })

  it('appelle onSelect au clic', async () => {
    const onSelect = vi.fn()
    render(<VehicleStatusRow vehicle={baseVehicle} onSelect={onSelect} />)

    await userEvent.click(screen.getByRole('button', { name: "Voir l'historique de Fourgon" }))

    expect(onSelect).toHaveBeenCalled()
  })
})
