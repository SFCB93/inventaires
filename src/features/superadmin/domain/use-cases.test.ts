import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listAssociationsUseCase, createAssociationUseCase } from './use-cases'
import { superadminRepository } from '../data/repository'
import * as emailService from '@/shared/lib/admin-email-service'
import type { AuthenticatedUser } from '@/shared/lib/auth'

vi.mock('../data/repository', () => ({
  superadminRepository: {
    listAssociations: vi.fn(),
    createAssociation: vi.fn(),
  },
}))

vi.mock('@/shared/lib/admin-email-service', () => ({
  sendInvitationEmail: vi.fn(),
}))

const superadmin: AuthenticatedUser = { uid: 'sa-1', associationId: '', role: 'superadmin' }
const admin: AuthenticatedUser = { uid: 'u-1', associationId: 'asso-1', role: 'admin' }

describe('listAssociationsUseCase', () => {
  beforeEach(() => vi.clearAllMocks())

  it("retourne une erreur si l'utilisateur n'est pas superadmin", async () => {
    const result = await listAssociationsUseCase(admin)
    expect(result.ok).toBe(false)
    expect(superadminRepository.listAssociations).not.toHaveBeenCalled()
  })

  it('délègue au repository pour un superadmin', async () => {
    vi.mocked(superadminRepository.listAssociations).mockResolvedValue({ ok: true, value: [] })
    const result = await listAssociationsUseCase(superadmin)
    expect(result.ok).toBe(true)
    expect(superadminRepository.listAssociations).toHaveBeenCalled()
  })

  it("propage l'erreur du repository", async () => {
    vi.mocked(superadminRepository.listAssociations).mockResolvedValue({ ok: false, error: 'Firestore indisponible' })
    const result = await listAssociationsUseCase(superadmin)
    expect(result.ok).toBe(false)
  })
})

describe('createAssociationUseCase', () => {
  beforeEach(() => vi.clearAllMocks())

  it("retourne une erreur si l'utilisateur n'est pas superadmin", async () => {
    const result = await createAssociationUseCase({ name: 'Asso', adminEmail: 'a@b.com' }, admin)
    expect(result.ok).toBe(false)
    expect(superadminRepository.createAssociation).not.toHaveBeenCalled()
  })

  it("retourne une erreur si le nom est vide", async () => {
    const result = await createAssociationUseCase({ name: '   ', adminEmail: 'a@b.com' }, superadmin)
    expect(result.ok).toBe(false)
    expect(superadminRepository.createAssociation).not.toHaveBeenCalled()
  })

  it("retourne une erreur si l'email est invalide", async () => {
    const result = await createAssociationUseCase({ name: 'Asso', adminEmail: 'pas-un-email' }, superadmin)
    expect(result.ok).toBe(false)
    expect(superadminRepository.createAssociation).not.toHaveBeenCalled()
  })

  it("retourne ok et envoie l'email d'invitation pour des données valides", async () => {
    vi.mocked(superadminRepository.createAssociation).mockResolvedValue({ ok: true, value: { resetLink: 'https://reset' } })
    vi.mocked(emailService.sendInvitationEmail).mockResolvedValue()
    const result = await createAssociationUseCase({ name: 'Asso', adminEmail: 'a@b.com' }, superadmin)
    expect(result.ok).toBe(true)
    expect(emailService.sendInvitationEmail).toHaveBeenCalledWith('a@b.com', 'Asso', 'https://reset', undefined)
  })

  it("retourne ok même si l'envoi d'email échoue (best-effort)", async () => {
    vi.mocked(superadminRepository.createAssociation).mockResolvedValue({ ok: true, value: { resetLink: 'https://reset' } })
    vi.mocked(emailService.sendInvitationEmail).mockRejectedValue(new Error('timeout'))
    const result = await createAssociationUseCase({ name: 'Asso', adminEmail: 'a@b.com' }, superadmin)
    expect(result.ok).toBe(true)
  })

  it("propage l'erreur du repository", async () => {
    vi.mocked(superadminRepository.createAssociation).mockResolvedValue({ ok: false, error: 'Impossible de créer.' })
    const result = await createAssociationUseCase({ name: 'Asso', adminEmail: 'a@b.com' }, superadmin)
    expect(result.ok).toBe(false)
    expect(emailService.sendInvitationEmail).not.toHaveBeenCalled()
  })
})
