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

describe('ItemForm — photo par URL', () => {
  // Spec cas 1 : mode fichier par défaut
  it('affiche le bouton upload et le lien "ou entrer une URL" en mode fichier par défaut', () => {
    render(<ItemForm {...defaults} />)

    expect(screen.getByTestId('btn-upload-photo')).toBeInTheDocument()
    expect(screen.getByTestId('btn-switch-to-url')).toBeInTheDocument()
  })

  // Spec cas 2 : basculer vers le mode URL
  it('affiche le champ URL après avoir cliqué "ou entrer une URL"', async () => {
    const user = userEvent.setup()
    render(<ItemForm {...defaults} />)

    await user.click(screen.getByTestId('btn-switch-to-url'))

    expect(screen.getByTestId('input-photo-url')).toBeInTheDocument()
  })

  // Spec cas 3 : URL valide → aperçu affiché, pas d'erreur
  it('affiche un aperçu et aucune erreur quand l\'URL est valide (https://)', async () => {
    const user = userEvent.setup()
    render(<ItemForm {...defaults} />)

    await user.click(screen.getByTestId('btn-switch-to-url'))
    await user.type(screen.getByTestId('input-photo-url'), 'https://example.com/photo.jpg')

    expect(screen.getByAltText('Aperçu')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  // Spec cas 4 : URL invalide → erreur visible, bouton submit désactivé
  it('affiche un message d\'erreur quand l\'URL ne commence pas par https://', async () => {
    const user = userEvent.setup()
    render(<ItemForm {...defaults} />)

    await user.click(screen.getByTestId('btn-switch-to-url'))
    await user.type(screen.getByTestId('input-photo-url'), 'http://example.com')

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('https://')
  })

  // Spec cas 4 (suite) : bouton submit désactivé si URL invalide
  it('désactive le bouton submit quand l\'URL est invalide', async () => {
    const user = userEvent.setup()
    render(<ItemForm {...defaults} />)

    await user.click(screen.getByTestId('btn-switch-to-url'))
    await user.type(screen.getByTestId('input-photo-url'), 'http://example.com')

    expect(screen.getByTestId('btn-submit-item-form')).toBeDisabled()
  })

  // Spec cas 5 : retour mode fichier depuis mode URL
  it('masque le champ URL après avoir cliqué "← Choisir un fichier"', async () => {
    const user = userEvent.setup()
    render(<ItemForm {...defaults} />)

    await user.click(screen.getByTestId('btn-switch-to-url'))
    expect(screen.getByTestId('input-photo-url')).toBeInTheDocument()

    await user.click(screen.getByTestId('btn-switch-to-file'))

    expect(screen.queryByTestId('input-photo-url')).not.toBeInTheDocument()
    expect(screen.getByTestId('btn-upload-photo')).toBeInTheDocument()
  })

  // Spec cas 6 : Supprimer la photo → aperçu supprimé, retour mode fichier
  it('supprime l\'aperçu et revient en mode fichier après "Supprimer la photo"', async () => {
    const user = userEvent.setup()
    render(<ItemForm {...defaults} />)

    await user.click(screen.getByTestId('btn-switch-to-url'))
    await user.type(screen.getByTestId('input-photo-url'), 'https://example.com/photo.jpg')
    expect(screen.getByAltText('Aperçu')).toBeInTheDocument()

    await user.click(screen.getByTestId('btn-remove-photo'))

    expect(screen.queryByAltText('Aperçu')).not.toBeInTheDocument()
    expect(screen.getByTestId('btn-upload-photo')).toBeInTheDocument()
  })

  // Spec cas 7 : soumission avec URL valide → photoUrl = URL saisie
  it('soumet avec photoUrl égale à l\'URL saisie quand l\'URL est valide', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ItemForm {...defaults} onSubmit={onSubmit} />)

    await user.type(screen.getByTestId('input-item-name'), 'Défibrillateur')
    await user.click(screen.getByTestId('btn-switch-to-url'))
    await user.type(screen.getByTestId('input-photo-url'), 'https://example.com/photo.jpg')
    await user.click(screen.getByTestId('btn-submit-item-form'))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ photoUrl: 'https://example.com/photo.jpg' }),
    )
  })

  // Spec cas 8 : soumission bloquée si URL invalide (même avec nom rempli)
  it('bloque la soumission si l\'URL est invalide même quand le nom est rempli', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ItemForm {...defaults} onSubmit={onSubmit} />)

    await user.type(screen.getByTestId('input-item-name'), 'Défibrillateur')
    await user.click(screen.getByTestId('btn-switch-to-url'))
    await user.type(screen.getByTestId('input-photo-url'), 'http://example.com')
    await user.click(screen.getByTestId('btn-submit-item-form'))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  // Spec cas 9 : initialValues avec URL HTTPS externe → mode URL, valeur pré-remplie
  it('s\'ouvre en mode URL avec la valeur pré-remplie si initialValues contient une URL HTTPS externe', () => {
    render(
      <ItemForm
        {...defaults}
        initialValues={{ name: 'Oxymètre', photoUrl: 'https://example.com/photo.jpg', isCritical: false }}
      />,
    )

    expect(screen.getByTestId('input-photo-url')).toBeInTheDocument()
    expect(screen.getByTestId('input-photo-url')).toHaveValue('https://example.com/photo.jpg')
  })

  // Spec cas 10 : initialValues avec URL Firebase Storage → mode fichier (pas mode URL)
  it('s\'ouvre en mode fichier si initialValues contient une URL Firebase Storage', () => {
    render(
      <ItemForm
        {...defaults}
        initialValues={{
          name: 'Masque',
          photoUrl: 'https://firebasestorage.googleapis.com/v0/b/bucket/o/photo.jpg?alt=media',
          isCritical: false,
        }}
      />,
    )

    expect(screen.queryByTestId('input-photo-url')).not.toBeInTheDocument()
    expect(screen.getByTestId('btn-upload-photo')).toBeInTheDocument()
  })
})
