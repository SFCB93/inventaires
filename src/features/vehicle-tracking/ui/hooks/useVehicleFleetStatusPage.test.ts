import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ok, err } from '@/shared/domain/result'
import { useVehicleFleetStatusPage } from './useVehicleFleetStatusPage'
import { linkDeviceAction, listUnlinkedInventoriesAction } from '../../domain/actions'

const push = vi.fn()
const refresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}))

vi.mock('../../domain/actions', () => ({
  linkDeviceAction: vi.fn(),
  listUnlinkedInventoriesAction: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useVehicleFleetStatusPage — ouverture de la modale d’ajout', () => {
  it('charge les candidats et les expose', async () => {
    vi.mocked(listUnlinkedInventoriesAction).mockResolvedValue(ok([{ inventoryId: 'inv-1', name: 'Fourgon' }]))
    const { result } = renderHook(() => useVehicleFleetStatusPage())

    await act(async () => result.current.openAdd())

    expect(result.current.isAddOpen).toBe(true)
    expect(result.current.candidates).toEqual([{ inventoryId: 'inv-1', name: 'Fourgon' }])
    expect(result.current.loadError).toBeUndefined()
  })

  it('affiche une erreur de chargement distincte, sans la confondre avec une liste vide', async () => {
    vi.mocked(listUnlinkedInventoriesAction).mockResolvedValue(err('Firestore indisponible.'))
    const { result } = renderHook(() => useVehicleFleetStatusPage())

    await act(async () => result.current.openAdd())

    expect(result.current.loadError).toBe('Firestore indisponible.')
    expect(result.current.candidates).toEqual([])
  })
})

describe('useVehicleFleetStatusPage — génération de la clé', () => {
  it('affiche la clé générée après succès', async () => {
    vi.mocked(listUnlinkedInventoriesAction).mockResolvedValue(ok([]))
    vi.mocked(linkDeviceAction).mockResolvedValue(ok({ apiKey: 'abc123' }))
    const { result } = renderHook(() => useVehicleFleetStatusPage())
    await act(async () => result.current.openAdd())

    await act(async () => result.current.handleAdd('inv-1'))

    expect(result.current.newApiKey).toBe('abc123')
    expect(result.current.error).toBeUndefined()
  })

  it('affiche une erreur si la génération échoue', async () => {
    vi.mocked(listUnlinkedInventoriesAction).mockResolvedValue(ok([]))
    vi.mocked(linkDeviceAction).mockResolvedValue(err('Accès non autorisé.'))
    const { result } = renderHook(() => useVehicleFleetStatusPage())
    await act(async () => result.current.openAdd())

    await act(async () => result.current.handleAdd('inv-1'))

    expect(result.current.error).toBe('Accès non autorisé.')
    expect(result.current.newApiKey).toBeUndefined()
  })

  it('rafraîchit la liste à la fermeture uniquement si une clé a été générée', async () => {
    vi.mocked(listUnlinkedInventoriesAction).mockResolvedValue(ok([]))
    vi.mocked(linkDeviceAction).mockResolvedValue(ok({ apiKey: 'abc123' }))
    const { result } = renderHook(() => useVehicleFleetStatusPage())
    await act(async () => result.current.openAdd())
    await act(async () => result.current.handleAdd('inv-1'))

    act(() => result.current.closeAdd())

    expect(refresh).toHaveBeenCalled()
  })

  it('ne rafraîchit pas la liste à la fermeture si aucune clé n’a été générée', async () => {
    vi.mocked(listUnlinkedInventoriesAction).mockResolvedValue(ok([]))
    const { result } = renderHook(() => useVehicleFleetStatusPage())
    await act(async () => result.current.openAdd())

    act(() => result.current.closeAdd())

    expect(refresh).not.toHaveBeenCalled()
  })
})

describe('useVehicleFleetStatusPage — navigation', () => {
  it('navigue vers la page détail du véhicule sélectionné', () => {
    const { result } = renderHook(() => useVehicleFleetStatusPage())

    act(() => result.current.goToVehicle('inv-1'))

    expect(push).toHaveBeenCalledWith('/dashboard/vehicules/inv-1')
  })
})
