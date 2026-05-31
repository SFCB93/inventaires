import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCorrectionModal } from './useCorrectionModal'
import { createCorrectionAction } from '../../domain/actions'
import type { ExpiryAlertItem } from '../../domain/types'

vi.mock('../../domain/actions', () => ({
  createCorrectionAction: vi.fn(),
}))

const mockItem: ExpiryAlertItem = {
  itemId: 'item-1',
  itemName: 'SHA 100ml',
  compartmentName: 'Poche avant',
  inventoryId: 'inv-1',
  inventoryName: 'Sac PS',
  latestExpiryDate: '2026-05-01',
  comment: null,
  source: 'control',
}

function dateInDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

describe('useCorrectionModal', () => {
  const onSuccess = vi.fn()

  beforeEach(() => vi.clearAllMocks())

  it("affiche une erreur si la date est vide à la confirmation", async () => {
    const { result } = renderHook(() => useCorrectionModal(onSuccess))
    act(() => result.current.open(mockItem))
    await act(async () => result.current.handleConfirm())
    expect(result.current.dateError).toBe('La date est obligatoire.')
    expect(createCorrectionAction).not.toHaveBeenCalled()
  })

  it("affiche une erreur si la date est dans moins de 30 jours", async () => {
    const { result } = renderHook(() => useCorrectionModal(onSuccess))
    act(() => result.current.open(mockItem))
    act(() => result.current.handleDateChange(dateInDays(15)))
    await act(async () => result.current.handleConfirm())
    expect(result.current.dateError).toContain('J+30')
    expect(createCorrectionAction).not.toHaveBeenCalled()
  })

  it("efface l'erreur de date quand l'utilisateur modifie le champ", async () => {
    const { result } = renderHook(() => useCorrectionModal(onSuccess))
    act(() => result.current.open(mockItem))
    await act(async () => result.current.handleConfirm())
    expect(result.current.dateError).toBeDefined()
    act(() => result.current.handleDateChange(dateInDays(60)))
    expect(result.current.dateError).toBeUndefined()
  })

  it("appelle createCorrectionAction avec les bonnes données pour une date valide", async () => {
    vi.mocked(createCorrectionAction).mockResolvedValue({ ok: true, value: undefined })
    const { result } = renderHook(() => useCorrectionModal(onSuccess))
    const futureDate = dateInDays(60)
    act(() => result.current.open(mockItem))
    act(() => result.current.handleDateChange(futureDate))
    await act(async () => result.current.handleConfirm())
    expect(createCorrectionAction).toHaveBeenCalledWith({
      itemId: 'item-1',
      inventoryId: 'inv-1',
      newExpiryDate: futureDate,
    })
  })

  it("appelle onSuccess et ferme la modale après une correction réussie", async () => {
    vi.mocked(createCorrectionAction).mockResolvedValue({ ok: true, value: undefined })
    const { result } = renderHook(() => useCorrectionModal(onSuccess))
    act(() => result.current.open(mockItem))
    act(() => result.current.handleDateChange(dateInDays(60)))
    await act(async () => result.current.handleConfirm())
    expect(onSuccess).toHaveBeenCalled()
    expect(result.current.selectedItem).toBeNull()
  })

  it("affiche l'erreur serveur et garde la modale ouverte en cas d'échec", async () => {
    vi.mocked(createCorrectionAction).mockResolvedValue({ ok: false, error: 'Erreur réseau' })
    const { result } = renderHook(() => useCorrectionModal(onSuccess))
    act(() => result.current.open(mockItem))
    act(() => result.current.handleDateChange(dateInDays(60)))
    await act(async () => result.current.handleConfirm())
    expect(result.current.error).toBe('Erreur réseau')
    expect(result.current.selectedItem).not.toBeNull()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
