'use client'

import { useCompartmentCard } from './hooks/useCompartmentCard'

interface CompartmentCardProps {
  name: string
  current: number
  total: number
  canGoBack: boolean
  onBack: () => void
  onEnter: () => void
}

export function CompartmentCard({ name, current, total, canGoBack, onBack, onEnter }: CompartmentCardProps) {
  const {
    dragX, dragY, isDragging,
    handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel,
  } = useCompartmentCard(onEnter)

  const rotate = dragX * 0.03
  const boxShadow = (Math.abs(dragX) + Math.abs(dragY)) > 10
    ? '0 12px 40px rgba(0,0,0,0.12)'
    : '0 4px 16px rgba(0,0,0,0.06)'

  return (
    <div className="flex flex-col flex-1">
      {canGoBack && (
        <button onClick={onBack} className="px-5 py-2 text-sm text-slate-400 text-left">
          ← Précédent
        </button>
      )}
      <div className="flex-1 flex flex-col px-2 pb-2">
        <div
          data-testid="compartment-card"
          role="button"
          tabIndex={0}
          onClick={onEnter}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onEnter()
            }
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          style={{
            transform: `translateX(${dragX}px) translateY(${dragY}px) rotate(${rotate}deg)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
            willChange: isDragging ? 'transform' : undefined,
            boxShadow,
          }}
          className="flex flex-col flex-1 rounded-2xl bg-white cursor-pointer touch-none select-none"
        >
          <div className="flex-1 flex flex-col justify-center px-8 py-10">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Emplacement {current} / {total}
            </p>
            <h3 className="text-4xl font-bold text-slate-900 leading-tight mb-8">{name}</h3>
            <p className="text-sm text-slate-400">Swipez ou tapez pour continuer →</p>
          </div>
        </div>
      </div>
    </div>
  )
}
