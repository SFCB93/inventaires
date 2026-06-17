'use client'

import { useState, useCallback } from 'react'
import type { CompartmentWithItems, Inventory } from '../domain/types'
import { useValidatorOrchestrator } from './hooks/useValidatorOrchestrator'
import { ProgressBar } from './ProgressBar'
import { ItemCard } from './ItemCard'
import { CompartmentCard } from './CompartmentCard'
import { CompartmentHeader } from './CompartmentHeader'
import { WelcomeScreen } from './WelcomeScreen'
import { ConfirmationScreen } from './ConfirmationScreen'
import { RatingScreen } from './RatingScreen'
import { ErrorScreen } from './ErrorScreen'
import { SummaryScreen } from './SummaryScreen'

const BG_SCALE = 120
const MAX_BG_OPACITY = 0.85

interface ValidatorOrchestratorProps {
  inventory: Inventory
  compartments: CompartmentWithItems[]
  lastExpiryDates: Record<string, string>
}

export function ValidatorOrchestrator({ inventory, compartments, lastExpiryDates }: ValidatorOrchestratorProps) {
  const {
    step, results, isSubmitting, submissionError, submittedAt, controlId,
    nonEmptyCompartments, totalCompartments, totalItems,
    currentCompartment, currentItem,
    canGoBack, setStep, compartmentIndex, recordResult, goBack,
    enterCompartment, handleSubmit,
  } = useValidatorOrchestrator(inventory, compartments)

  const [swipeDragX, setSwipeDragX] = useState<number | null>(null)
  const handleDragChange = useCallback((dragX: number | null) => setSwipeDragX(dragX), [])

  const bgOpacity = swipeDragX !== null
    ? Math.min(Math.abs(swipeDragX) / BG_SCALE, MAX_BG_OPACITY)
    : 0
  const bgColor = swipeDragX !== null && swipeDragX > 0
    ? `rgba(254, 243, 199, ${bgOpacity})`
    : swipeDragX !== null && swipeDragX < 0
    ? `rgba(209, 250, 229, ${bgOpacity})`
    : undefined
  const isDragging = swipeDragX !== null

  if (step === 'welcome') {
    return (
      <WelcomeScreen
        inventory={inventory}
        compartmentCount={totalCompartments}
        itemCount={totalItems}
        onStart={() => setStep('compartment')}
      />
    )
  }

  if (step === 'compartment' && currentCompartment) {
    return (
      <div className="flex flex-col min-h-dvh bg-slate-50">
        <ProgressBar
          currentItem={results.length + 1}
          totalItems={totalItems}
          currentCompartment={compartmentIndex + 1}
          totalCompartments={totalCompartments}
        />
        <CompartmentCard
          name={currentCompartment.name}
          current={compartmentIndex + 1}
          total={totalCompartments}
          canGoBack={canGoBack}
          onBack={goBack}
          onEnter={enterCompartment}
        />
      </div>
    )
  }

  if (step === 'item' && currentItem) {
    return (
      <div
        className="flex flex-col min-h-dvh"
        style={{
          backgroundColor: bgColor,
          transition: isDragging ? 'none' : 'background-color 0.3s ease-out',
        }}
      >
        <ProgressBar
          currentItem={results.length + 1}
          totalItems={totalItems}
          currentCompartment={nonEmptyCompartments.indexOf(currentCompartment) + 1}
          totalCompartments={totalCompartments}
        />
        <CompartmentHeader
          name={currentCompartment.name}
          currentCompartment={nonEmptyCompartments.indexOf(currentCompartment) + 1}
          totalCompartments={totalCompartments}
        />
        {canGoBack && (
          <button onClick={goBack} className="px-5 py-2 text-sm text-slate-400 text-left">
            ← Précédent
          </button>
        )}
        <div className="flex-1 flex flex-col px-2 pb-2">
          <ItemCard
            key={currentItem.id}
            item={currentItem}
            initialExpiryDate={currentItem.hasExpiry && !currentItem.isCritical ? lastExpiryDates[currentItem.id] : undefined}
            onPresent={(expiryDate) => recordResult({ status: 'present', expiryDate })}
            onAnomaly={(comment, expiryDate) => recordResult({ status: 'anomaly', comment, expiryDate })}
            onDragChange={handleDragChange}
          />
        </div>
      </div>
    )
  }

  if (step === 'summary') {
    return (
      <SummaryScreen
        compartments={nonEmptyCompartments}
        results={results}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={submissionError}
      />
    )
  }

  if (step === 'rating') {
    return <RatingScreen controlId={controlId} onDone={() => setStep('confirmation')} />
  }

  if (step === 'confirmation') {
    return <ConfirmationScreen inventoryName={inventory.name} submittedAt={submittedAt} />
  }

  return <ErrorScreen message="Une erreur inattendue s'est produite." />
}
