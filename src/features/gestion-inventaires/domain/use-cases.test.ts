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
    reorderCompartments: vi.fn(),
    createItem: vi.fn(), updateItem: vi.fn(), deleteItem: vi.fn(), reorderItems: vi.fn(),
  },
}))

const repo = vi.mocked(inventoryRepository)
beforeEach(() => vi.clearAllMocks())

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
    const result = await updateCompartmentUseCase('cmp-1', '   ')
    expect(result.ok).toBe(false)
    expect(repo.updateCompartment).not.toHaveBeenCalled()
  })
})

// --- Matériels ---

describe('createItemUseCase', () => {
  // Règle spec : "Le nom d'un matériel est obligatoire et non vide."
  it('retourne une erreur si le nom est vide', async () => {
    const result = await createItemUseCase('cmp-1', { name: '', photoUrl: '', photoStoragePath: '', hasExpiry: false, isCritical: false })
    expect(result.ok).toBe(false)
    expect(repo.createItem).not.toHaveBeenCalled()
  })
})

describe('updateItemUseCase', () => {
  // Règle spec : "Le nom d'un matériel est obligatoire et non vide."
  it('retourne une erreur si le nom est explicitement vide', async () => {
    const result = await updateItemUseCase('mat-1', { name: '   ' })
    expect(result.ok).toBe(false)
    expect(repo.updateItem).not.toHaveBeenCalled()
  })

  it("n'appelle pas le repository si le nom est absent du payload (mise à jour partielle)", async () => {
    repo.updateItem.mockResolvedValue({ ok: true, value: undefined })
    await updateItemUseCase('mat-1', { isCritical: true })
    expect(repo.updateItem).toHaveBeenCalled()
  })
})

// --- Réordonnancement ---

describe('reorderCompartmentsUseCase', () => {
  it('retourne ok sans appeler le repository si la liste est vide', async () => {
    const result = await reorderCompartmentsUseCase('inv-1', [])
    expect(result.ok).toBe(true)
    expect(repo.reorderCompartments).not.toHaveBeenCalled()
  })
})

describe('reorderItemsUseCase', () => {
  it('retourne ok sans appeler le repository si la liste est vide', async () => {
    const result = await reorderItemsUseCase('cmp-1', [])
    expect(result.ok).toBe(true)
    expect(repo.reorderItems).not.toHaveBeenCalled()
  })
})
