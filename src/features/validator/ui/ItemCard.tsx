'use client'

import Image from 'next/image'
import type { Item } from '../domain/types'
import { DecisionButtons } from './DecisionButtons'
import { AnomalyModal } from './AnomalyModal'
import { useItemCard } from './hooks/useItemCard'

interface ItemCardProps {
  item: Item
  initialExpiryDate?: string
  onPresent: (expiryDate: string | undefined) => void
  onAnomaly: (comment: string, expiryDate: string | undefined) => void
  onDragChange?: (dragX: number | null) => void
}

export function ItemCard({ item, initialExpiryDate, onPresent, onAnomaly, onDragChange }: ItemCardProps) {
  const {
    expiryDate, setExpiryDate, clearExpiryDate, dateError,
    isModalOpen, setIsModalOpen,
    dragX, dragY, isDragging,
    glowOpacity, showAnomalyBadge, showOkBadge, showAbsentBadge, cardRotate,
    handleMarkPresent, handleOpenAnomaly, handleConfirmAnomaly,
    handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel,
  } = useItemCard(item, initialExpiryDate, onPresent, onAnomaly, onDragChange)

  const hasPhoto = Boolean(item.photoUrl)
  const glowRgb = dragX > 0 ? '245, 158, 11' : '16, 185, 129'
  const boxShadow = glowOpacity > 0
    ? `0 4px 16px rgba(0,0,0,0.06), 0 0 0 2px rgba(${glowRgb}, ${glowOpacity * 1.2}), 0 8px 40px rgba(${glowRgb}, ${glowOpacity * 0.9})`
    : '0 4px 16px rgba(0,0,0,0.06)'

  return (
    <>
      <div
        data-testid="item-card"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        style={{
          transform: `translateX(${dragX}px) translateY(${Math.max(0, dragY)}px) rotate(${cardRotate}deg)`,
          transition: (isDragging || isModalOpen) ? 'none' : 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
          willChange: isDragging ? 'transform' : undefined,
          boxShadow,
        }}
        className="flex flex-col flex-1 relative rounded-2xl overflow-hidden bg-white touch-none"
      >
        {showAnomalyBadge && (
          <div className="absolute top-6 left-5 z-20 border-4 border-amber-500 text-amber-500 bg-white/90 rounded-xl px-3 py-1.5 font-bold text-lg -rotate-12">
            ⚠ ANOMALIE
          </div>
        )}
        {showOkBadge && (
          <div className="absolute top-6 right-5 z-20 border-4 border-emerald-600 text-emerald-600 bg-white/90 rounded-xl px-3 py-1.5 font-bold text-lg rotate-12">
            ✓ OK
          </div>
        )}
        {showAbsentBadge && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 border-4 border-slate-500 text-slate-500 bg-white/90 rounded-xl px-3 py-1.5 font-bold text-lg">
            ✕ ABSENT
          </div>
        )}

        {hasPhoto && (
          <div className="relative w-full aspect-[4/3] bg-slate-100">
            <Image src={item.photoUrl} alt={item.name} fill className="object-cover" sizes="100vw" priority />
          </div>
        )}

        <div className={`flex-1 flex flex-col px-5 ${hasPhoto ? 'pt-5' : 'justify-center py-10'}`}>
          <h3 className={`font-bold text-slate-900 leading-tight ${hasPhoto ? 'text-2xl mb-0' : 'text-4xl mb-2'}`}>
            {item.name}
          </h3>

          {item.hasExpiry && (
            <div className="mt-4">
              <label htmlFor="input-expiry-date" className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>
                </svg>
                Date de péremption
                <span className={`text-xs font-normal px-1.5 py-0.5 rounded-md ${item.isCritical ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                  {item.isCritical ? 'obligatoire' : 'facultatif'}
                </span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="input-expiry-date"
                  data-testid="input-expiry-date"
                  type="month"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  placeholder="AAAA-MM ou MM-AAAA"
                  className={`flex-1 h-12 rounded-xl border-2 px-3 text-base bg-white focus:outline-none focus:border-blue-500 transition-colors ${dateError ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                />
                {expiryDate !== '' && (
                  <button
                    type="button"
                    data-testid="btn-clear-expiry"
                    onClick={clearExpiryDate}
                    className="flex items-center justify-center w-11 h-11 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
                    aria-label="Effacer la date de péremption"
                  >
                    ×
                  </button>
                )}
              </div>
              {dateError && (
                <p role="alert" className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <span aria-hidden="true">↑</span>
                  {dateError === 'format'
                    ? 'Format invalide. Attendu : AAAA-MM ou MM-AAAA (ex : 2026-05 ou 05-2026).'
                    : 'La date de péremption est obligatoire pour ce matériel critique.'}
                </p>
              )}
            </div>
          )}
        </div>

        <DecisionButtons onPresent={handleMarkPresent} onAnomaly={handleOpenAnomaly} />
      </div>

      <AnomalyModal isOpen={isModalOpen} onConfirm={handleConfirmAnomaly} onCancel={() => setIsModalOpen(false)} />
    </>
  )
}
