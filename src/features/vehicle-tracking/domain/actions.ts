'use server'
import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedUser } from '@/shared/lib/auth'
import {
  linkDeviceUseCase,
  revokeDeviceUseCase,
  revokeDeviceAndDeleteDataUseCase,
  listUnlinkedInventoriesUseCase,
  getVehiclePositionHistoryUseCase,
} from './use-cases'
import type { PositionPoint, TimeRange, UnlinkedInventory } from './types'

export async function linkDeviceAction(inventoryId: string): Promise<Result<{ apiKey: string }>> {
  const user = await getAuthenticatedUser()
  if (!user) return err('Non authentifié.')

  const result = await linkDeviceUseCase(inventoryId, user.associationId)
  if (!result.ok) return result
  revalidatePath('/dashboard/vehicules')
  revalidatePath(`/dashboard/vehicules/${inventoryId}`)
  return ok({ apiKey: result.value.apiKey })
}

export async function revokeDeviceAction(inventoryId: string): Promise<Result<void>> {
  const user = await getAuthenticatedUser()
  if (!user) return err('Non authentifié.')

  const result = await revokeDeviceUseCase(inventoryId, user.associationId)
  if (!result.ok) return result
  revalidatePath('/dashboard/vehicules')
  revalidatePath(`/dashboard/vehicules/${inventoryId}`)
  return ok(undefined)
}

export async function revokeDeviceAndDeleteDataAction(inventoryId: string): Promise<Result<void>> {
  const user = await getAuthenticatedUser()
  if (!user) return err('Non authentifié.')

  const result = await revokeDeviceAndDeleteDataUseCase(inventoryId, user.associationId)
  if (!result.ok) return result
  revalidatePath('/dashboard/vehicules')
  revalidatePath(`/dashboard/vehicules/${inventoryId}`)
  return ok(undefined)
}

export async function listUnlinkedInventoriesAction(): Promise<Result<UnlinkedInventory[]>> {
  const user = await getAuthenticatedUser()
  if (!user) return err('Non authentifié.')

  return listUnlinkedInventoriesUseCase(user.associationId)
}

export async function getVehiclePositionHistoryAction(
  inventoryId: string,
  timeRange: TimeRange,
): Promise<Result<PositionPoint[]>> {
  const user = await getAuthenticatedUser()
  if (!user) return err('Non authentifié.')

  return getVehiclePositionHistoryUseCase(inventoryId, user.associationId, timeRange)
}
