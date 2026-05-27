import { create } from 'zustand'
import type { ItemResult } from '../../domain/types'

export type ValidatorStep = 'welcome' | 'item' | 'summary' | 'confirmation'

interface ValidatorStore {
  inventoryId: string
  step: ValidatorStep
  compartmentIndex: number
  itemIndex: number
  results: ItemResult[]
  isSubmitting: boolean
  submissionError: string | undefined
  submittedAt: string
  init: (inventoryId: string) => void
  setStep: (step: ValidatorStep) => void
  setCompartmentIndex: (i: number) => void
  setItemIndex: (i: number) => void
  setResults: (results: ItemResult[]) => void
  setIsSubmitting: (v: boolean) => void
  setSubmissionError: (e: string | undefined) => void
  setSubmittedAt: (t: string) => void
}

const INITIAL = {
  inventoryId: '',
  step: 'welcome' as ValidatorStep,
  compartmentIndex: 0,
  itemIndex: 0,
  results: [] as ItemResult[],
  isSubmitting: false,
  submissionError: undefined as string | undefined,
  submittedAt: '',
}

export const useValidatorStore = create<ValidatorStore>((set) => ({
  ...INITIAL,
  init: (inventoryId) => set({ ...INITIAL, inventoryId }),
  setStep: (step) => set({ step }),
  setCompartmentIndex: (compartmentIndex) => set({ compartmentIndex }),
  setItemIndex: (itemIndex) => set({ itemIndex }),
  setResults: (results) => set({ results }),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setSubmissionError: (submissionError) => set({ submissionError }),
  setSubmittedAt: (submittedAt) => set({ submittedAt }),
}))
