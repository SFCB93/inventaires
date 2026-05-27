import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ItemCard } from './ItemCard'
import type { Item } from '../domain/types'

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}))

const baseItem: Item = {
  id: 'mat-1',
  name: 'Défibrillateur',
  photoUrl: '',
  hasExpiry: false,
  isCritical: false,
  order: 1,
}

const perishableItem: Item = { ...baseItem, hasExpiry: true }
const criticalItem: Item = { ...baseItem, hasExpiry: true, isCritical: true }

describe('ItemCard — affichage', () => {
  it("affiche le nom du matériel", () => {
    render(<ItemCard item={baseItem} onPresent={vi.fn()} onAnomaly={vi.fn()} />)

    expect(screen.getByText('Défibrillateur')).toBeInTheDocument()
  })

  it("n'affiche pas le champ date si hasExpiry est false", () => {
    render(<ItemCard item={baseItem} onPresent={vi.fn()} onAnomaly={vi.fn()} />)

    expect(screen.queryByTestId('input-expiry-date')).not.toBeInTheDocument()
  })

  it("affiche le champ date avec '(facultatif)' pour un matériel périssable non critique", () => {
    render(<ItemCard item={perishableItem} onPresent={vi.fn()} onAnomaly={vi.fn()} />)

    expect(screen.getByTestId('input-expiry-date')).toBeInTheDocument()
    expect(screen.getByText('facultatif')).toBeInTheDocument()
  })

  it("affiche le champ date avec '(obligatoire)' pour un matériel critique", () => {
    render(<ItemCard item={criticalItem} onPresent={vi.fn()} onAnomaly={vi.fn()} />)

    expect(screen.getByTestId('input-expiry-date')).toBeInTheDocument()
    expect(screen.getByText('obligatoire')).toBeInTheDocument()
  })

  it("n'affiche pas de bloc photo si photoUrl est vide", () => {
    render(<ItemCard item={baseItem} onPresent={vi.fn()} onAnomaly={vi.fn()} />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it("affiche la photo si photoUrl est renseigné", () => {
    render(
      <ItemCard
        item={{ ...baseItem, photoUrl: 'https://example.com/photo.jpg' }}
        onPresent={vi.fn()}
        onAnomaly={vi.fn()}
      />,
    )

    expect(screen.getByRole('img', { name: 'Défibrillateur' })).toBeInTheDocument()
  })
})

describe("ItemCard — décision Présent", () => {
  it("appelle onPresent sans date si le matériel n'a pas de date de péremption", async () => {
    const user = userEvent.setup()
    const onPresent = vi.fn()
    render(<ItemCard item={baseItem} onPresent={onPresent} onAnomaly={vi.fn()} />)

    await user.click(screen.getByTestId('btn-present'))

    expect(onPresent).toHaveBeenCalledWith(undefined)
  })

  it("bloque la décision si le matériel est critique et la date est vide", async () => {
    const user = userEvent.setup()
    const onPresent = vi.fn()
    render(<ItemCard item={criticalItem} onPresent={onPresent} onAnomaly={vi.fn()} />)

    await user.click(screen.getByTestId('btn-present'))

    expect(onPresent).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it("appelle onPresent avec la date si le matériel est critique et la date est renseignée", async () => {
    const user = userEvent.setup()
    const onPresent = vi.fn()
    render(<ItemCard item={criticalItem} onPresent={onPresent} onAnomaly={vi.fn()} />)

    await user.type(screen.getByTestId('input-expiry-date'), '2026-12-31')
    await user.click(screen.getByTestId('btn-present'))

    expect(onPresent).toHaveBeenCalledWith('2026-12-31')
  })

  it("appelle onPresent avec la date si périssable non critique et date renseignée", async () => {
    const user = userEvent.setup()
    const onPresent = vi.fn()
    render(<ItemCard item={perishableItem} onPresent={onPresent} onAnomaly={vi.fn()} />)

    await user.type(screen.getByTestId('input-expiry-date'), '2026-06-15')
    await user.click(screen.getByTestId('btn-present'))

    expect(onPresent).toHaveBeenCalledWith('2026-06-15')
  })
})

describe("ItemCard — décision Anomalie", () => {
  it("ouvre la modale anomalie au clic sur le bouton", async () => {
    const user = userEvent.setup()
    render(<ItemCard item={baseItem} onPresent={vi.fn()} onAnomaly={vi.fn()} />)

    await user.click(screen.getByTestId('btn-anomaly'))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it("bloque l'ouverture de la modale si critique et date manquante", async () => {
    const user = userEvent.setup()
    render(<ItemCard item={criticalItem} onPresent={vi.fn()} onAnomaly={vi.fn()} />)

    await user.click(screen.getByTestId('btn-anomaly'))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it("appelle onAnomaly avec le commentaire après confirmation", async () => {
    const user = userEvent.setup()
    const onAnomaly = vi.fn()
    render(<ItemCard item={baseItem} onPresent={vi.fn()} onAnomaly={onAnomaly} />)

    await user.click(screen.getByTestId('btn-anomaly'))
    await user.type(screen.getByTestId('textarea-anomaly'), 'Emballage endommagé')
    await user.click(screen.getByTestId('btn-confirm-anomaly'))

    expect(onAnomaly).toHaveBeenCalledWith('Emballage endommagé', undefined)
  })
})
