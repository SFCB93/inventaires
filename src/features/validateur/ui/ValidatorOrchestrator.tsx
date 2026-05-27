'use client'

import type { CompartmentWithItems, Inventory } from '../domain/types'
import { useValidatorOrchestrator } from './hooks/useValidatorOrchestrator'
import { ProgressBar } from './ProgressBar'
import { ItemCard } from './ItemCard'
import { WelcomeScreen } from './WelcomeScreen'
import { ConfirmationScreen } from './ConfirmationScreen'
import { ErrorScreen } from './ErrorScreen'
import { SummaryScreen } from './SummaryScreen'
import { CompartmentHeader } from './CompartmentHeader'

interface ValidatorOrchestratorProps {
  inventory: Inventory
  compartments: CompartmentWithItems[]
}

export function ValidatorOrchestrator({ inventory, compartments }: ValidatorOrchestratorProps) {
  const {
    step, results, isSubmitting, submissionError, submittedAt,
    nonEmptyCompartments, totalCompartments, totalItems,
    currentCompartment, currentItem,
    setStep, recordResult, handleSubmit,
  } = useValidatorOrchestrator(inventory, compartments)

  if (step === 'welcome') {
    return (
      <WelcomeScreen
        inventory={inventory}
        compartmentCount={totalCompartments}
        itemCount={totalItems}
        onStart={() => setStep('item')}
      />
    )
  }

  if (step === 'item' && currentItem) {
    return (
      <div className="flex flex-col min-h-screen">
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
        <ItemCard
          key={currentItem.id}
          item={currentItem}
          onPresent={(expiryDate) => recordResult({ status: 'present', expiryDate })}
          onAnomaly={(comment, expiryDate) => recordResult({ status: 'anomaly', comment, expiryDate })}
        />
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

  if (step === 'confirmation') {
    return <ConfirmationScreen inventoryName={inventory.name} submittedAt={submittedAt} />
  }

  return <ErrorScreen message="Une erreur inattendue s'est produite." />
}
