import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePublicAnomalyCorrectionModal } from './usePublicAnomalyCorrectionModal'
import { createPublicAnomalyCorrectionAction } from '@/features/controls/domain/public-actions'
import type { AnomalyAlertItem } from '@/shared/domain/alerts'

vi.mock('@/features/controls/domain/public-actions', () => ({
  createPublicAnomalyCorrectionAction: vi.fn(),
}))

const mockItem: AnomalyAlertItem = {
  itemId: 'item-1',
  itemName: 'Défibrillateur',
  compartmentName: 'Poche avant',
  inventoryId: 'inv-1',
  inventoryName: 'Sac PS',
  comment: 'Batterie déchargée',
  controlId: 'ctrl-1',
}

describe('usePublicAnomalyCorrectionModal', () => {
  const onSuccess = vi.fn()

  beforeEach(() => vi.clearAllMocks())

  it("ouvre la modale avec l'item sélectionné", () => {
    const { result } = renderHook(() => usePublicAnomalyCorrectionModal(onSuccess, 'Jean'))
    act(() => result.current.open(mockItem))
    expect(result.current.selectedItem).toEqual(mockItem)
  })

  it("ferme la modale et réinitialise l'état", () => {
    const { result } = renderHook(() => usePublicAnomalyCorrectionModal(onSuccess, 'Jean'))
    act(() => result.current.open(mockItem))
    act(() => result.current.close())
    expect(result.current.selectedItem).toBeNull()
    expect(result.current.isSubmitting).toBe(false)
  })

  it("affiche une erreur si le nom du correcteur est vide", async () => {
    const { result } = renderHook(() => usePublicAnomalyCorrectionModal(onSuccess, '   '))
    act(() => result.current.open(mockItem))
    await act(async () => result.current.handleConfirm())
    expect(result.current.error).toBe('Le nom du correcteur est obligatoire.')
    expect(createPublicAnomalyCorrectionAction).not.toHaveBeenCalled()
  })

  it('appelle createPublicAnomalyCorrectionAction avec les bons paramètres', async () => {
    vi.mocked(createPublicAnomalyCorrectionAction).mockResolvedValue({ ok: true, value: undefined })
    const { result } = renderHook(() => usePublicAnomalyCorrectionModal(onSuccess, 'Jean'))
    act(() => result.current.open(mockItem))
    await act(async () => result.current.handleConfirm())
    expect(createPublicAnomalyCorrectionAction).toHaveBeenCalledWith({ itemId: 'item-1', inventoryId: 'inv-1', correctedBy: 'Jean' })
  })

  it('appelle onSuccess et ferme la modale après une correction réussie', async () => {
    vi.mocked(createPublicAnomalyCorrectionAction).mockResolvedValue({ ok: true, value: undefined })
    const { result } = renderHook(() => usePublicAnomalyCorrectionModal(onSuccess, 'Jean'))
    act(() => result.current.open(mockItem))
    await act(async () => result.current.handleConfirm())
    expect(onSuccess).toHaveBeenCalled()
    expect(result.current.selectedItem).toBeNull()
  })

  it("affiche l'erreur serveur et garde la modale ouverte en cas d'échec", async () => {
    vi.mocked(createPublicAnomalyCorrectionAction).mockResolvedValue({ ok: false, error: 'Erreur réseau' })
    const { result } = renderHook(() => usePublicAnomalyCorrectionModal(onSuccess, 'Jean'))
    act(() => result.current.open(mockItem))
    await act(async () => result.current.handleConfirm())
    expect(result.current.error).toBe('Erreur réseau')
    expect(result.current.selectedItem).not.toBeNull()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
