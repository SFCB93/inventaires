import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadInventoryUseCase, submitControlUseCase } from './use-cases'
import { validatorRepository } from '../data/repository'
import type { ControlSubmission } from './types'

vi.mock('../data/repository', () => ({
  validatorRepository: {
    loadInventory: vi.fn(),
    saveControl: vi.fn(),
    getInventoryAssociationId: vi.fn(),
    getAssociationEmails: vi.fn(),
  },
}))

const mockInventoryResult = {
  ok: true as const,
  value: {
    inventory: { id: 'inv-1', name: 'VSL 42', associationId: 'asso-1' },
    compartments: [
      {
        id: 'emp-1',
        name: 'Poche avant',
        order: 1,
        items: [{ id: 'mat-1', name: 'Défibrillateur', photoUrl: '', hasExpiry: true, isCritical: true, order: 1 }],
      },
    ],
  },
}

const mockSubmission: ControlSubmission = {
  inventoryId: 'inv-1',
  verifierName: 'Jean Dupont',
  results: [
    { itemId: 'mat-1', compartmentId: 'emp-1', status: 'present', expiryDate: '2025-12-31' },
  ],
}

describe('loadInventoryUseCase', () => {
  beforeEach(() => vi.clearAllMocks())

  it("retourne l'inventaire et ses emplacements quand tout se passe bien", async () => {
    vi.mocked(validatorRepository.loadInventory).mockResolvedValue(mockInventoryResult)
    const result = await loadInventoryUseCase('inv-1')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.inventory.name).toBe('VSL 42')
      expect(result.value.compartments).toHaveLength(1)
    }
  })

  it("retourne une erreur si l'identifiant est vide", async () => {
    const result = await loadInventoryUseCase('   ')
    expect(result.ok).toBe(false)
    expect(validatorRepository.loadInventory).not.toHaveBeenCalled()
  })

  it("propage l'erreur du repository", async () => {
    vi.mocked(validatorRepository.loadInventory).mockResolvedValue({
      ok: false,
      error: "Cet inventaire n'existe pas ou a été supprimé.",
    })
    const result = await loadInventoryUseCase('inv-inconnu')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain("n'existe pas")
  })
})

describe('submitControlUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(validatorRepository.saveControl).mockResolvedValue({
      ok: true,
      value: { controlId: 'ctrl-1' },
    })
  })

  it("retourne le controlId après une soumission réussie", async () => {
    const result = await submitControlUseCase(mockSubmission, 'VSL 42', 'asso-1')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.controlId).toBe('ctrl-1')
  })

  it("retourne une erreur si le nom du vérificateur est vide", async () => {
    const result = await submitControlUseCase({ ...mockSubmission, verifierName: '   ' }, 'VSL 42', 'asso-1')
    expect(result.ok).toBe(false)
    expect(validatorRepository.saveControl).not.toHaveBeenCalled()
  })

  it("retourne une erreur si les résultats sont vides", async () => {
    const result = await submitControlUseCase({ ...mockSubmission, results: [] }, 'VSL 42', 'asso-1')
    expect(result.ok).toBe(false)
    expect(validatorRepository.saveControl).not.toHaveBeenCalled()
  })

  it("propage l'erreur du repository si la sauvegarde échoue", async () => {
    vi.mocked(validatorRepository.saveControl).mockResolvedValue({
      ok: false,
      error: "Impossible d'enregistrer le contrôle.",
    })
    const result = await submitControlUseCase(mockSubmission, 'VSL 42', 'asso-1')
    expect(result.ok).toBe(false)
  })
})
