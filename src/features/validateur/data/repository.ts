import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/shared/data/firebase-admin";
import { chunkArray, FIRESTORE_IN_LIMIT } from "@/shared/lib/array";
import { DEFAULT_ALERT_THRESHOLD_DAYS } from "@/shared/lib/alert-defaults";
import type { Result } from "@/shared/domain/result";
import { ok, err } from "@/shared/domain/result";
import type {
  CompartmentWithItems,
  ControlSubmission,
  Inventory,
  Item,
} from "../domain/types";

export type LoadInventoryResult = {
  inventory: Inventory;
  compartments: CompartmentWithItems[];
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

      return ok({ inventory, compartments });
    } catch (error) {
      return err(
        `Impossible de charger cet inventaire. Erreur: ${(error as Error).message}`,
      );
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
