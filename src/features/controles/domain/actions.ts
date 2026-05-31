'use server'

import { err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import { getAuthenticatedUser } from '@/shared/lib/auth'
import { createCorrectionUseCase, createAnomalyCorrectionUseCase } from './use-cases'

export async function createAnomalyCorrectionAction(
  input: { itemId: string; inventoryId: string },
): Promise<Result<void>> {
  const user = await getAuthenticatedUser()
  if (!user) return err('Non authentifié.')
  return createAnomalyCorrectionUseCase(
    { itemId: input.itemId, inventoryId: input.inventoryId, associationId: user.associationId, correctedBy: user.uid },
    user,
  )
}

export async function createCorrectionAction(
  input: { itemId: string; inventoryId: string; newExpiryDate: string },
): Promise<Result<void>> {
  const user = await getAuthenticatedUser()
  if (!user) return err('Non authentifié.')
  return createCorrectionUseCase(
    { itemId: input.itemId, inventoryId: input.inventoryId, associationId: user.associationId, newExpiryDate: input.newExpiryDate, correctedBy: user.uid },
    user,
  )
}
