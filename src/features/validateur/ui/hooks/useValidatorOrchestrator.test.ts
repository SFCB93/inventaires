import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useValidatorOrchestrator } from './useValidatorOrchestrator'
import { useValidatorStore } from './useValidatorStore'
import { submitControlAction } from '../../domain/actions'

vi.mock('../../domain/actions', () => ({
  submitControlAction: vi.fn(),
}))

const inventory = { id: 'inv-1', name: 'VSL 42', associationId: 'asso-1' }

const compartments = [
  {
    id: 'emp-1',
    name: 'Poche avant',
    order: 1,
    items: [
      { id: 'mat-1', name: 'SHA', photoUrl: '', hasExpiry: true, isCritical: true, order: 1 },
      { id: 'mat-2', name: 'Gants', photoUrl: '', hasExpiry: false, isCritical: false, order: 2 },
    ],
  },
  {
    id: 'emp-2',
    name: 'Poche arrière',
    order: 2,
    items: [
      { id: 'mat-3', name: 'Brancard', photoUrl: '', hasExpiry: false, isCritical: false, order: 1 },
    ],
  },
]

describe('useValidatorOrchestrator — avancement', () => {
  beforeEach(() => {
    useValidatorStore.getState().init('')
    vi.clearAllMocks()
  })

  it('avance au matériel suivant dans le même emplacement', () => {
    const { result } = renderHook(() => useValidatorOrchestrator(inventory, compartments))

    expect(result.current.currentItem?.id).toBe('mat-1')

    act(() => { result.current.recordResult({ status: 'present' }) })

    expect(result.current.currentItem?.id).toBe('mat-2')
  })

  it("avance à l'emplacement suivant après le dernier matériel d'un emplacement", () => {
    const { result } = renderHook(() => useValidatorOrchestrator(inventory, compartments))

    act(() => { result.current.recordResult({ status: 'present' }) })
    act(() => { result.current.recordResult({ status: 'present' }) })

    expect(result.current.currentCompartment?.id).toBe('emp-2')
    expect(result.current.currentItem?.id).toBe('mat-3')
  })

  it("passe à l'étape summary après le dernier matériel du dernier emplacement", () => {
    const { result } = renderHook(() => useValidatorOrchestrator(inventory, compartments))

    act(() => { result.current.recordResult({ status: 'present' }) })
    act(() => { result.current.recordResult({ status: 'present' }) })
    act(() => { result.current.recordResult({ status: 'present' }) })

    expect(result.current.step).toBe('summary')
  })

  it('ignore les emplacements vides dans la progression', () => {
    const withEmptyCompartment = [
      { id: 'emp-empty', name: 'Vide', order: 1, items: [] },
      ...compartments,
    ]
    const { result } = renderHook(() => useValidatorOrchestrator(inventory, withEmptyCompartment))

    expect(result.current.totalCompartments).toBe(2)
    expect(result.current.currentCompartment?.id).toBe('emp-1')
  })
})

describe('useValidatorOrchestrator — soumission et retry', () => {
  beforeEach(() => {
    useValidatorStore.getState().init('')
    vi.clearAllMocks()
  })

  it('conserve les résultats après un échec de soumission (retry possible)', async () => {
    vi.mocked(submitControlAction).mockResolvedValue({ error: 'Erreur réseau' })
    const { result } = renderHook(() => useValidatorOrchestrator(inventory, compartments))

    act(() => { result.current.recordResult({ status: 'present' }) })
    act(() => { result.current.recordResult({ status: 'present' }) })
    act(() => { result.current.recordResult({ status: 'present' }) })

    await act(async () => { await result.current.handleSubmit('Jean Dupont') })

    expect(result.current.submissionError).toBeTruthy()
    expect(result.current.results).toHaveLength(3)
    expect(result.current.step).toBe('summary')
  })

  it("passe à l'étape confirmation après une soumission réussie", async () => {
    vi.mocked(submitControlAction).mockResolvedValue({ controlId: 'ctrl-1' })
    const { result } = renderHook(() => useValidatorOrchestrator(inventory, compartments))

    act(() => { result.current.recordResult({ status: 'present' }) })
    act(() => { result.current.recordResult({ status: 'present' }) })
    act(() => { result.current.recordResult({ status: 'present' }) })

    await act(async () => { await result.current.handleSubmit('Jean Dupont') })

    expect(result.current.step).toBe('confirmation')
    expect(result.current.submissionError).toBeUndefined()
  })
})
