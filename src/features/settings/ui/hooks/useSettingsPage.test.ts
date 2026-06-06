import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSettingsPage } from './useSettingsPage'
import { updateAssociationSettingsAction } from '../../domain/actions'

vi.mock('../../domain/actions', () => ({
  updateAssociationSettingsAction: vi.fn(),
  sendPasswordResetAction: vi.fn(),
}))

const initial = {
  name: 'Mon asso',
  notificationEmails: ['resp@asso.fr'],
  alertThresholdDays: 30,
  alertIntervalDays: 7,
}

describe('useSettingsPage — emails', () => {
  beforeEach(() => vi.clearAllMocks())

  it("affiche une erreur si l'email ajouté est invalide", () => {
    const { result } = renderHook(() => useSettingsPage(initial))
    act(() => result.current.setNewEmail('pas-un-email'))
    act(() => result.current.addEmail())
    expect(result.current.emailError).toBeDefined()
    expect(result.current.emails).toEqual(initial.notificationEmails)
  })

  it("affiche une erreur si l'email est déjà dans la liste", () => {
    const { result } = renderHook(() => useSettingsPage(initial))
    act(() => result.current.setNewEmail('resp@asso.fr'))
    act(() => result.current.addEmail())
    expect(result.current.emailError).toBeDefined()
    expect(result.current.emails).toHaveLength(1)
  })

  it("ajoute un email valide et déclenche la sauvegarde automatique", async () => {
    vi.mocked(updateAssociationSettingsAction).mockResolvedValue({ ok: true, value: undefined })
    const { result } = renderHook(() => useSettingsPage(initial))
    act(() => result.current.setNewEmail('nouveau@asso.fr'))
    await act(async () => result.current.addEmail())
    expect(result.current.emails).toContain('nouveau@asso.fr')
    expect(result.current.newEmail).toBe('')
    expect(result.current.emailError).toBeUndefined()
    expect(updateAssociationSettingsAction).toHaveBeenCalled()
  })

  it("retire un email et déclenche la sauvegarde automatique", async () => {
    vi.mocked(updateAssociationSettingsAction).mockResolvedValue({ ok: true, value: undefined })
    const { result } = renderHook(() => useSettingsPage(initial))
    await act(async () => result.current.removeEmail('resp@asso.fr'))
    expect(result.current.emails).toEqual([])
    expect(updateAssociationSettingsAction).toHaveBeenCalled()
  })
})

describe('useSettingsPage — saveName', () => {
  beforeEach(() => vi.clearAllMocks())

  it("appelle l'action avec les bonnes données", async () => {
    vi.mocked(updateAssociationSettingsAction).mockResolvedValue({ ok: true, value: undefined })
    const { result } = renderHook(() => useSettingsPage(initial))
    await act(async () => result.current.saveName())
    expect(updateAssociationSettingsAction).toHaveBeenCalledWith({
      name: 'Mon asso',
      notificationEmails: ['resp@asso.fr'],
      alertThresholdDays: 30,
      alertIntervalDays: 7,
    })
  })

  it("définit nameSuccess à true après une sauvegarde réussie", async () => {
    vi.mocked(updateAssociationSettingsAction).mockResolvedValue({ ok: true, value: undefined })
    const { result } = renderHook(() => useSettingsPage(initial))
    await act(async () => result.current.saveName())
    expect(result.current.nameSuccess).toBe(true)
    expect(result.current.nameError).toBeUndefined()
  })

  it("affiche un message d'erreur si la sauvegarde échoue", async () => {
    vi.mocked(updateAssociationSettingsAction).mockResolvedValue({ ok: false, error: 'Erreur réseau' })
    const { result } = renderHook(() => useSettingsPage(initial))
    await act(async () => result.current.saveName())
    expect(result.current.nameError).toBe('Erreur réseau')
    expect(result.current.nameSuccess).toBe(false)
  })
})

describe('useSettingsPage — saveAlerts', () => {
  beforeEach(() => vi.clearAllMocks())

  it("définit alertsSuccess à true après une sauvegarde réussie", async () => {
    vi.mocked(updateAssociationSettingsAction).mockResolvedValue({ ok: true, value: undefined })
    const { result } = renderHook(() => useSettingsPage(initial))
    await act(async () => result.current.saveAlerts())
    expect(result.current.alertsSuccess).toBe(true)
    expect(result.current.alertsError).toBeUndefined()
  })

  it("affiche un message d'erreur si la sauvegarde échoue", async () => {
    vi.mocked(updateAssociationSettingsAction).mockResolvedValue({ ok: false, error: 'Firestore indisponible' })
    const { result } = renderHook(() => useSettingsPage(initial))
    await act(async () => result.current.saveAlerts())
    expect(result.current.alertsError).toBe('Firestore indisponible')
    expect(result.current.alertsSuccess).toBe(false)
  })
})
