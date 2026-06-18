import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAssociationSettingsUseCase, updateAssociationSettingsUseCase, sendPasswordResetUseCase } from './use-cases'
import { settingsRepository } from '../data/repository'
import * as emailService from './email-service'
import type { AuthenticatedUser } from '@/shared/lib/auth'

vi.mock('../data/repository', () => ({
  settingsRepository: {
    getAssociationSettings: vi.fn(),
    updateAssociationSettings: vi.fn(),
    generatePasswordReset: vi.fn(),
  },
}))

vi.mock('./email-service', () => ({
  sendPasswordResetEmail: vi.fn(),
}))

const superadmin: AuthenticatedUser = { uid: 'sa-1', associationId: '', associationIds: [], role: 'superadmin' }
const admin: AuthenticatedUser = { uid: 'u-1', associationId: 'asso-1', associationIds: ['asso-1'], role: 'admin' }

const mockSettings = {
  name: 'Asso',
  notificationEmails: [],
  alertThresholdDays: 30,
  alertIntervalDays: 7,
}

describe('getAssociationSettingsUseCase', () => {
  beforeEach(() => vi.clearAllMocks())

  it("retourne une erreur si l'associationId est vide", async () => {
    const result = await getAssociationSettingsUseCase('', admin)
    expect(result.ok).toBe(false)
    expect(settingsRepository.getAssociationSettings).not.toHaveBeenCalled()
  })

  it("retourne une erreur si l'admin tente d'accéder à une autre association", async () => {
    const result = await getAssociationSettingsUseCase('autre-asso', admin)
    expect(result.ok).toBe(false)
    expect(settingsRepository.getAssociationSettings).not.toHaveBeenCalled()
  })

  it("autorise un superadmin à accéder à n'importe quelle association", async () => {
    vi.mocked(settingsRepository.getAssociationSettings).mockResolvedValue({ ok: true, value: mockSettings })
    const result = await getAssociationSettingsUseCase('autre-asso', superadmin)
    expect(result.ok).toBe(true)
    expect(settingsRepository.getAssociationSettings).toHaveBeenCalledWith('autre-asso')
  })

  it('délègue au repository pour un admin accédant à sa propre association', async () => {
    vi.mocked(settingsRepository.getAssociationSettings).mockResolvedValue({ ok: true, value: mockSettings })
    await getAssociationSettingsUseCase('asso-1', admin)
    expect(settingsRepository.getAssociationSettings).toHaveBeenCalledWith('asso-1')
  })
})

describe('updateAssociationSettingsUseCase', () => {
  const data = { name: 'Nouvelle asso', notificationEmails: ['a@b.com'], alertThresholdDays: 30, alertIntervalDays: 7 }

  beforeEach(() => vi.clearAllMocks())

  it("retourne une erreur si l'associationId est vide", async () => {
    const result = await updateAssociationSettingsUseCase('', data, admin)
    expect(result.ok).toBe(false)
    expect(settingsRepository.updateAssociationSettings).not.toHaveBeenCalled()
  })

  it("retourne une erreur si l'admin tente de modifier une autre association", async () => {
    const result = await updateAssociationSettingsUseCase('autre-asso', data, admin)
    expect(result.ok).toBe(false)
    expect(settingsRepository.updateAssociationSettings).not.toHaveBeenCalled()
  })

  it("retourne une erreur si le nom est vide", async () => {
    const result = await updateAssociationSettingsUseCase('asso-1', { ...data, name: '' }, admin)
    expect(result.ok).toBe(false)
    expect(settingsRepository.updateAssociationSettings).not.toHaveBeenCalled()
  })

  it("autorise une liste d'emails vide (notifications désactivées)", async () => {
    vi.mocked(settingsRepository.updateAssociationSettings).mockResolvedValue({ ok: true, value: undefined })
    const result = await updateAssociationSettingsUseCase('asso-1', { ...data, notificationEmails: [] }, admin)
    expect(result.ok).toBe(true)
  })

  it('délègue au repository pour des données valides', async () => {
    vi.mocked(settingsRepository.updateAssociationSettings).mockResolvedValue({ ok: true, value: undefined })
    await updateAssociationSettingsUseCase('asso-1', data, admin)
    expect(settingsRepository.updateAssociationSettings).toHaveBeenCalledWith('asso-1', data)
  })

  it("propage l'erreur du repository", async () => {
    vi.mocked(settingsRepository.updateAssociationSettings).mockResolvedValue({ ok: false, error: 'Firestore indisponible' })
    const result = await updateAssociationSettingsUseCase('asso-1', data, admin)
    expect(result.ok).toBe(false)
  })
})

describe('sendPasswordResetUseCase', () => {
  beforeEach(() => vi.clearAllMocks())

  it("retourne une erreur si la génération du lien échoue", async () => {
    vi.mocked(settingsRepository.generatePasswordReset).mockResolvedValue({ ok: false, error: 'Compte introuvable.' })
    vi.mocked(settingsRepository.getAssociationSettings).mockResolvedValue({ ok: true, value: mockSettings })
    const result = await sendPasswordResetUseCase(admin)
    expect(result.ok).toBe(false)
    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled()
  })

  it("envoie l'email de reset pour un utilisateur valide", async () => {
    vi.mocked(settingsRepository.generatePasswordReset).mockResolvedValue({ ok: true, value: { email: 'u@b.com', resetLink: 'https://reset' } })
    vi.mocked(settingsRepository.getAssociationSettings).mockResolvedValue({ ok: true, value: mockSettings })
    vi.mocked(emailService.sendPasswordResetEmail).mockResolvedValue()
    const result = await sendPasswordResetUseCase(admin)
    expect(result.ok).toBe(true)
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith('u@b.com', 'Asso', 'https://reset')
  })

  it("retourne ok même si l'envoi d'email échoue (best-effort)", async () => {
    vi.mocked(settingsRepository.generatePasswordReset).mockResolvedValue({ ok: true, value: { email: 'u@b.com', resetLink: 'https://reset' } })
    vi.mocked(settingsRepository.getAssociationSettings).mockResolvedValue({ ok: true, value: mockSettings })
    vi.mocked(emailService.sendPasswordResetEmail).mockRejectedValue(new Error('timeout'))
    const result = await sendPasswordResetUseCase(admin)
    expect(result.ok).toBe(true)
  })
})
