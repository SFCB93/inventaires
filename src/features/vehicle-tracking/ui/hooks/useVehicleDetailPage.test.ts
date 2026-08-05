import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { ok, err } from '@/shared/domain/result'
import { useVehicleDetailPage } from './useVehicleDetailPage'
import { linkDeviceAction, revokeDeviceAction, getVehiclePositionHistoryAction } from '../../domain/actions'

vi.mock('../../domain/actions', () => ({
  linkDeviceAction: vi.fn(),
  revokeDeviceAction: vi.fn(),
  getVehiclePositionHistoryAction: vi.fn(),
}))

const INV_ID = 'inv-1'

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getVehiclePositionHistoryAction).mockResolvedValue(ok([]))
})

describe('useVehicleDetailPage — historique de positions', () => {
  it('charge l’historique au montage avec la plage par défaut', async () => {
    renderHook(() => useVehicleDetailPage(INV_ID, false))

    await waitFor(() => expect(getVehiclePositionHistoryAction).toHaveBeenCalledWith(INV_ID, '24h'))
  })

  it('recharge l’historique quand la plage change', async () => {
    const { result } = renderHook(() => useVehicleDetailPage(INV_ID, false))
    await waitFor(() => expect(getVehiclePositionHistoryAction).toHaveBeenCalledWith(INV_ID, '24h'))

    act(() => result.current.setTimeRange('7d'))

    await waitFor(() => expect(getVehiclePositionHistoryAction).toHaveBeenCalledWith(INV_ID, '7d'))
  })
})

describe('useVehicleDetailPage — lien du device', () => {
  it('passe isLinked à true et affiche la clé après une génération réussie', async () => {
    vi.mocked(linkDeviceAction).mockResolvedValue(ok({ apiKey: 'abc123' }))
    const { result } = renderHook(() => useVehicleDetailPage(INV_ID, false))

    await act(async () => result.current.handleGenerate())

    expect(result.current.isLinked).toBe(true)
    expect(result.current.newApiKey).toBe('abc123')
    expect(result.current.deviceError).toBeNull()
  })

  it('affiche une erreur sans changer isLinked si la génération échoue', async () => {
    vi.mocked(linkDeviceAction).mockResolvedValue(err('Accès non autorisé.'))
    const { result } = renderHook(() => useVehicleDetailPage(INV_ID, false))

    await act(async () => result.current.handleGenerate())

    expect(result.current.isLinked).toBe(false)
    expect(result.current.deviceError).toBe('Accès non autorisé.')
  })

  it('passe isLinked à false après une révocation réussie', async () => {
    vi.mocked(revokeDeviceAction).mockResolvedValue(ok(undefined))
    const { result } = renderHook(() => useVehicleDetailPage(INV_ID, true))

    await act(async () => result.current.handleRevoke())

    expect(result.current.isLinked).toBe(false)
    expect(result.current.newApiKey).toBeUndefined()
  })

  it('affiche une erreur sans changer isLinked si la révocation échoue', async () => {
    vi.mocked(revokeDeviceAction).mockResolvedValue(err('Erreur réseau.'))
    const { result } = renderHook(() => useVehicleDetailPage(INV_ID, true))

    await act(async () => result.current.handleRevoke())

    expect(result.current.isLinked).toBe(true)
    expect(result.current.deviceError).toBe('Erreur réseau.')
  })
})
