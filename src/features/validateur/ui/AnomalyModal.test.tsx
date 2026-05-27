import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnomalyModal } from './AnomalyModal'

describe('AnomalyModal', () => {
  it("ne s'affiche pas quand isOpen est false", () => {
    render(<AnomalyModal isOpen={false} onConfirm={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it("s'affiche quand isOpen est true", () => {
    render(<AnomalyModal isOpen={true} onConfirm={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/commentaire/i)).toBeInTheDocument()
  })

  it("affiche une erreur si on confirme sans commentaire", async () => {
    const user = userEvent.setup()
    render(<AnomalyModal isOpen={true} onConfirm={vi.fn()} onCancel={vi.fn()} />)

    await user.click(screen.getByTestId('btn-confirm-anomaly'))

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it("la modale reste ouverte et onConfirm n'est pas appelé si le commentaire est vide", async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<AnomalyModal isOpen={true} onConfirm={onConfirm} onCancel={vi.fn()} />)

    await user.click(screen.getByTestId('btn-confirm-anomaly'))

    expect(onConfirm).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it("appelle onConfirm avec le commentaire saisi", async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<AnomalyModal isOpen={true} onConfirm={onConfirm} onCancel={vi.fn()} />)

    await user.type(screen.getByTestId('textarea-anomaly'), 'Produit périmé')
    await user.click(screen.getByTestId('btn-confirm-anomaly'))

    expect(onConfirm).toHaveBeenCalledWith('Produit périmé')
  })

  it("appelle onCancel en cliquant sur Annuler", async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<AnomalyModal isOpen={true} onConfirm={vi.fn()} onCancel={onCancel} />)

    await user.click(screen.getByTestId('btn-cancel-anomaly'))

    expect(onCancel).toHaveBeenCalledOnce()
  })

  it("réinitialise le commentaire après annulation", async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <AnomalyModal isOpen={true} onConfirm={vi.fn()} onCancel={vi.fn()} />,
    )

    await user.type(screen.getByTestId('textarea-anomaly'), 'texte')
    await user.click(screen.getByTestId('btn-cancel-anomaly'))

    rerender(<AnomalyModal isOpen={true} onConfirm={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByTestId('textarea-anomaly')).toHaveValue('')
  })
})
