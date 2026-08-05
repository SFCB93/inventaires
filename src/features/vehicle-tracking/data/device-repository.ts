import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/shared/data/firebase-admin'
import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'

interface DeviceRecord {
  inventoryId: string
  associationId: string
}

export async function saveDeviceKey(
  inventoryId: string,
  associationId: string,
  apiKeyHash: string,
): Promise<Result<void>> {
  try {
    await adminDb.collection('vehicleDevices').doc(inventoryId).set({
      associationId,
      apiKeyHash,
      linkedAt: FieldValue.serverTimestamp(),
    })
    return ok(undefined)
  } catch (error) {
    return err(`Impossible d'associer le device. Erreur: ${(error as Error).message}`)
  }
}

export async function revokeDeviceKey(inventoryId: string): Promise<Result<void>> {
  try {
    await adminDb.collection('vehicleDevices').doc(inventoryId).delete()
    return ok(undefined)
  } catch (error) {
    return err(`Impossible de révoquer le device. Erreur: ${(error as Error).message}`)
  }
}

export async function findDeviceByKeyHash(apiKeyHash: string): Promise<Result<DeviceRecord | null>> {
  try {
    const snap = await adminDb.collection('vehicleDevices').where('apiKeyHash', '==', apiKeyHash).limit(1).get()
    if (snap.empty) return ok(null)
    const doc = snap.docs[0]
    return ok({ inventoryId: doc.id, associationId: doc.data().associationId as string })
  } catch (error) {
    return err(`Erreur de vérification du device. Erreur: ${(error as Error).message}`)
  }
}

export async function hasDevice(inventoryId: string): Promise<Result<boolean>> {
  try {
    const doc = await adminDb.collection('vehicleDevices').doc(inventoryId).get()
    return ok(doc.exists)
  } catch (error) {
    return err(`Erreur de vérification du device. Erreur: ${(error as Error).message}`)
  }
}

export async function listLinkedInventoryIds(associationId: string): Promise<Result<Set<string>>> {
  try {
    const snap = await adminDb.collection('vehicleDevices').where('associationId', '==', associationId).get()
    return ok(new Set(snap.docs.map((doc) => doc.id)))
  } catch (error) {
    return err(`Erreur de vérification des devices. Erreur: ${(error as Error).message}`)
  }
}
