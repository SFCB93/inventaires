// Dépasse 120 lignes : agrège contrôles, corrections et anomalies depuis plusieurs collections Firestore.
import { FieldPath } from "firebase-admin/firestore";
import { adminDb } from "@/shared/data/firebase-admin";
import { chunkArray, FIRESTORE_IN_LIMIT } from "@/shared/lib/array";
import { DEFAULT_ALERT_THRESHOLD_DAYS } from "@/shared/lib/alert-defaults";
import { startOfToday, todayPlusDays } from "@/shared/lib/dates";
import type { Result } from "@/shared/domain/result";
import { ok, err } from "@/shared/domain/result";
import type {
  ExpiryAlertItem,
  AnomalyAlertItem,
  ActiveAlertsReport,
} from "@/shared/domain/alerts";

async function fetchAlertThreshold(associationId: string): Promise<number> {
  try {
    const doc = await adminDb
      .collection("associations")
      .doc(associationId)
      .get();
    return (
      (doc.data()?.alertThresholdDays as number | undefined) ??
      DEFAULT_ALERT_THRESHOLD_DAYS
    );
  } catch (error) {
    console.error("[fetchAlertThreshold]", error);
    return DEFAULT_ALERT_THRESHOLD_DAYS;
  }
}

async function batchGetNames(
  collectionName: string,
  ids: string[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (ids.length === 0) return result;
  for (const chunk of chunkArray(ids, FIRESTORE_IN_LIMIT)) {
    const snap = await adminDb
      .collection(collectionName)
      .where(FieldPath.documentId(), "in", chunk)
      .get();
    for (const doc of snap.docs) result.set(doc.id, doc.data().name ?? "");
  }
  return result;
}

export async function getActiveAlerts(
  associationId: string,
  providedThreshold?: number,
  includeAnomalies = true,
): Promise<Result<ActiveAlertsReport>> {
  try {
    const [inventoriesSnap, thresholdDays] = await Promise.all([
      adminDb
        .collection("inventaires")
        .where("associationId", "==", associationId)
        .get(),
      providedThreshold !== undefined
        ? Promise.resolve(providedThreshold)
        : fetchAlertThreshold(associationId),
    ]);
    if (inventoriesSnap.empty)
      return ok({ anomalies: [], expired: [], atRisk: [] });
    const inventoryIds = inventoriesSnap.docs.map((d) => d.id);
    const inventoryNames = new Map(
      inventoriesSnap.docs.map((d) => [d.id, (d.data().name as string) ?? ""]),
    );

    type Entry = {
      itemId: string;
      inventoryId: string;
      inventoryName: string;
      compartmentId: string;
      latestExpiryDate: string;
      comment: string | null;
      recordedAtMs: number;
      source: "control" | "correction";
    };
    const entries = new Map<string, Entry>();
    const allControlDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
    for (const chunk of chunkArray(inventoryIds, FIRESTORE_IN_LIMIT)) {
      const snap = await adminDb
        .collection("controles")
        .where("inventoryId", "in", chunk)
        .get();
      allControlDocs.push(...snap.docs);
    }
    // Sort oldest first so the most recent control always overwrites previous ones
    allControlDocs.sort(
      (a, b) =>
        (a.data().submittedAt?.toMillis() ?? 0) -
        (b.data().submittedAt?.toMillis() ?? 0),
    );

    type StatusEntry = {
      itemId: string;
      inventoryId: string;
      inventoryName: string;
      compartmentId: string;
      comment: string | null;
      controlId: string;
      recordedAtMs: number;
    };
    const latestStatus = new Map<string, { status: string } & StatusEntry>();
    for (const doc of allControlDocs) {
      const d = doc.data();
      const recordedAtMs: number = d.submittedAt?.toMillis() ?? 0;
      for (const r of d.results ?? []) {
        const key = `${r.itemId}|${d.inventoryId}`;
        if (r.expiryDate) {
          entries.set(key, {
            itemId: r.itemId,
            inventoryId: d.inventoryId,
            inventoryName: inventoryNames.get(d.inventoryId) ?? "",
            compartmentId: r.compartmentId,
            latestExpiryDate: r.expiryDate,
            comment: r.comment ?? null,
            recordedAtMs,
            source: "control",
          });
        }
        latestStatus.set(key, {
          status: r.status,
          itemId: r.itemId,
          inventoryId: d.inventoryId,
          inventoryName: inventoryNames.get(d.inventoryId) ?? "",
          compartmentId: r.compartmentId,
          comment: r.comment ?? null,
          controlId: doc.id,
          recordedAtMs,
        });
      }
    }

    const correctionsSnap = await adminDb
      .collection("corrections")
      .where("associationId", "==", associationId)
      .get();
    for (const doc of correctionsSnap.docs) {
      const d = doc.data();
      const key = `${d.itemId}|${d.inventoryId}`;
      const existing = entries.get(key);
      const correctedAtMs: number = d.correctedAt?.toMillis() ?? 0;
      // Correction wins only if it is more recent than the last control that recorded a date
      if (!existing || correctedAtMs >= existing.recordedAtMs) {
        entries.set(key, {
          itemId: d.itemId,
          inventoryId: d.inventoryId,
          inventoryName: inventoryNames.get(d.inventoryId) ?? "",
          compartmentId: existing?.compartmentId ?? "",
          latestExpiryDate: d.newExpiryDate,
          comment: existing?.comment ?? null,
          recordedAtMs: correctedAtMs,
          source: "correction",
        });
      }
    }

    const now = startOfToday();
    const risk = todayPlusDays(thresholdDays);
    const expired: Entry[] = [];
    const atRisk: Entry[] = [];
    for (const entry of entries.values()) {
      const d = new Date(entry.latestExpiryDate);
      if (d <= now) expired.push(entry);
      else if (d <= risk) atRisk.push(entry);
    }

    // Active anomalies: items whose latest control result is 'anomaly', not corrected since
    let activeAnomalyEntries: StatusEntry[] = [];
    if (includeAnomalies) {
      activeAnomalyEntries = [...latestStatus.values()].filter(
        (e) => e.status === "anomaly",
      );
      if (activeAnomalyEntries.length > 0) {
        const anomalyCorrectionsSnap = await adminDb
          .collection("anomaly_corrections")
          .where("associationId", "==", associationId)
          .get();
        const latestAnomalyCorrection = new Map<string, number>();
        for (const doc of anomalyCorrectionsSnap.docs) {
          const d = doc.data();
          const key = `${d.itemId}|${d.inventoryId}`;
          const correctedAtMs: number = d.correctedAt?.toMillis() ?? 0;
          if (correctedAtMs > (latestAnomalyCorrection.get(key) ?? 0))
            latestAnomalyCorrection.set(key, correctedAtMs);
        }
        activeAnomalyEntries = activeAnomalyEntries.filter((a) => {
          const correctedAtMs =
            latestAnomalyCorrection.get(`${a.itemId}|${a.inventoryId}`) ?? 0;
          return correctedAtMs < a.recordedAtMs;
        });
      }
    }

    if (
      expired.length === 0 &&
      atRisk.length === 0 &&
      activeAnomalyEntries.length === 0
    )
      return ok({ anomalies: [], expired: [], atRisk: [] });

    const allExpiryEntries = [...expired, ...atRisk];
    const allItemIds = [
      ...new Set([
        ...allExpiryEntries.map((e) => e.itemId),
        ...activeAnomalyEntries.map((e) => e.itemId),
      ]),
    ];
    const allCompartmentIds = [
      ...new Set([
        ...allExpiryEntries
          .filter((e) => e.compartmentId)
          .map((e) => e.compartmentId),
        ...activeAnomalyEntries.map((e) => e.compartmentId),
      ]),
    ];
    const [itemNames, compartmentNames] = await Promise.all([
      batchGetNames("materiels", allItemIds),
      batchGetNames("emplacements", allCompartmentIds),
    ]);

    const toItem = (e: Entry): ExpiryAlertItem => ({
      itemId: e.itemId,
      itemName: itemNames.get(e.itemId) ?? "(matériel introuvable)",
      compartmentName:
        compartmentNames.get(e.compartmentId) ?? "(emplacement introuvable)",
      inventoryId: e.inventoryId,
      inventoryName: e.inventoryName,
      latestExpiryDate: e.latestExpiryDate,
      comment: e.comment,
      source: e.source,
    });
    const toAnomalyItem = (e: StatusEntry): AnomalyAlertItem => ({
      itemId: e.itemId,
      itemName: itemNames.get(e.itemId) ?? "(matériel introuvable)",
      compartmentName:
        compartmentNames.get(e.compartmentId) ?? "(emplacement introuvable)",
      inventoryId: e.inventoryId,
      inventoryName: e.inventoryName,
      comment: e.comment,
      controlId: e.controlId,
    });

    return ok({
      anomalies: activeAnomalyEntries.map(toAnomalyItem),
      expired: expired.map(toItem),
      atRisk: atRisk.map(toItem),
    });
  } catch (error) {
    return err(
      `Impossible de calculer les alertes. Erreur: ${(error as Error).message}`,
    );
  }
}
