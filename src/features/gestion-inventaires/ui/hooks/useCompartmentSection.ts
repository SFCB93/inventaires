'use client'

import { useEffect, useState } from 'react'
import {
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'
import type { CompartmentWithItems, Item } from '../../domain/types'
import type { ItemFormValues } from '../ItemForm'

export function useCompartmentSection(
  compartment: CompartmentWithItems,
  onRename: (compartmentId: string, name: string) => void,
  onDelete: (compartmentId: string) => void,
  onAddItem: (compartmentId: string, values: ItemFormValues) => void,
  onEditItem: (itemId: string, values: ItemFormValues) => void,
  onDeleteItem: (itemId: string) => void,
  onReorderItems: (compartmentId: string, orderedIds: string[]) => void,
) {
  const [localItems, setLocalItems] = useState<Item[]>(compartment.items)
  useEffect(() => { setLocalItems(compartment.items) }, [compartment.items])

  const [isExpanded, setIsExpanded] = useState(true)
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(compartment.name)
  const [nameError, setNameError] = useState(false)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [deletingItem, setDeletingItem] = useState<Item | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleItemDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = localItems.findIndex((i) => i.id === active.id)
    const newIndex = localItems.findIndex((i) => i.id === over.id)
    const reordered = arrayMove(localItems, oldIndex, newIndex)
    setLocalItems(reordered)
    onReorderItems(compartment.id, reordered.map((i) => i.id))
  }

  function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nameValue.trim()) { setNameError(true); return }
    onRename(compartment.id, nameValue.trim())
    setIsEditingName(false)
  }

  function handleRenameCancel() {
    setNameValue(compartment.name)
    setNameError(false)
    setIsEditingName(false)
  }

  function handleAddItemSubmit(values: ItemFormValues) {
    onAddItem(compartment.id, values)
    setIsAddingItem(false)
  }

  function handleEditItemSubmit(values: ItemFormValues) {
    if (!editingItem) return
    onEditItem(editingItem.id, values)
    setEditingItem(null)
  }

  function handleDeleteItemConfirm() {
    if (!deletingItem) return
    onDeleteItem(deletingItem.id)
    setDeletingItem(null)
  }

  function handleDeleteCompartmentConfirm() {
    onDelete(compartment.id)
    setShowDeleteDialog(false)
  }

  return {
    localItems,
    isExpanded, setIsExpanded,
    isEditingName, setIsEditingName,
    nameValue, setNameValue,
    nameError, setNameError,
    isAddingItem, setIsAddingItem,
    editingItem, setEditingItem,
    deletingItem, setDeletingItem,
    showDeleteDialog, setShowDeleteDialog,
    sensors,
    handleItemDragEnd,
    handleRenameSubmit,
    handleRenameCancel,
    handleAddItemSubmit,
    handleEditItemSubmit,
    handleDeleteItemConfirm,
    handleDeleteCompartmentConfirm,
  }
}
