import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { CreateInventoryForm } from './CreateInventoryForm'

const defaults = {
  isOpen: true,
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
}

describe('CreateInventoryForm', () => {
  // Règle spec : "Si le nom est vide → message d'erreur inline, pas de création."
  it('affiche une erreur et bloque la soumission si le nom est vide', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<CreateInventoryForm {...defaults} onSubmit={onSubmit} />)

    await user.click(screen.getByTestId('btn-submit-create-inventory'))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('appelle onSubmit avec le nom trimmé lors de la soumission', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<CreateInventoryForm {...defaults} onSubmit={onSubmit} />)

    await user.type(screen.getByTestId('input-inventory-name'), '  Sac PS  ')
    await user.click(screen.getByTestId('btn-submit-create-inventory'))

    expect(onSubmit).toHaveBeenCalledWith('Sac PS')
  })

  it('appelle onCancel au clic sur Annuler', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<CreateInventoryForm {...defaults} onCancel={onCancel} />)

    await user.click(screen.getByTestId('btn-cancel-create-inventory'))

    expect(onCancel).toHaveBeenCalled()
  })

  it("n'affiche rien si isOpen est false", () => {
    render(<CreateInventoryForm {...defaults} isOpen={false} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
