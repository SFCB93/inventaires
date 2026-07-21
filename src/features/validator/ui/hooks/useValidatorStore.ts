import { create } from 'zustand'
import type { ItemResult } from '../../domain/types'

export type ValidatorStep = 'welcome' | 'compartment' | 'item' | 'summary' | 'rating' | 'confirmation'

interface ValidatorStore {
  inventoryId: string
  step: ValidatorStep
  compartmentIndex: number
  itemIndex: number
  results: ItemResult[]
  draftExpiryDates: Record<string, string>
  isSubmitting: boolean
  submissionError: string | undefined
  submittedAt: string
  controlId: string
  init: (inventoryId: string) => void
  setStep: (step: ValidatorStep) => void
  setCompartmentIndex: (i: number) => void
  setItemIndex: (i: number) => void
  setResults: (results: ItemResult[]) => void
  setDraftExpiryDate: (itemId: string, date: string | undefined) => void
  setIsSubmitting: (v: boolean) => void
  setSubmissionError: (e: string | undefined) => void
  setSubmittedAt: (t: string) => void
  setControlId: (id: string) => void
}

const INITIAL = {
  inventoryId: '',
  step: 'welcome' as ValidatorStep,
  compartmentIndex: 0,
  itemIndex: 0,
  results: [] as ItemResult[],
  draftExpiryDates: {} as Record<string, string>,
  isSubmitting: false,
  submissionError: undefined as string | undefined,
  submittedAt: '',
  controlId: '',
}

export const useValidatorStore = create<ValidatorStore>((set) => ({
  ...INITIAL,
  init: (inventoryId) => set({ ...INITIAL, inventoryId }),
  setStep: (step) => set({ step }),
  setCompartmentIndex: (compartmentIndex) => set({ compartmentIndex }),
  setItemIndex: (itemIndex) => set({ itemIndex }),
  setResults: (results) => set({ results }),
  setDraftExpiryDate: (itemId, date) => set((state) => ({
    draftExpiryDates: { ...state.draftExpiryDates, [itemId]: date ?? '' },
  })),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setSubmissionError: (submissionError) => set({ submissionError }),
  setSubmittedAt: (submittedAt) => set({ submittedAt }),
  setControlId: (controlId) => set({ controlId }),
}))
