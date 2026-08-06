import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createInventoryUseCase, updateInventoryUseCase, deleteInventoryUseCase,
  createCompartmentUseCase, updateCompartmentUseCase,
  createItemUseCase, updateItemUseCase,
  reorderCompartmentsUseCase, reorderItemsUseCase,
} from './use-cases'
import { inventoryRepository } from '../data/repository'

vi.mock('../data/repository', () => ({
  inventoryRepository: {
    listInventories: vi.fn(), getInventory: vi.fn(),
    createInventory: vi.fn(), updateInventory: vi.fn(), deleteInventory: vi.fn(),
    createCompartment: vi.fn(), updateCompartment: vi.fn(), deleteCompartment: vi.fn(),
    reorderCompartments: vi.fn(), checkCompartmentOwnership: vi.fn(), checkCompartmentIdsOwnership: vi.fn(),
    createItem: vi.fn(), updateItem: vi.fn(), deleteItem: vi.fn(), reorderItems: vi.fn(),
    checkItemOwnership: vi.fn(), checkItemIdsOwnership: vi.fn(),
  },
}))

const repo = vi.mocked(inventoryRepository)
beforeEach(() => {
  vi.clearAllMocks()
  repo.checkCompartmentOwnership.mockResolvedValue({ ok: true, value: undefined })
  repo.checkCompartmentIdsOwnership.mockResolvedValue({ ok: true, value: undefined })
  repo.checkItemOwnership.mockResolvedValue({ ok: true, value: undefined })
  repo.checkItemIdsOwnership.mockResolvedValue({ ok: true, value: undefined })
})

// --- Inventaires ---

describe('createInventoryUseCase', () => {
  // Règle spec : "Le nom d'un inventaire est obligatoire et non vide."
  it('retourne une erreur si le nom ne contient que des espaces', async () => {
    const result = await createInventoryUseCase('asso-1', '   ')
    expect(result.ok).toBe(false)
    expect(repo.createInventory).not.toHaveBeenCalled()
  })
})

describe('updateInventoryUseCase', () => {
  // Règle spec : "Le nom d'un inventaire est obligatoire et non vide."
  it('retourne une erreur si le nom est vide', async () => {
    const result = await updateInventoryUseCase('inv-1', 'asso-1', '')
    expect(result.ok).toBe(false)
    expect(repo.updateInventory).not.toHaveBeenCalled()
  })

  it("propage l'erreur du repository (accès non autorisé)", async () => {
    repo.updateInventory.mockResolvedValue({ ok: false, error: 'Accès non autorisé.' })
    const result = await updateInventoryUseCase('inv-1', 'asso-1', 'Nouveau nom')
    expect(result.ok).toBe(false)
    expect((result as { ok: false; error: string }).error).toBe('Accès non autorisé.')
  })
})

describe('deleteInventoryUseCase', () => {
  it("propage l'erreur du repository (accès non autorisé)", async () => {
    repo.deleteInventory.mockResolvedValue({ ok: false, error: 'Accès non autorisé.' })
    const result = await deleteInventoryUseCase('inv-1', 'asso-1')
    expect(result.ok).toBe(false)
  })
})

// --- Emplacements ---

describe('createCompartmentUseCase', () => {
  // Règle spec : "Le nom d'un emplacement est obligatoire et non vide."
  it('retourne une erreur si le nom est vide', async () => {
    const result = await createCompartmentUseCase('inv-1', '')
    expect(result.ok).toBe(false)
    expect(repo.createCompartment).not.toHaveBeenCalled()
  })
})

describe('updateCompartmentUseCase', () => {
  // Règle spec : "Le nom d'un emplacement est obligatoire et non vide."
  it('retourne une erreur si le nom ne contient que des espaces', async () => {
    const result = await updateCompartmentUseCase('inv-1', 'cmp-1', '   ')
    expect(result.ok).toBe(false)
    expect(repo.updateCompartment).not.toHaveBeenCalled()
  })

  it("refuse la mutation si l'emplacement n'appartient pas à l'inventaire", async () => {
    repo.checkCompartmentOwnership.mockResolvedValue({ ok: false, error: 'Accès non autorisé.' })
    const result = await updateCompartmentUseCase('inv-1', 'cmp-1', 'Nouveau nom')
    expect(result.ok).toBe(false)
    expect(repo.updateCompartment).not.toHaveBeenCalled()
  })
})

// --- Matériels ---

describe('createItemUseCase', () => {
  // Règle spec : "Le nom d'un matériel est obligatoire et non vide."
  it('retourne une erreur si le nom est vide', async () => {
    const result = await createItemUseCase('inv-1', 'cmp-1', { name: '', photoUrl: '', hasExpiry: false, isCritical: false })
    expect(result.ok).toBe(false)
    expect(repo.createItem).not.toHaveBeenCalled()
  })

  it("refuse la création si l'emplacement n'appartient pas à l'inventaire", async () => {
    repo.checkCompartmentOwnership.mockResolvedValue({ ok: false, error: 'Accès non autorisé.' })
    const result = await createItemUseCase('inv-1', 'cmp-1', { name: 'Gaze', photoUrl: '', hasExpiry: false, isCritical: false })
    expect(result.ok).toBe(false)
    expect(repo.createItem).not.toHaveBeenCalled()
  })
})

describe('updateItemUseCase', () => {
  // Règle spec : "Le nom d'un matériel est obligatoire et non vide."
  it('retourne une erreur si le nom est explicitement vide', async () => {
    const result = await updateItemUseCase('inv-1', 'mat-1', { name: '   ' })
    expect(result.ok).toBe(false)
    expect(repo.updateItem).not.toHaveBeenCalled()
  })

  it("n'appelle pas le repository si le nom est absent du payload (mise à jour partielle)", async () => {
    repo.updateItem.mockResolvedValue({ ok: true, value: undefined })
    await updateItemUseCase('inv-1', 'mat-1', { isCritical: true })
    expect(repo.updateItem).toHaveBeenCalled()
  })

  it("refuse la mutation si le matériel n'appartient pas à l'inventaire", async () => {
    repo.checkItemOwnership.mockResolvedValue({ ok: false, error: 'Accès non autorisé.' })
    const result = await updateItemUseCase('inv-1', 'mat-1', { isCritical: true })
    expect(result.ok).toBe(false)
    expect(repo.updateItem).not.toHaveBeenCalled()
  })
})

// --- Réordonnancement ---

describe('reorderCompartmentsUseCase', () => {
  it('retourne ok sans appeler le repository si la liste est vide', async () => {
    const result = await reorderCompartmentsUseCase('inv-1', [])
    expect(result.ok).toBe(true)
    expect(repo.reorderCompartments).not.toHaveBeenCalled()
  })

  it("refuse le réordonnancement si un id n'appartient pas à l'inventaire", async () => {
    repo.checkCompartmentIdsOwnership.mockResolvedValue({ ok: false, error: 'Accès non autorisé.' })
    const result = await reorderCompartmentsUseCase('inv-1', ['cmp-1', 'cmp-2'])
    expect(result.ok).toBe(false)
    expect(repo.reorderCompartments).not.toHaveBeenCalled()
  })
})

describe('reorderItemsUseCase', () => {
  it('retourne ok sans appeler le repository si la liste est vide', async () => {
    const result = await reorderItemsUseCase('inv-1', 'cmp-1', [])
    expect(result.ok).toBe(true)
    expect(repo.reorderItems).not.toHaveBeenCalled()
  })

  it("refuse le réordonnancement si un id n'appartient pas à l'emplacement", async () => {
    repo.checkItemIdsOwnership.mockResolvedValue({ ok: false, error: 'Accès non autorisé.' })
    const result = await reorderItemsUseCase('inv-1', 'cmp-1', ['mat-1', 'mat-2'])
    expect(result.ok).toBe(false)
    expect(repo.reorderItems).not.toHaveBeenCalled()
  })
})
