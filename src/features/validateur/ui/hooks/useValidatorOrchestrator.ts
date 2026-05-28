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

  function advance(updatedResults: ItemResult[]) {
    const nextItem = store.itemIndex + 1
    if (nextItem < currentCompartment.items.length) {
      store.setItemIndex(nextItem)
      return
    }
    const nextCompartment = store.compartmentIndex + 1
    if (nextCompartment < totalCompartments) {
      store.setCompartmentIndex(nextCompartment)
      store.setItemIndex(0)
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
    advance(updated)
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
    store.setSubmittedAt(new Date().toLocaleString('fr-FR'))
    store.setStep('confirmation')
  }

  return {
    step,
    results: store.results,
    isSubmitting: store.isSubmitting,
    submissionError: store.submissionError,
    submittedAt: store.submittedAt,
    nonEmptyCompartments,
    totalCompartments,
    totalItems,
    currentCompartment,
    currentItem,
    setStep: store.setStep,
    recordResult,
    handleSubmit,
  }
}
