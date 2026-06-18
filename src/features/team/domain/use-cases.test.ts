import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listAdminAccountsUseCase, inviteAdminUseCase, removeAdminUseCase } from './use-cases'
import { teamRepository } from '../data/repository'
import * as emailService from '@/shared/lib/admin-email-service'
import type { AuthenticatedUser } from '@/shared/lib/auth'
import type { AdminAccount } from './types'

vi.mock('../data/repository', () => ({
  teamRepository: {
    listAdminAccounts: vi.fn(),
    createAdminAccount: vi.fn(),
    removeAdminAccount: vi.fn(),
    getAssociationName: vi.fn(),
  },
}))

vi.mock('@/shared/lib/admin-email-service', () => ({
  sendInvitationEmail: vi.fn(),
}))

const superadmin: AuthenticatedUser = { uid: 'sa-1', associationId: '', associationIds: [], role: 'superadmin' }
const admin: AuthenticatedUser = { uid: 'u-1', associationId: 'asso-1', associationIds: ['asso-1'], role: 'admin' }

const twoAccounts: AdminAccount[] = [
  { uid: 'u-1', email: 'admin1@b.com', createdAt: null },
  { uid: 'u-2', email: 'admin2@b.com', createdAt: null },
]

describe('listAdminAccountsUseCase', () => {
  beforeEach(() => vi.clearAllMocks())

  it("retourne une erreur si un admin tente d'accéder à une autre association", async () => {
    const result = await listAdminAccountsUseCase('autre-asso', admin)
    expect(result.ok).toBe(false)
    expect(teamRepository.listAdminAccounts).not.toHaveBeenCalled()
  })

  it("autorise un superadmin à accéder à n'importe quelle association", async () => {
    vi.mocked(teamRepository.listAdminAccounts).mockResolvedValue({ ok: true, value: [] })
    const result = await listAdminAccountsUseCase('autre-asso', superadmin)
    expect(result.ok).toBe(true)
    expect(teamRepository.listAdminAccounts).toHaveBeenCalledWith('autre-asso')
  })

  it('délègue au repository pour un admin accédant à sa propre association', async () => {
    vi.mocked(teamRepository.listAdminAccounts).mockResolvedValue({ ok: true, value: twoAccounts })
    const result = await listAdminAccountsUseCase('asso-1', admin)
    expect(result.ok).toBe(true)
    expect(teamRepository.listAdminAccounts).toHaveBeenCalledWith('asso-1')
  })
})

describe('inviteAdminUseCase', () => {
  beforeEach(() => vi.clearAllMocks())

  it("retourne une erreur si l'email est invalide", async () => {
    const result = await inviteAdminUseCase('pas-un-email', admin)
    expect(result.ok).toBe(false)
    expect(teamRepository.createAdminAccount).not.toHaveBeenCalled()
  })

  it('retourne une erreur si le compte est déjà admin de cette association', async () => {
    vi.mocked(teamRepository.listAdminAccounts).mockResolvedValue({ ok: true, value: twoAccounts })
    const result = await inviteAdminUseCase('admin1@b.com', admin)
    expect(result.ok).toBe(false)
    expect(teamRepository.createAdminAccount).not.toHaveBeenCalled()
  })

  it("propage l'erreur du repository si la création échoue", async () => {
    vi.mocked(teamRepository.listAdminAccounts).mockResolvedValue({ ok: true, value: [] })
    vi.mocked(teamRepository.createAdminAccount).mockResolvedValue({ ok: false, error: 'Un compte existe déjà avec cet email.' })
    const result = await inviteAdminUseCase('nouveau@b.com', admin)
    expect(result.ok).toBe(false)
    expect(emailService.sendInvitationEmail).not.toHaveBeenCalled()
  })

  it("envoie l'email d'invitation pour des données valides", async () => {
    vi.mocked(teamRepository.listAdminAccounts).mockResolvedValue({ ok: true, value: [] })
    vi.mocked(teamRepository.createAdminAccount).mockResolvedValue({ ok: true, value: { resetLink: 'https://reset' } })
    vi.mocked(teamRepository.getAssociationName).mockResolvedValue('Mon Asso')
    vi.mocked(emailService.sendInvitationEmail).mockResolvedValue()
    const result = await inviteAdminUseCase('nouveau@b.com', admin)
    expect(result.ok).toBe(true)
    expect(emailService.sendInvitationEmail).toHaveBeenCalledWith('nouveau@b.com', 'Mon Asso', 'https://reset', undefined)
  })

  it("retourne ok même si l'envoi d'email échoue (best-effort)", async () => {
    vi.mocked(teamRepository.listAdminAccounts).mockResolvedValue({ ok: true, value: [] })
    vi.mocked(teamRepository.createAdminAccount).mockResolvedValue({ ok: true, value: { resetLink: 'https://reset' } })
    vi.mocked(teamRepository.getAssociationName).mockResolvedValue('Mon Asso')
    vi.mocked(emailService.sendInvitationEmail).mockRejectedValue(new Error('timeout'))
    const result = await inviteAdminUseCase('nouveau@b.com', admin)
    expect(result.ok).toBe(true)
  })
})

describe('removeAdminUseCase', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retourne une erreur si on tente de supprimer son propre compte', async () => {
    const result = await removeAdminUseCase('u-1', admin)
    expect(result.ok).toBe(false)
    expect(teamRepository.listAdminAccounts).not.toHaveBeenCalled()
  })

  it("retourne une erreur si c'est le seul compte admin", async () => {
    vi.mocked(teamRepository.listAdminAccounts).mockResolvedValue({ ok: true, value: [twoAccounts[0]] })
    const result = await removeAdminUseCase('u-2', admin)
    expect(result.ok).toBe(false)
    expect(teamRepository.removeAdminAccount).not.toHaveBeenCalled()
  })

  it("retourne une erreur si le compte n'appartient pas à cette association", async () => {
    vi.mocked(teamRepository.listAdminAccounts).mockResolvedValue({ ok: true, value: twoAccounts })
    const result = await removeAdminUseCase('u-inconnu', admin)
    expect(result.ok).toBe(false)
    expect(teamRepository.removeAdminAccount).not.toHaveBeenCalled()
  })

  it('supprime le compte si toutes les conditions sont réunies', async () => {
    vi.mocked(teamRepository.listAdminAccounts).mockResolvedValue({ ok: true, value: twoAccounts })
    vi.mocked(teamRepository.removeAdminAccount).mockResolvedValue({ ok: true, value: undefined })
    const result = await removeAdminUseCase('u-2', admin)
    expect(result.ok).toBe(true)
    expect(teamRepository.removeAdminAccount).toHaveBeenCalledWith('u-2', 'asso-1')
  })
})
