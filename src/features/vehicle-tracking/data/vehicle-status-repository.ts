// Dépasse 120 lignes : agrège les opérations sur l'état courant, l'historique et les noms des véhicules.
import { FieldPath, Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/shared/data/firebase-admin'
import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import { chunkArray, FIRESTORE_IN_LIMIT } from '@/shared/lib/array'
import { POSITION_RETENTION_DAYS, MS_PER_DAY } from '../domain/constants'

export interface VehicleStatusRecord {
  associationId: string
  lat: number
  lng: number
  isCircuitCut: boolean
  stableSince: Date
  lastSeenAt: Date
}

export interface VehiclePositionRecord {
  lat: number
  lng: number
  isCircuitCut: boolean
  timestamp: Date
}

function toStatusRecord(data: FirebaseFirestore.DocumentData): VehicleStatusRecord {
  return {
    associationId: data.associationId as string,
    lat: data.lat as number,
    lng: data.lng as number,
    isCircuitCut: data.isCircuitCut as boolean,
    stableSince: (data.stableSince as Timestamp).toDate(),
    lastSeenAt: (data.lastSeenAt as Timestamp).toDate(),
  }
}

export async function getVehicleStatus(inventoryId: string): Promise<Result<VehicleStatusRecord | null>> {
  try {
    const doc = await adminDb.collection('vehicleStatuses').doc(inventoryId).get()
    if (!doc.exists) return ok(null)
    return ok(toStatusRecord(doc.data()!))
  } catch (error) {
    return err(`Impossible de charger l'état du véhicule. Erreur: ${(error as Error).message}`)
  }
}

export async function touchLastSeen(inventoryId: string, timestamp: Date): Promise<Result<void>> {
  try {
    await adminDb.collection('vehicleStatuses').doc(inventoryId).update({
      lastSeenAt: Timestamp.fromDate(timestamp),
    })
    return ok(undefined)
  } catch (error) {
    return err(`Impossible de mettre à jour l'état du véhicule. Erreur: ${(error as Error).message}`)
  }
}

export async function recordVehiclePoint(input: {
  inventoryId: string
  associationId: string
  lat: number
  lng: number
  isCircuitCut: boolean
  timestamp: Date
}): Promise<Result<void>> {
  try {
    const timestamp = Timestamp.fromDate(input.timestamp)
    const expiresAt = Timestamp.fromDate(
      new Date(input.timestamp.getTime() + POSITION_RETENTION_DAYS * MS_PER_DAY),
    )

    await adminDb.collection('vehicleStatuses').doc(input.inventoryId).set({
      associationId: input.associationId,
      lat: input.lat,
      lng: input.lng,
      isCircuitCut: input.isCircuitCut,
      stableSince: timestamp,
      lastSeenAt: timestamp,
      poweredAlertSent: false,
    })
    await adminDb.collection('vehiclePositions').add({
      associationId: input.associationId,
      inventoryId: input.inventoryId,
      lat: input.lat,
      lng: input.lng,
      isCircuitCut: input.isCircuitCut,
      timestamp,
      expiresAt,
    })
    return ok(undefined)
  } catch (error) {
    return err(`Impossible d'enregistrer la position. Erreur: ${(error as Error).message}`)
  }
}

export async function listFleetStatus(
  associationId: string,
): Promise<Result<Array<VehicleStatusRecord & { inventoryId: string }>>> {
  try {
    const snap = await adminDb.collection('vehicleStatuses').where('associationId', '==', associationId).get()
    return ok(snap.docs.map((doc) => ({ inventoryId: doc.id, ...toStatusRecord(doc.data()) })))
  } catch (error) {
    return err(`Impossible de charger le suivi des véhicules. Erreur: ${(error as Error).message}`)
  }
}

export async function listInventoryNames(inventoryIds: string[]): Promise<Result<Map<string, string>>> {
  try {
    const names = new Map<string, string>()
    for (const chunk of chunkArray(inventoryIds, FIRESTORE_IN_LIMIT)) {
      const snap = await adminDb.collection('inventaires').where(FieldPath.documentId(), 'in', chunk).get()
      for (const doc of snap.docs) names.set(doc.id, doc.data().name as string)
    }
    return ok(names)
  } catch (error) {
    return err(`Impossible de charger les noms des véhicules. Erreur: ${(error as Error).message}`)
  }
}

export async function listPositionHistory(
  inventoryId: string,
  since: Date,
): Promise<Result<VehiclePositionRecord[]>> {
  try {
    const snap = await adminDb
      .collection('vehiclePositions')
      .where('inventoryId', '==', inventoryId)
      .where('timestamp', '>=', Timestamp.fromDate(since))
      .orderBy('timestamp', 'asc')
      .get()
    return ok(
      snap.docs.map((doc) => {
        const data = doc.data()
        return {
          lat: data.lat as number,
          lng: data.lng as number,
          isCircuitCut: data.isCircuitCut as boolean,
          timestamp: (data.timestamp as Timestamp).toDate(),
        }
      }),
    )
  } catch (error) {
    return err(`Impossible de charger l'historique de positions. Erreur: ${(error as Error).message}`)
  }
}
