import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ItemForm } from './ItemForm'

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}))

vi.mock('@/shared/lib/resize-image', () => ({
  resizeImageToBase64: vi.fn(),
}))

import { resizeImageToBase64 } from '@/shared/lib/resize-image'

function firePasteEvent(target: Element, file: File | null) {
  const clipboardData = { items: [{ type: file?.type ?? 'text/plain', getAsFile: () => file }] }
  const event = new Event('paste', { bubbles: true }) as ClipboardEvent
  Object.defineProperty(event, 'clipboardData', { value: clipboardData })
  target.dispatchEvent(event)
}

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
        initialValues={{ name: 'Garrots', photoUrl: 'https://example.com/photo.jpg', hasExpiry: false, isCritical: false }}
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
        initialValues={{ name: 'Garrots', photoUrl: 'https://example.com/photo.jpg', hasExpiry: false, isCritical: false }}
      />,
    )

    await user.click(screen.getByTestId('btn-remove-photo'))
    await user.click(screen.getByTestId('btn-submit-item-form'))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ photoUrl: '' }))
  })
})

describe('ItemForm — photo collage', () => {
  it('affiche le bouton upload et l\'indicateur de collage', () => {
    render(<ItemForm {...defaults} />)

    expect(screen.getByTestId('btn-upload-photo')).toBeInTheDocument()
    expect(screen.getByText(/Ctrl\+V/)).toBeInTheDocument()
  })

  it('affiche un aperçu après collage d\'une image depuis le champ nom', async () => {
    vi.mocked(resizeImageToBase64).mockResolvedValueOnce('data:image/png;base64,abc123')
    render(<ItemForm {...defaults} />)

    await act(async () => {
      firePasteEvent(screen.getByTestId('input-item-name'), new File([''], 'screenshot.png', { type: 'image/png' }))
    })

    expect(screen.getByAltText('Aperçu')).toBeInTheDocument()
  })

  it('ignore un collage sans image (texte uniquement)', () => {
    render(<ItemForm {...defaults} />)

    firePasteEvent(screen.getByTestId('input-item-name'), null)

    expect(screen.queryByAltText('Aperçu')).not.toBeInTheDocument()
  })

  it('soumet avec photoUrl base64 après collage d\'une image', async () => {
    vi.mocked(resizeImageToBase64).mockResolvedValueOnce('data:image/png;base64,abc123')
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<ItemForm {...defaults} onSubmit={onSubmit} />)

    await act(async () => {
      firePasteEvent(screen.getByTestId('input-item-name'), new File([''], 'screenshot.png', { type: 'image/png' }))
    })

    await user.type(screen.getByTestId('input-item-name'), 'Défibrillateur')
    await user.click(screen.getByTestId('btn-submit-item-form'))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ photoUrl: 'data:image/png;base64,abc123' }),
    )
  })
})
