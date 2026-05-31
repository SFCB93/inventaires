// Dépasse 100 lignes : agrège contrôles, corrections, matériels et emplacements pour 4 use cases distincts.
import { FieldPath, FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/shared/data/firebase-admin'
import { chunkArray, FIRESTORE_IN_LIMIT } from '@/shared/lib/array'
import { DEFAULT_ALERT_THRESHOLD_DAYS } from '@/shared/lib/alert-defaults'
import type { Result } from '@/shared/domain/result'
import { ok, err } from '@/shared/domain/result'
import type {
  ControlSummary, ControlDetail, ControlCompartment, ItemResult as DomainItemResult,
  ExpiryAlertReport, ExpiryAlertItem, AnomalyAlertItem, CreateCorrectionInput, CreateAnomalyCorrectionInput,
} from '../domain/types'

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function todayPlusDays(n: number): Date {
  const d = startOfToday()
  d.setDate(d.getDate() + n)
  return d
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

export const controlesRepository = {
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
        const results: any[] = data.results ?? []
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
      const rawResults: any[] = data.results ?? []
      const itemIds = [...new Set(rawResults.map(r => r.itemId as string))]
      const compartmentIds = [...new Set(rawResults.map(r => r.compartmentId as string))]
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
      function computeStatus(r: any): DomainItemResult['currentExpiryStatus'] {
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

  async getActiveExpiryAlerts(associationId: string, providedThreshold?: number): Promise<Result<ExpiryAlertReport>> {
    try {
      const [inventoriesSnap, thresholdDays] = await Promise.all([
        adminDb.collection('inventaires').where('associationId', '==', associationId).get(),
        providedThreshold !== undefined ? Promise.resolve(providedThreshold) : getAlertThreshold(associationId),
      ])
      if (inventoriesSnap.empty) return ok({ anomalies: [], expired: [], atRisk: [] })
      const inventoryIds = inventoriesSnap.docs.map(d => d.id)
      const inventoryNames = new Map(inventoriesSnap.docs.map(d => [d.id, (d.data().name as string) ?? '']))
      type Entry = { itemId: string; inventoryId: string; inventoryName: string; compartmentId: string; latestExpiryDate: string; comment: string | null; recordedAtMs: number; source: 'control' | 'correction' }
      const entries = new Map<string, Entry>()
      const allControlDocs: FirebaseFirestore.QueryDocumentSnapshot[] = []
      for (const chunk of chunkArray(inventoryIds, FIRESTORE_IN_LIMIT)) {
        const snap = await adminDb.collection('controles').where('inventoryId', 'in', chunk).get()
        allControlDocs.push(...snap.docs)
      }
      // Sort oldest first so the most recent control always overwrites previous ones
      allControlDocs.sort((a, b) => (a.data().submittedAt?.toMillis() ?? 0) - (b.data().submittedAt?.toMillis() ?? 0))
      type StatusEntry = { inventoryId: string; inventoryName: string; compartmentId: string; comment: string | null; controlId: string; recordedAtMs: number }
      const latestStatus = new Map<string, { status: string } & StatusEntry>()
      for (const doc of allControlDocs) {
        const d = doc.data()
        const recordedAtMs: number = d.submittedAt?.toMillis() ?? 0
        for (const r of d.results ?? []) {
          const key = `${r.itemId}|${d.inventoryId}`
          if (r.expiryDate) {
            entries.set(key, { itemId: r.itemId, inventoryId: d.inventoryId, inventoryName: inventoryNames.get(d.inventoryId) ?? '', compartmentId: r.compartmentId, latestExpiryDate: r.expiryDate, comment: r.comment ?? null, recordedAtMs, source: 'control' })
          }
          latestStatus.set(key, { status: r.status, inventoryId: d.inventoryId, inventoryName: inventoryNames.get(d.inventoryId) ?? '', compartmentId: r.compartmentId, comment: r.comment ?? null, controlId: doc.id, recordedAtMs })
        }
      }
      const correctionsSnap = await adminDb.collection('corrections').where('associationId', '==', associationId).get()
      for (const doc of correctionsSnap.docs) {
        const d = doc.data()
        const key = `${d.itemId}|${d.inventoryId}`
        const existing = entries.get(key)
        const correctedAtMs: number = d.correctedAt?.toMillis() ?? 0
        // Correction wins only if it is more recent than the last control that recorded a date
        if (!existing || correctedAtMs >= existing.recordedAtMs) {
          entries.set(key, { itemId: d.itemId, inventoryId: d.inventoryId, inventoryName: inventoryNames.get(d.inventoryId) ?? '', compartmentId: existing?.compartmentId ?? '', latestExpiryDate: d.newExpiryDate, comment: existing?.comment ?? null, recordedAtMs: correctedAtMs, source: 'correction' })
        }
      }
      const now = startOfToday()
      const risk = todayPlusDays(thresholdDays)
      const expired: Entry[] = []
      const atRisk: Entry[] = []
      for (const entry of entries.values()) {
        const d = new Date(entry.latestExpiryDate)
        if (d <= now) expired.push(entry)
        else if (d <= risk) atRisk.push(entry)
      }
      // Active anomalies: items whose latest control result is 'anomaly', not corrected since
      let activeAnomalyEntries = [...latestStatus.entries()]
        .filter(([, e]) => e.status === 'anomaly')
        .map(([key, e]) => ({ itemId: key.split('|')[0], ...e }))
      if (activeAnomalyEntries.length > 0) {
        const anomalyCorrectionsSnap = await adminDb.collection('anomaly_corrections').where('associationId', '==', associationId).get()
        const latestAnomalyCorrection = new Map<string, number>()
        for (const doc of anomalyCorrectionsSnap.docs) {
          const d = doc.data()
          const key = `${d.itemId}|${d.inventoryId}`
          const correctedAtMs: number = d.correctedAt?.toMillis() ?? 0
          if (correctedAtMs > (latestAnomalyCorrection.get(key) ?? 0)) latestAnomalyCorrection.set(key, correctedAtMs)
        }
        activeAnomalyEntries = activeAnomalyEntries.filter(a => {
          const correctedAtMs = latestAnomalyCorrection.get(`${a.itemId}|${a.inventoryId}`) ?? 0
          return correctedAtMs < a.recordedAtMs
        })
      }
      if (expired.length === 0 && atRisk.length === 0 && activeAnomalyEntries.length === 0) return ok({ anomalies: [], expired: [], atRisk: [] })
      const allExpiryEntries = [...expired, ...atRisk]
      const allItemIds = [...new Set([...allExpiryEntries.map(e => e.itemId), ...activeAnomalyEntries.map(e => e.itemId)])]
      const allCompartmentIds = [...new Set([...allExpiryEntries.filter(e => e.compartmentId).map(e => e.compartmentId), ...activeAnomalyEntries.map(e => e.compartmentId)])]
      const [itemNames, compartmentNames] = await Promise.all([
        batchGetNames('materiels', allItemIds),
        batchGetNames('emplacements', allCompartmentIds),
      ])
      const toItem = (e: Entry): ExpiryAlertItem => ({
        itemId: e.itemId, itemName: itemNames.get(e.itemId) ?? '(matériel introuvable)',
        compartmentName: compartmentNames.get(e.compartmentId) ?? '(emplacement introuvable)',
        inventoryId: e.inventoryId, inventoryName: e.inventoryName,
        latestExpiryDate: e.latestExpiryDate, comment: e.comment, source: e.source,
      })
      const toAnomalyItem = (e: typeof activeAnomalyEntries[0]): AnomalyAlertItem => ({
        itemId: e.itemId, itemName: itemNames.get(e.itemId) ?? '(matériel introuvable)',
        compartmentName: compartmentNames.get(e.compartmentId) ?? '(emplacement introuvable)',
        inventoryId: e.inventoryId, inventoryName: e.inventoryName,
        comment: e.comment, controlId: e.controlId,
      })
      return ok({ anomalies: activeAnomalyEntries.map(toAnomalyItem), expired: expired.map(toItem), atRisk: atRisk.map(toItem) })
    } catch (error) {
      return err(`Impossible de calculer les alertes. Erreur: ${(error as Error).message}`)
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
