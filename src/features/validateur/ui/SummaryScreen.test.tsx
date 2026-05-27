import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SummaryScreen } from './SummaryScreen'
import type { CompartmentWithItems, ItemResult } from '../domain/types'

const compartments: CompartmentWithItems[] = [
  {
    id: 'emp-1',
    name: 'Poche avant',
    order: 1,
    items: [
      { id: 'mat-1', name: 'Défibrillateur', photoUrl: '', hasExpiry: true, isCritical: true, order: 1 },
      { id: 'mat-2', name: 'Masque', photoUrl: '', hasExpiry: false, isCritical: false, order: 2 },
    ],
  },
]

const results: ItemResult[] = [
  { itemId: 'mat-1', compartmentId: 'emp-1', status: 'present' },
  { itemId: 'mat-2', compartmentId: 'emp-1', status: 'anomaly', comment: 'Périmé' },
]

describe('SummaryScreen — affichage', () => {
  it("affiche le nombre de matériels vérifiés", () => {
    render(
      <SummaryScreen
        compartments={compartments}
        results={results}
        onSubmit={vi.fn()}
        isSubmitting={false}
      />,
    )

    expect(screen.getByText(/2 matériels vérifiés/i)).toBeInTheDocument()
  })

  it("affiche le nombre d'anomalies", () => {
    render(
      <SummaryScreen
        compartments={compartments}
        results={results}
        onSubmit={vi.fn()}
        isSubmitting={false}
      />,
    )

    expect(screen.getByText(/1 anomalie/i)).toBeInTheDocument()
  })

  it("affiche 'Aucune anomalie' s'il n'y en a pas", () => {
    const noAnomalyResults: ItemResult[] = results.map((r) => ({ ...r, status: 'present' as const }))
    render(
      <SummaryScreen
        compartments={compartments}
        results={noAnomalyResults}
        onSubmit={vi.fn()}
        isSubmitting={false}
      />,
    )

    expect(screen.getByText(/aucune anomalie/i)).toBeInTheDocument()
  })

  it("affiche le commentaire de l'anomalie", () => {
    render(
      <SummaryScreen
        compartments={compartments}
        results={results}
        onSubmit={vi.fn()}
        isSubmitting={false}
      />,
    )

    expect(screen.getByText('Périmé')).toBeInTheDocument()
  })

  it("affiche un message d'erreur si la prop error est fournie", () => {
    render(
      <SummaryScreen
        compartments={compartments}
        results={results}
        onSubmit={vi.fn()}
        isSubmitting={false}
        error="Erreur réseau, veuillez réessayer."
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Erreur réseau')
  })

  it("affiche 'Envoi en cours…' et désactive le bouton quand isSubmitting est true", () => {
    render(
      <SummaryScreen
        compartments={compartments}
        results={results}
        onSubmit={vi.fn()}
        isSubmitting={true}
      />,
    )

    expect(screen.getByTestId('btn-submit')).toHaveTextContent('Envoi en cours…')
    expect(screen.getByTestId('btn-submit')).toBeDisabled()
  })

  it("affiche 'Réessayer' sur le bouton quand error est fournie", () => {
    render(
      <SummaryScreen
        compartments={compartments}
        results={results}
        onSubmit={vi.fn()}
        isSubmitting={false}
        error="Impossible d'enregistrer le contrôle."
      />,
    )

    expect(screen.getByTestId('btn-submit')).toHaveTextContent('Réessayer')
  })
})

describe('SummaryScreen — soumission', () => {
  it("bloque la soumission si le nom du vérificateur est vide", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <SummaryScreen
        compartments={compartments}
        results={results}
        onSubmit={onSubmit}
        isSubmitting={false}
      />,
    )

    await user.click(screen.getByTestId('btn-submit'))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it("appelle onSubmit avec le nom du vérificateur saisi", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <SummaryScreen
        compartments={compartments}
        results={results}
        onSubmit={onSubmit}
        isSubmitting={false}
      />,
    )

    await user.type(screen.getByTestId('input-verifier-name'), 'Jean Dupont')
    await user.click(screen.getByTestId('btn-submit'))

    expect(onSubmit).toHaveBeenCalledWith('Jean Dupont')
  })
})
