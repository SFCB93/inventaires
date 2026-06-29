// Dépasse 120 lignes : charge emplacements + matériels en cascade, dates de péremption précédentes, et persiste les contrôles.
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/shared/data/firebase-admin";
import { chunkArray, FIRESTORE_IN_LIMIT } from "@/shared/lib/array";
import { DEFAULT_ALERT_THRESHOLD_DAYS } from "@/shared/lib/alert-defaults";
import type { Result } from "@/shared/domain/result";
import { ok, err } from "@/shared/domain/result";
import type {
  CompartmentWithItems,
  ControlSubmission,
  FeedbackSubmission,
  Inventory,
  Item,
  PublicControlSummary,
} from "../domain/types";

const RECENT_CONTROLS_LIMIT = 10

export type LoadInventoryResult = {
  inventory: Inventory;
  compartments: CompartmentWithItems[];
  lastExpiryDates: Record<string, string>;
};

export const validatorRepository = {
  async loadInventory(
    inventoryId: string,
  ): Promise<Result<LoadInventoryResult>> {
    try {
      const inventoryDoc = await adminDb
        .collection("inventaires")
        .doc(inventoryId)
        .get();
      if (!inventoryDoc.exists) {
        return err("Cet inventaire n'existe pas ou a été supprimé.");
      }

      const inventoryData = inventoryDoc.data()!;
      const inventory: Inventory = {
        id: inventoryDoc.id,
        name: inventoryData.name,
        associationId: inventoryData.associationId,
      };

      // Requires composite index: (inventoryId ASC, order ASC)
      const compartmentsSnap = await adminDb
        .collection("emplacements")
        .where("inventoryId", "==", inventoryId)
        .orderBy("order")
        .get();

      if (compartmentsSnap.empty) {
        return err("Cet inventaire ne contient aucun matériel à contrôler.");
      }

      const compartmentIds = compartmentsSnap.docs.map((d) => d.id);

      const itemDocs: FirebaseFirestore.QueryDocumentSnapshot[] = []
      for (const chunk of chunkArray(compartmentIds, FIRESTORE_IN_LIMIT)) {
        const snap = await adminDb.collection("materiels").where("compartmentId", "in", chunk).get()
        itemDocs.push(...snap.docs)
      }
      const itemsSnap = { docs: itemDocs }

      const itemsByCompartment = new Map<string, Item[]>();
      for (const doc of itemsSnap.docs) {
        const data = doc.data();
        const item: Item = {
          id: doc.id,
          name: data.name,
          photoUrl: data.photoUrl ?? "",
          hasExpiry: data.hasExpiry ?? false,
          isCritical: data.isCritical ?? false,
          order: data.order ?? 0,
        };
        const list = itemsByCompartment.get(data.compartmentId) ?? [];
        list.push(item);
        itemsByCompartment.set(data.compartmentId, list);
      }

      for (const items of itemsByCompartment.values()) {
        items.sort((a, b) => a.order - b.order);
      }

      const compartments: CompartmentWithItems[] = compartmentsSnap.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            order: data.order,
            items: itemsByCompartment.get(doc.id) ?? [],
          };
        })
        .filter((c) => c.items.length > 0);

      if (compartments.length === 0) {
        return err("Cet inventaire ne contient aucun matériel à contrôler.");
      }

      return ok({ inventory, compartments, lastExpiryDates: {} });
    } catch (error) {
      return err(
        `Impossible de charger cet inventaire. Erreur: ${(error as Error).message}`,
      );
    }
  },

  async loadLastExpiryDates(
    inventoryId: string,
  ): Promise<Result<Record<string, string>>> {
    try {
      const snap = await adminDb
        .collection("controles")
        .where("inventoryId", "==", inventoryId)
        .get();
      const sorted = snap.docs
        .sort((a, b) => {
          const aMs = a.data().submittedAt?.toMillis?.() ?? 0
          const bMs = b.data().submittedAt?.toMillis?.() ?? 0
          return bMs - aMs
        })
        .slice(0, 3)
      const dates: Record<string, string> = {};
      for (const doc of sorted) {
        const results = doc.data().results as Array<{ itemId: string; expiryDate: string | null }>;
        for (const r of results) {
          if (r.expiryDate && !dates[r.itemId]) {
            dates[r.itemId] = r.expiryDate;
          }
        }
      }
      return ok(dates);
    } catch (error) {
      console.error('[loadLastExpiryDates]', (error as Error).message)
      return err(`Erreur chargement dates: ${(error as Error).message}`);
    }
  },

  async saveControl(
    submission: ControlSubmission,
    associationId: string,
  ): Promise<Result<{ controlId: string }>> {
    try {
      const ref = await adminDb.collection("controles").add({
        inventoryId: submission.inventoryId,
        associationId,
        verifierName: submission.verifierName,
        submittedAt: FieldValue.serverTimestamp(),
        results: submission.results.map((r) => ({
          itemId: r.itemId,
          compartmentId: r.compartmentId,
          status: r.status,
          comment: r.comment ?? null,
          expiryDate: r.expiryDate ?? null,
        })),
      });
      return ok({ controlId: ref.id });
    } catch (error) {
      return err(
        `Impossible d\'enregistrer le contrôle. Erreur: ${(error as Error).message}`,
      );
    }
  },

  async getAssociationEmails(associationId: string): Promise<Result<{ emails: string[]; name: string; alertThresholdDays: number }>> {
    try {
      const doc = await adminDb
        .collection("associations")
        .doc(associationId)
        .get();
      if (!doc.exists) return ok({ emails: [], name: '', alertThresholdDays: DEFAULT_ALERT_THRESHOLD_DAYS });
      const d = doc.data()!
      return ok({ emails: d.notificationEmails ?? [], name: d.name ?? '', alertThresholdDays: (d.alertThresholdDays as number | undefined) ?? DEFAULT_ALERT_THRESHOLD_DAYS });
    } catch {
      return ok({ emails: [], name: '', alertThresholdDays: DEFAULT_ALERT_THRESHOLD_DAYS }); // Non-blocking
    }
  },

  async saveFeedback(submission: FeedbackSubmission): Promise<Result<void>> {
    try {
      await adminDb.collection("feedbacks").add({
        controlId: submission.controlId,
        rating: submission.rating,
        comment: submission.comment,
        submittedAt: FieldValue.serverTimestamp(),
      })
      return ok(undefined)
    } catch (error) {
      return err(`Impossible d'enregistrer le feedback. Erreur: ${(error as Error).message}`)
    }
  },

  async listRecentControls(inventoryId: string): Promise<Result<PublicControlSummary[]>> {
    try {
      type RawResult = { itemId: string; compartmentId: string; status: string; comment?: string | null; expiryDate?: string | null }

      const snap = await adminDb
        .collection('controles')
        .where('inventoryId', '==', inventoryId)
        .orderBy('submittedAt', 'desc')
        .limit(RECENT_CONTROLS_LIMIT)
        .get()

      const itemIds = new Set<string>()
      const compartmentIds = new Set<string>()
      for (const doc of snap.docs) {
        for (const r of (doc.data().results ?? []) as RawResult[]) {
          if (r.status === 'anomaly' || r.expiryDate) {
            itemIds.add(r.itemId)
            compartmentIds.add(r.compartmentId)
          }
        }
      }

      const itemNames = new Map<string, string>()
      const compartmentNames = new Map<string, string>()
      await Promise.all([
        itemIds.size > 0
          ? adminDb.getAll(...[...itemIds].map(id => adminDb.collection('materiels').doc(id)))
              .then(docs => { for (const doc of docs) { if (doc.exists) itemNames.set(doc.id, doc.data()!.name as string) } })
          : null,
        compartmentIds.size > 0
          ? adminDb.getAll(...[...compartmentIds].map(id => adminDb.collection('emplacements').doc(id)))
              .then(docs => { for (const doc of docs) { if (doc.exists) compartmentNames.set(doc.id, doc.data()!.name as string) } })
          : null,
      ])

      const controls = snap.docs.map((doc) => {
        const data = doc.data()
        const results = (data.results ?? []) as RawResult[]
        const anomalies = results
          .filter(r => r.status === 'anomaly')
          .map(r => ({
            itemName: itemNames.get(r.itemId) ?? '(matériel supprimé)',
            compartmentName: compartmentNames.get(r.compartmentId) ?? '(emplacement supprimé)',
            comment: r.comment ?? '',
          }))
        return {
          id: doc.id,
          verifierName: data.verifierName as string,
          submittedAt: data.submittedAt?.toDate?.()?.toISOString() ?? new Date(0).toISOString(),
          anomalyCount: anomalies.length,
          anomalies,
          expiryDates: results
            .filter(r => r.expiryDate)
            .map(r => ({
              itemName: itemNames.get(r.itemId) ?? '(matériel supprimé)',
              compartmentName: compartmentNames.get(r.compartmentId) ?? '(emplacement supprimé)',
              date: r.expiryDate!,
            })),
        }
      })

      return ok(controls)
    } catch (error) {
      console.error('[listRecentControls] erreur', error)
      return err(`Impossible de charger les contrôles. Erreur: ${(error as Error).message}`)
    }
  },

  async getInventoryAssociationId(
    inventoryId: string,
  ): Promise<Result<string>> {
    try {
      const doc = await adminDb
        .collection("inventaires")
        .doc(inventoryId)
        .get();
      if (!doc.exists) return err("Inventaire introuvable.");
      return ok(doc.data()!.associationId as string);
    } catch (error) {
      return err(
        `Impossible de lire l'inventaire. Erreur: ${(error as Error).message}`,
      );
    }
  },
};
