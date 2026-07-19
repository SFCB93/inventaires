// Dépasse 100 lignes : agrège contrôles, corrections, matériels et emplacements pour 4 use cases distincts.
import { FieldPath, FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/shared/data/firebase-admin'
import { chunkArray, FIRESTORE_IN_LIMIT } from '@/shared/lib/array'
import { DEFAULT_ALERT_THRESHOLD_DAYS } from '@/shared/lib/alert-defaults'
import { startOfToday, todayPlusDays } from '@/shared/lib/dates'
import type { Result } from '@/shared/domain/result'
import { ok, err } from '@/shared/domain/result'
import type {
  ControlSummary, ControlDetail, ControlCompartment, ItemResult as DomainItemResult,
  CreateCorrectionInput, CreateAnomalyCorrectionInput,
} from '../domain/types'

type RawControlResult = {
  itemId: string
  compartmentId: string
  status: 'present' | 'anomaly'
  comment: string | null
  expiryDate: string | null
}

async function getAlertThreshold(associationId: string): Promise<number> {
  try {
    const doc = await adminDb.collection('associations').doc(associationId).get()
    return (doc.data()?.alertThresholdDays as number | undefined) ?? DEFAULT_ALERT_THRESHOLD_DAYS
  } catch (error) {
    console.error('[getAlertThreshold]', error)
    return DEFAULT_ALERT_THRESHOLD_DAYS
  }
}

async function batchGetNames(collectionName: string, ids: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  if (ids.length === 0) return result
  for (const chunk of chunkArray(ids, FIRESTORE_IN_LIMIT)) {
    const snap = await adminDb.collection(collectionName).where(FieldPath.documentId(), 'in', chunk).get()
    for (const doc of snap.docs) result.set(doc.id, doc.data().name ?? '')
  }
  return result
}

export const controlsRepository = {
  getAlertThreshold,

  async listControls(associationId: string): Promise<Result<ControlSummary[]>> {
    try {
      const [inventoriesSnap, thresholdDays] = await Promise.all([
        adminDb.collection('inventaires').where('associationId', '==', associationId).get(),
        getAlertThreshold(associationId),
      ])
      if (inventoriesSnap.empty) return ok([])
      const inventoryIds = inventoriesSnap.docs.map(d => d.id)
      const inventoryNames = new Map(inventoriesSnap.docs.map(d => [d.id, (d.data().name as string) ?? '']))
      const controlDocs: FirebaseFirestore.QueryDocumentSnapshot[] = []
      for (const chunk of chunkArray(inventoryIds, FIRESTORE_IN_LIMIT)) {
        const snap = await adminDb.collection('controles').where('inventoryId', 'in', chunk).get()
        controlDocs.push(...snap.docs)
      }
      const controls: ControlSummary[] = controlDocs.map(doc => {
        const data = doc.data()
        const results: RawControlResult[] = data.results ?? []
        const submittedAt = data.submittedAt?.toDate() ?? new Date()
        const riskAt = new Date(submittedAt); riskAt.setDate(riskAt.getDate() + thresholdDays)
        return {
          id: doc.id,
          inventoryId: data.inventoryId,
          inventoryName: inventoryNames.get(data.inventoryId) ?? '',
          verifierName: data.verifierName,
          submittedAt,
          anomalyCount: results.filter(r =>
            r.status === 'anomaly' || (r.expiryDate && new Date(r.expiryDate) <= submittedAt)
          ).length,
          atRiskCount: results.filter(r => {
            if (!r.expiryDate) return false
            const d = new Date(r.expiryDate)
            return d > submittedAt && d <= riskAt
          }).length,
        }
      })
      controls.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
      return ok(controls)
    } catch (error) {
      return err(`Impossible de lister les contrôles. Erreur: ${(error as Error).message}`)
    }
  },

  async getControlDetail(controlId: string, associationId: string): Promise<Result<ControlDetail>> {
    try {
      const [controlDoc, thresholdDays] = await Promise.all([
        adminDb.collection('controles').doc(controlId).get(),
        getAlertThreshold(associationId),
      ])
      if (!controlDoc.exists) return err('Contrôle introuvable.')
      const data = controlDoc.data()!
      // Reject if associationId stored and doesn't match (legacy docs without field are allowed through)
      if (data.associationId && data.associationId !== associationId) return err('Non autorisé.')
      const rawResults: RawControlResult[] = data.results ?? []
      const itemIds = [...new Set(rawResults.map(r => r.itemId))]
      const compartmentIds = [...new Set(rawResults.map(r => r.compartmentId))]
      const [itemNames, compartmentNames, correctionsSnap, inventoryDoc] = await Promise.all([
        batchGetNames('materiels', itemIds),
        batchGetNames('emplacements', compartmentIds),
        adminDb.collection('corrections').where('inventoryId', '==', data.inventoryId).get(),
        adminDb.collection('inventaires').doc(data.inventoryId).get(),
      ])
      const inventoryName = (inventoryDoc.data()?.name as string) ?? ''
      // "Corrigé" badge: only a correction more recent than this control AND with date > J+30
      const controlSubmittedAtMs: number = data.submittedAt?.toMillis() ?? 0
      const bestCorrectionByItem = new Map<string, string>()
      for (const doc of correctionsSnap.docs) {
        const d = doc.data()
        const correctedAtMs: number = d.correctedAt?.toMillis() ?? 0
        if (correctedAtMs < controlSubmittedAtMs) continue
        const existing = bestCorrectionByItem.get(d.itemId)
        if (!existing || d.newExpiryDate > existing) bestCorrectionByItem.set(d.itemId, d.newExpiryDate)
      }
      const now = startOfToday()
      const risk = todayPlusDays(thresholdDays)
      function computeStatus(r: RawControlResult): DomainItemResult['currentExpiryStatus'] {
        if (!r.expiryDate) return null
        const correction = bestCorrectionByItem.get(r.itemId)
        if (correction && new Date(correction) > risk) return 'fixed'
        const d = new Date(r.expiryDate)
        if (d <= now) return 'expired'
        if (d <= risk) return 'at-risk'
        return 'ok'
      }
      const compartmentMap = new Map<string, ControlCompartment>()
      for (const r of rawResults) {
        if (!compartmentMap.has(r.compartmentId)) {
          compartmentMap.set(r.compartmentId, { id: r.compartmentId, name: compartmentNames.get(r.compartmentId) ?? '(emplacement introuvable)', results: [] })
        }
        compartmentMap.get(r.compartmentId)!.results.push({
          itemId: r.itemId, itemName: itemNames.get(r.itemId) ?? '(matériel introuvable)',
          status: r.status, comment: r.comment ?? null, expiryDate: r.expiryDate ?? null, currentExpiryStatus: computeStatus(r),
        })
      }
      return ok({ id: controlDoc.id, inventoryName, verifierName: data.verifierName, submittedAt: data.submittedAt?.toDate() ?? new Date(), compartments: [...compartmentMap.values()] })
    } catch (error) {
      return err(`Impossible de charger le contrôle. Erreur: ${(error as Error).message}`)
    }
  },

  async verifyInventoryOwnership(inventoryId: string, associationId: string): Promise<boolean> {
    try {
      const doc = await adminDb.collection('inventaires').doc(inventoryId).get()
      return doc.exists && doc.data()?.associationId === associationId
    } catch {
      return false
    }
  },

  async getInventoryAssociationId(inventoryId: string): Promise<Result<string>> {
    try {
      const doc = await adminDb.collection('inventaires').doc(inventoryId).get()
      if (!doc.exists) return err('Inventaire introuvable.')
      return ok(doc.data()!.associationId as string)
    } catch (error) {
      return err(`Impossible de lire l'inventaire. Erreur: ${(error as Error).message}`)
    }
  },

  async createAnomalyCorrection(input: CreateAnomalyCorrectionInput): Promise<Result<void>> {
    try {
      await adminDb.collection('anomaly_corrections').add({
        itemId: input.itemId,
        inventoryId: input.inventoryId,
        associationId: input.associationId,
        correctedBy: input.correctedBy,
        correctedAt: FieldValue.serverTimestamp(),
      })
      return ok(undefined)
    } catch (error) {
      return err(`Impossible d'enregistrer la correction. Erreur: ${(error as Error).message}`)
    }
  },

  async createCorrection(input: CreateCorrectionInput): Promise<Result<void>> {
    try {
      await adminDb.collection('corrections').add({
        itemId: input.itemId,
        inventoryId: input.inventoryId,
        associationId: input.associationId,
        newExpiryDate: input.newExpiryDate,
        correctedBy: input.correctedBy,
        correctedAt: FieldValue.serverTimestamp(),
      })
      return ok(undefined)
    } catch (error) {
      return err(`Impossible d'enregistrer la correction. Erreur: ${(error as Error).message}`)
    }
  },
}
