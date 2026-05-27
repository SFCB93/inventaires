import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ItemForm } from './ItemForm'

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}))

global.URL.createObjectURL = vi.fn(() => 'blob:test')

const defaults = {
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
}

describe('ItemForm', () => {
  // Règle spec : "Si le nom du matériel est vide → message d'erreur inline, pas de création."
  it('affiche une erreur et bloque la soumission si le nom est vide', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ItemForm {...defaults} onSubmit={onSubmit} />)

    await user.click(screen.getByTestId('btn-submit-item-form'))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  // Règle spec : "hasExpiry et isCritical sont faux par défaut."
  it('soumet avec hasExpiry et isCritical false par défaut', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ItemForm {...defaults} onSubmit={onSubmit} />)

    await user.type(screen.getByTestId('input-item-name'), 'Lampe torche')
    await user.click(screen.getByTestId('btn-submit-item-form'))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ hasExpiry: false, isCritical: false }))
  })

  // Régression : suppression photo sur matériel existant (bug photoCleared)
  it('masque le bouton Supprimer après avoir supprimé la photo', async () => {
    const user = userEvent.setup()
    render(
      <ItemForm
        {...defaults}
        initialValues={{ name: 'Garrots', photoUrl: 'https://example.com/photo.jpg', isCritical: false }}
      />,
    )

    expect(screen.getByTestId('btn-remove-photo')).toBeInTheDocument()

    await user.click(screen.getByTestId('btn-remove-photo'))

    expect(screen.queryByTestId('btn-remove-photo')).not.toBeInTheDocument()
  })

  it('soumet photoUrl vide après suppression de la photo existante', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <ItemForm
        {...defaults}
        onSubmit={onSubmit}
        initialValues={{ name: 'Garrots', photoUrl: 'https://example.com/photo.jpg', isCritical: false }}
      />,
    )

    await user.click(screen.getByTestId('btn-remove-photo'))
    await user.click(screen.getByTestId('btn-submit-item-form'))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ photoUrl: '' }))
  })
})
