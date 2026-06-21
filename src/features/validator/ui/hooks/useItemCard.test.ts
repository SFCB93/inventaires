import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useItemCard } from './useItemCard'
import type { Item } from '../../domain/types'

const criticalItem: Item = { id: 'mat-1', name: 'DAE', photoUrl: '', hasExpiry: true, isCritical: true, order: 1 }
const perishableItem: Item = { ...criticalItem, isCritical: false }

describe('useItemCard — validation et conversion de date', () => {
  it('accepte et convertit le format MM-AAAA en AAAA-MM-01', () => {
    const onPresent = vi.fn()
    const { result } = renderHook(() => useItemCard(criticalItem, undefined, onPresent, vi.fn()))
    act(() => result.current.setExpiryDate('06-2026'))
    act(() => result.current.handleMarkPresent())
    expect(onPresent).toHaveBeenCalledWith('2026-06-01')
  })

  it('accepte et convertit le format AAAA-MM en AAAA-MM-01', () => {
    const onPresent = vi.fn()
    const { result } = renderHook(() => useItemCard(criticalItem, undefined, onPresent, vi.fn()))
    act(() => result.current.setExpiryDate('2026-12'))
    act(() => result.current.handleMarkPresent())
    expect(onPresent).toHaveBeenCalledWith('2026-12-01')
  })

  it('bloque si format invalide et positionne dateError sur "format"', () => {
    const onPresent = vi.fn()
    const { result } = renderHook(() => useItemCard(perishableItem, undefined, onPresent, vi.fn()))
    act(() => result.current.setExpiryDate('abc'))
    act(() => result.current.handleMarkPresent())
    expect(onPresent).not.toHaveBeenCalled()
    expect(result.current.dateError).toBe('format')
  })

  it('bloque si critique et date vide, positionne dateError sur "required"', () => {
    const onPresent = vi.fn()
    const { result } = renderHook(() => useItemCard(criticalItem, undefined, onPresent, vi.fn()))
    act(() => result.current.handleMarkPresent())
    expect(onPresent).not.toHaveBeenCalled()
    expect(result.current.dateError).toBe('required')
  })

  it('bloque l\'ouverture de la modale si critique et date manquante', () => {
    const { result } = renderHook(() => useItemCard(criticalItem, undefined, vi.fn(), vi.fn()))
    act(() => result.current.handleOpenAnomaly())
    expect(result.current.isModalOpen).toBe(false)
    expect(result.current.dateError).toBe('required')
  })

  it('clearExpiryDate vide la date et efface l\'erreur', () => {
    const { result } = renderHook(() => useItemCard(perishableItem, undefined, vi.fn(), vi.fn()))
    act(() => result.current.setExpiryDate('abc'))
    act(() => result.current.handleMarkPresent())
    expect(result.current.dateError).toBe('format')
    act(() => result.current.clearExpiryDate())
    expect(result.current.expiryDate).toBe('')
    expect(result.current.dateError).toBe(false)
  })

  it('pré-remplit la date depuis initialExpiryDate (slice AAAA-MM)', () => {
    const { result } = renderHook(() => useItemCard(criticalItem, '2026-06-01', vi.fn(), vi.fn()))
    expect(result.current.expiryDate).toBe('2026-06')
  })
})
