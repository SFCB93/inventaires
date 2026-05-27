'use client'

import Image from 'next/image'
import type { Item } from '../domain/types'
import { DecisionButtons } from './DecisionButtons'
import { AnomalyModal } from './AnomalyModal'
import { useItemCard } from './hooks/useItemCard'

interface ItemCardProps {
  item: Item
  onPresent: (expiryDate: string | undefined) => void
  onAnomaly: (comment: string, expiryDate: string | undefined) => void
}

export function ItemCard({ item, onPresent, onAnomaly }: ItemCardProps) {
  const {
    expiryDate, setExpiryDate, dateError,
    isModalOpen, setIsModalOpen,
    handleMarkPresent, handleOpenAnomaly, handleConfirmAnomaly,
    handleTouchStart, handleTouchEnd,
  } = useItemCard(item, onPresent, onAnomaly)

  const hasPhoto = Boolean(item.photoUrl)

  return (
    <>
      <div
        data-testid="item-card"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex flex-col flex-1"
      >
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
              <input
                id="input-expiry-date"
                data-testid="input-expiry-date"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className={`w-full h-12 rounded-xl border-2 px-3 text-base bg-white focus:outline-none focus:border-blue-500 transition-colors ${dateError ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
              />
              {dateError && (
                <p role="alert" className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <span aria-hidden="true">↑</span>
                  La date de péremption est obligatoire pour ce matériel critique.
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
