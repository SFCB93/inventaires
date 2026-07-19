'use server'

import type { Result } from '@/shared/domain/result'
import { createPublicCorrectionUseCase, createPublicAnomalyCorrectionUseCase } from './use-cases'

export async function createPublicAnomalyCorrectionAction(
  input: { itemId: string; inventoryId: string; correctedBy: string },
): Promise<Result<void>> {
  return createPublicAnomalyCorrectionUseCase(input)
}

export async function createPublicCorrectionAction(
  input: { itemId: string; inventoryId: string; newExpiryDate: string; correctedBy: string },
): Promise<Result<void>> {
  return createPublicCorrectionUseCase(input)
}
