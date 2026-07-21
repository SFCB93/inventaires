// Dépasse 100 lignes : orchestration multi-étapes (compartment + item) avec logique de retour arrière.
'use client'

import { useEffect } from 'react'
import type { CompartmentWithItems, ControlEmailContext, Inventory, ItemResult } from '../../domain/types'
import { submitControlAction } from '../../domain/actions'
import { useValidatorStore } from './useValidatorStore'

export function useValidatorOrchestrator(
  inventory: Inventory,
  compartments: CompartmentWithItems[],
) {
  const store = useValidatorStore()

  const nonEmptyCompartments = compartments.filter((c) => c.items.length > 0)
  const totalCompartments = nonEmptyCompartments.length
  const totalItems = nonEmptyCompartments.reduce((acc, c) => acc + c.items.length, 0)

  useEffect(() => {
    if (useValidatorStore.getState().inventoryId !== inventory.id) {
      useValidatorStore.getState().init(inventory.id)
    }
  }, [inventory.id])

  const initialized = store.inventoryId === inventory.id
  const step = initialized ? store.step : 'welcome' as const

  const currentCompartment = nonEmptyCompartments[store.compartmentIndex]
  const currentItem = currentCompartment?.items[store.itemIndex]

  const canGoBack = initialized && (
    (step === 'compartment' && store.compartmentIndex > 0) ||
    (step === 'item' && (store.compartmentIndex > 0 || store.itemIndex > 0))
  )

  function goBack() {
    if (step === 'compartment' && store.compartmentIndex > 0) {
      // Retour au dernier item du compartiment précédent
      const prevCompartment = nonEmptyCompartments[store.compartmentIndex - 1]
      store.setResults(store.results.slice(0, -1))
      store.setCompartmentIndex(store.compartmentIndex - 1)
      store.setItemIndex(prevCompartment.items.length - 1)
      store.setStep('item')
    } else if (step === 'item' && store.itemIndex === 0 && store.compartmentIndex > 0) {
      // Retour à la carte de l'emplacement courant
      store.setStep('compartment')
    } else if (step === 'item' && store.itemIndex > 0) {
      store.setResults(store.results.slice(0, -1))
      store.setItemIndex(store.itemIndex - 1)
    }
  }

  function advance(updatedResults: ItemResult[]) {
    const nextItem = store.itemIndex + 1
    if (nextItem < currentCompartment.items.length) {
      store.setItemIndex(nextItem)
      store.setStep('item')
      return
    }
    const nextCompartment = store.compartmentIndex + 1
    if (nextCompartment < totalCompartments) {
      store.setCompartmentIndex(nextCompartment)
      store.setItemIndex(0)
      store.setStep('compartment')
      return
    }
    store.setResults(updatedResults)
    store.setStep('summary')
  }

  function recordResult(partial: Omit<ItemResult, 'compartmentId' | 'itemId'>) {
    const updated: ItemResult[] = [
      ...store.results,
      { itemId: currentItem.id, compartmentId: currentCompartment.id, ...partial },
    ]
    store.setResults(updated)
    store.setDraftExpiryDate(currentItem.id, partial.expiryDate)
    advance(updated)
  }

  function enterCompartment() {
    store.setStep('item')
  }

  function buildEmailContext(results: ItemResult[]): ControlEmailContext {
    const anomalies = results
      .filter((r) => r.status === 'anomaly')
      .map((r) => {
        const c = nonEmptyCompartments.find((c) => c.id === r.compartmentId)!
        const item = c.items.find((i) => i.id === r.itemId)!
        return { itemName: item.name, compartmentName: c.name, comment: r.comment! }
      })
    const expiryDates = results
      .filter((r) => r.expiryDate)
      .map((r) => {
        const c = nonEmptyCompartments.find((c) => c.id === r.compartmentId)!
        const item = c.items.find((i) => i.id === r.itemId)!
        return { itemName: item.name, compartmentName: c.name, date: r.expiryDate! }
      })
    return { inventoryName: inventory.name, anomalies, expiryDates }
  }

  async function handleSubmit(verifierName: string) {
    store.setIsSubmitting(true)
    store.setSubmissionError(undefined)
    const result = await submitControlAction(
      { inventoryId: inventory.id, verifierName, results: store.results },
      buildEmailContext(store.results),
    )
    store.setIsSubmitting(false)
    if (!result.ok) { store.setSubmissionError(result.error); return }
    store.setControlId(result.value.controlId)
    store.setSubmittedAt(new Date().toLocaleString('fr-FR'))
    store.setStep('rating')
  }

  return {
    step,
    results: store.results,
    draftExpiryDates: store.draftExpiryDates,
    isSubmitting: store.isSubmitting,
    submissionError: store.submissionError,
    submittedAt: store.submittedAt,
    controlId: store.controlId,
    nonEmptyCompartments,
    totalCompartments,
    totalItems,
    currentCompartment,
    currentItem,
    canGoBack,
    setStep: store.setStep,
    compartmentIndex: store.compartmentIndex,
    recordResult,
    goBack,
    enterCompartment,
    handleSubmit,
  }
}
