'use client'

import Link from 'next/link'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { InventoryWithCompartments } from '../domain/types'
import type { ItemFormValues } from './ItemForm'
import { useInventoryDetail } from './hooks/useInventoryDetail'
import { CompartmentSection } from './CompartmentSection'
import { CreateCompartmentForm } from './CreateCompartmentForm'
import { DeleteConfirmDialog } from '@/shared/ui/DeleteConfirmDialog'
import { QrCodeButton } from './QrCodeButton'

interface InventoryDetailProps {
  inventory: InventoryWithCompartments
  onShowQrCode: () => void
  onRenameInventory: (name: string) => void
  onDeleteInventory: () => void
  onAddCompartment: (name: string) => void
  onRenameCompartment: (compartmentId: string, name: string) => void
  onDeleteCompartment: (compartmentId: string) => void
  onReorderCompartments: (inventoryId: string, orderedIds: string[]) => void
  onAddItem: (compartmentId: string, values: ItemFormValues) => void
  onEditItem: (itemId: string, values: ItemFormValues) => void
  onDeleteItem: (itemId: string) => void
  onReorderItems: (compartmentId: string, orderedIds: string[]) => void
}

export function InventoryDetail(props: InventoryDetailProps) {
  const { inventory, onShowQrCode, onAddCompartment, onRenameCompartment, onDeleteCompartment, onAddItem, onEditItem, onDeleteItem, onReorderItems } = props
  const {
    localCompartments,
    isEditingName, setIsEditingName,
    nameValue, setNameValue, nameError, setNameError,
    isAddingCompartment, setIsAddingCompartment,
    showDeleteDialog, setShowDeleteDialog,
    sensors,
    handleCompartmentDragEnd, handleRenameSubmit, handleRenameCancel, handleDeleteConfirm,
  } = useInventoryDetail(inventory, props.onRenameInventory, props.onDeleteInventory, props.onReorderCompartments)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/inventaires" className="text-slate-400 hover:text-slate-600 transition-colors text-lg" aria-label="Retour à la liste">←</Link>
          {isEditingName ? (
            <form onSubmit={handleRenameSubmit} className="flex items-center gap-2">
              <input
                data-testid="input-inventory-name-edit"
                type="text"
                value={nameValue}
                onChange={(e) => { setNameValue(e.target.value); if (nameError) setNameError(false) }}
                autoFocus
                className={`h-9 rounded-lg border-2 px-3 text-xl font-bold w-72 focus:outline-none focus:border-blue-500 ${nameError ? 'border-red-400' : 'border-slate-300'}`}
              />
              <button type="submit" className="text-sm text-blue-600 font-semibold hover:text-blue-700">OK</button>
              <button type="button" onClick={handleRenameCancel} className="text-sm text-slate-400 hover:text-slate-600">Annuler</button>
            </form>
          ) : (
            <button type="button" data-testid="btn-rename-inventory" onClick={() => setIsEditingName(true)} className="flex items-center gap-2 group" title="Cliquer pour renommer">
              <h1 className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{inventory.name}</h1>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-slate-300 group-hover:text-blue-400 transition-colors" aria-hidden="true">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <QrCodeButton onClick={onShowQrCode} />
          <button type="button" data-testid="btn-delete-inventory" onClick={() => setShowDeleteDialog(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            Supprimer
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {localCompartments.length === 0 && !isAddingCompartment && (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border-2 border-dashed border-slate-200">
            <p className="text-slate-500 font-medium mb-1">Aucun emplacement.</p>
            <p className="text-slate-400 text-sm mb-4">Ajoutez un emplacement pour commencer à lister le matériel.</p>
            <button type="button" data-testid="btn-add-compartment-empty" onClick={() => setIsAddingCompartment(true)}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
              + Ajouter un emplacement
            </button>
          </div>
        )}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCompartmentDragEnd}>
          <SortableContext items={localCompartments.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {localCompartments.map((compartment) => (
                <CompartmentSection key={compartment.id} compartment={compartment}
                  onRename={onRenameCompartment} onDelete={onDeleteCompartment}
                  onAddItem={onAddItem} onEditItem={onEditItem} onDeleteItem={onDeleteItem} onReorderItems={onReorderItems}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        {isAddingCompartment ? (
          <CreateCompartmentForm onSubmit={(name) => { onAddCompartment(name); setIsAddingCompartment(false) }} onCancel={() => setIsAddingCompartment(false)} />
        ) : (
          localCompartments.length > 0 && (
            <button type="button" data-testid="btn-add-compartment" onClick={() => setIsAddingCompartment(true)}
              className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
              + Ajouter un emplacement
            </button>
          )
        )}
      </div>

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        title="Supprimer cet inventaire ?"
        message={`"${inventory.name}" et l'ensemble de ses emplacements et matériels seront définitivement supprimés. Les contrôles existants sont conservés.`}
        confirmLabel="Supprimer l'inventaire"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  )
}
