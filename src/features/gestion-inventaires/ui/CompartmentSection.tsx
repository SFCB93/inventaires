'use client'

import { DndContext, closestCenter } from '@dnd-kit/core'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CompartmentWithItems } from '../domain/types'
import type { ItemFormValues } from './ItemForm'
import { useCompartmentSection } from './hooks/useCompartmentSection'
import { ItemRow } from './ItemRow'
import { ItemForm } from './ItemForm'
import { DeleteConfirmDialog } from '@/shared/ui/DeleteConfirmDialog'

interface CompartmentSectionProps {
  compartment: CompartmentWithItems
  onRename: (compartmentId: string, name: string) => void
  onDelete: (compartmentId: string) => void
  onAddItem: (compartmentId: string, values: ItemFormValues) => void
  onEditItem: (itemId: string, values: ItemFormValues) => void
  onDeleteItem: (itemId: string) => void
  onReorderItems: (compartmentId: string, orderedIds: string[]) => void
}

export function CompartmentSection(props: CompartmentSectionProps) {
  const { compartment } = props
  const { attributes: dragAttributes, listeners: dragListeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: compartment.id })
  const {
    localItems,
    isExpanded, setIsExpanded,
    isEditingName, setIsEditingName,
    nameValue, setNameValue, nameError, setNameError,
    isAddingItem, setIsAddingItem,
    editingItem, setEditingItem,
    deletingItem, setDeletingItem,
    showDeleteDialog, setShowDeleteDialog,
    sensors, handleItemDragEnd,
    handleRenameSubmit, handleRenameCancel,
    handleAddItemSubmit, handleEditItemSubmit, handleDeleteItemConfirm, handleDeleteCompartmentConfirm,
  } = useCompartmentSection(compartment, props.onRename, props.onDelete, props.onAddItem, props.onEditItem, props.onDeleteItem, props.onReorderItems)

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      data-testid={`compartment-section-${compartment.id}`}
      className={`rounded-xl border bg-slate-50 overflow-hidden transition-shadow ${isDragging ? 'border-blue-300 shadow-xl opacity-60' : 'border-slate-200'}`}>
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-slate-200">
        <button type="button" aria-label="Réordonner cet emplacement" className="cursor-grab text-slate-300 hover:text-slate-500 transition-colors active:cursor-grabbing touch-none" {...dragAttributes} {...dragListeners}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="5" cy="5" r="1.5"/><circle cx="11" cy="5" r="1.5"/><circle cx="5" cy="11" r="1.5"/><circle cx="11" cy="11" r="1.5"/></svg>
        </button>
        {isEditingName ? (
          <form onSubmit={handleRenameSubmit} className="flex items-center gap-2 flex-1">
            <input data-testid={`input-compartment-name-${compartment.id}`} type="text" value={nameValue}
              onChange={(e) => { setNameValue(e.target.value); if (nameError) setNameError(false) }} autoFocus
              className={`flex-1 h-8 rounded-lg border-2 px-2 text-sm focus:outline-none focus:border-blue-500 ${nameError ? 'border-red-400' : 'border-slate-300'}`}
            />
            <button type="submit" className="text-xs text-blue-600 font-semibold hover:text-blue-700">OK</button>
            <button type="button" onClick={handleRenameCancel} className="text-xs text-slate-400 hover:text-slate-600">Annuler</button>
          </form>
        ) : (
          <button type="button" data-testid={`btn-rename-compartment-${compartment.id}`} onClick={() => setIsEditingName(true)}
            className="flex-1 text-left text-sm font-semibold text-slate-800 hover:text-blue-600 transition-colors" title="Cliquer pour renommer">
            {compartment.name}
          </button>
        )}
        <span className="text-xs text-slate-400 flex-shrink-0">{localItems.length} matériel{localItems.length !== 1 ? 's' : ''}</span>
        <button type="button" onClick={() => setIsExpanded(!isExpanded)} aria-label={isExpanded ? 'Réduire' : 'Développer'} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true"><path d="M7 10l5 5 5-5z"/></svg>
        </button>
        <button type="button" data-testid={`btn-delete-compartment-${compartment.id}`} onClick={() => setShowDeleteDialog(true)} aria-label={`Supprimer l'emplacement ${compartment.name}`} className="p-1 text-slate-300 hover:text-red-500 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 py-3 space-y-2">
          {localItems.length === 0 && !isAddingItem && (
            <p className="text-sm text-slate-400 py-2 text-center">Aucun matériel. Ajoutez-en un !</p>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
            <SortableContext items={localItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-1.5">
                {localItems.map((item) =>
                  editingItem?.id === item.id ? (
                    <li key={item.id} className="p-3 rounded-lg bg-white border border-blue-200">
                      <ItemForm initialValues={{ name: item.name, photoUrl: item.photoUrl, isCritical: item.isCritical }} submitLabel="Enregistrer" onSubmit={handleEditItemSubmit} onCancel={() => setEditingItem(null)} />
                    </li>
                  ) : (
                    <ItemRow key={item.id} item={item} onEdit={() => setEditingItem(item)} onDelete={() => setDeletingItem(item)} />
                  )
                )}
              </ul>
            </SortableContext>
          </DndContext>
          {isAddingItem ? (
            <div className="p-3 rounded-lg bg-white border border-blue-200">
              <ItemForm submitLabel="Ajouter" onSubmit={handleAddItemSubmit} onCancel={() => setIsAddingItem(false)} />
            </div>
          ) : (
            <button type="button" data-testid={`btn-add-item-${compartment.id}`} onClick={() => setIsAddingItem(true)}
              className="w-full py-2 rounded-lg border border-dashed border-slate-300 text-sm text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
              + Ajouter un matériel
            </button>
          )}
        </div>
      )}

      <DeleteConfirmDialog isOpen={deletingItem !== null} title="Supprimer ce matériel ?"
        message={`"${deletingItem?.name}" sera définitivement supprimé, ainsi que sa photo.`}
        onConfirm={handleDeleteItemConfirm} onCancel={() => setDeletingItem(null)} />
      <DeleteConfirmDialog isOpen={showDeleteDialog} title="Supprimer cet emplacement ?"
        message={`"${compartment.name}" et ses ${localItems.length} matériel(s) seront définitivement supprimés.`}
        onConfirm={handleDeleteCompartmentConfirm} onCancel={() => setShowDeleteDialog(false)} />
    </div>
  )
}
