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
import type { CompartmentWithItems, InventoryWithCompartments } from '../../domain/types'

export function useInventoryDetail(
  inventory: InventoryWithCompartments,
  onRenameInventory: (name: string) => void,
  onDeleteInventory: () => void,
  onReorderCompartments: (inventoryId: string, orderedIds: string[]) => void,
) {
  const [localCompartments, setLocalCompartments] = useState<CompartmentWithItems[]>(
    inventory.compartments,
  )
  useEffect(() => { setLocalCompartments(inventory.compartments) }, [inventory.compartments])

  const [isEditingName, setIsEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(inventory.name)
  const [nameError, setNameError] = useState(false)
  const [isAddingCompartment, setIsAddingCompartment] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleCompartmentDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = localCompartments.findIndex((c) => c.id === active.id)
    const newIndex = localCompartments.findIndex((c) => c.id === over.id)
    const reordered = arrayMove(localCompartments, oldIndex, newIndex)
    setLocalCompartments(reordered)
    onReorderCompartments(inventory.id, reordered.map((c) => c.id))
  }

  function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nameValue.trim()) { setNameError(true); return }
    onRenameInventory(nameValue.trim())
    setIsEditingName(false)
  }

  function handleRenameCancel() {
    setNameValue(inventory.name)
    setNameError(false)
    setIsEditingName(false)
  }

  function handleDeleteConfirm() {
    onDeleteInventory()
    setShowDeleteDialog(false)
  }

  return {
    localCompartments,
    isEditingName, setIsEditingName,
    nameValue, setNameValue,
    nameError, setNameError,
    isAddingCompartment, setIsAddingCompartment,
    showDeleteDialog, setShowDeleteDialog,
    sensors,
    handleCompartmentDragEnd,
    handleRenameSubmit,
    handleRenameCancel,
    handleDeleteConfirm,
  }
}
