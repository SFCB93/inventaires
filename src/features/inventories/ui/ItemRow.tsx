// Dépasse 120 lignes : gère l'affichage, l'édition inline et la suppression d'un matériel avec ses états.
'use client'

import Image from 'next/image'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Item } from '../domain/types'

interface ItemRowProps {
  item: Item
  onEdit: (item: Item) => void
  onDelete: (item: Item) => void
}

export function ItemRow({ item, onEdit, onDelete }: ItemRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      data-testid={`item-row-${item.id}`}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white border
                  transition-colors
                  ${isDragging
                    ? 'border-blue-300 shadow-lg z-10 relative opacity-60'
                    : 'border-slate-100 hover:border-slate-200'
                  }`}
    >
      {/* Drag handle */}
      <button
        type="button"
        aria-label="Réordonner ce matériel"
        className="cursor-grab text-slate-300 hover:text-slate-500 transition-colors
                   active:cursor-grabbing flex-shrink-0 touch-none"
        {...attributes}
        {...listeners}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="4" r="1.5"/><circle cx="11" cy="4" r="1.5"/>
          <circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/>
          <circle cx="5" cy="12" r="1.5"/><circle cx="11" cy="12" r="1.5"/>
        </svg>
      </button>

      {/* Photo thumbnail */}
      <div className="w-9 h-9 rounded-md overflow-hidden bg-slate-100 flex-shrink-0
                      flex items-center justify-center">
        {item.photoUrl ? (
          <Image
            src={item.photoUrl}
            alt={item.name}
            width={36}
            height={36}
            className="object-cover w-full h-full"
          />
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"
            className="text-slate-300" aria-hidden="true">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
        )}
      </div>

      {/* Name */}
      <span className="flex-1 text-sm font-medium text-slate-800 truncate">{item.name}</span>

      {/* hasExpiry badge */}
      {item.hasExpiry && (
        <span
          className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full
                     bg-amber-100 text-amber-600"
          title="Matériel périssable — date de péremption demandée lors du contrôle"
        >
          Périssable
        </span>
      )}

      {/* isCritical badge */}
      {item.isCritical && (
        <span
          className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full
                     bg-red-100 text-red-600"
          title="Matériel critique — date de péremption obligatoire lors du contrôle"
        >
          Critique
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          type="button"
          data-testid={`btn-edit-item-${item.id}`}
          onClick={() => onEdit(item)}
          aria-label={`Modifier ${item.name}`}
          className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50
                     transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </button>
        <button
          type="button"
          data-testid={`btn-delete-item-${item.id}`}
          onClick={() => onDelete(item)}
          aria-label={`Supprimer ${item.name}`}
          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50
                     transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      </div>
    </li>
  )
}
