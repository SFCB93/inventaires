import { adminDb } from '@/shared/data/firebase-admin'
import { ok, err } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import { chunkArray } from '@/shared/lib/array'
import type { CleanupReport } from '../domain/types'

async function deleteOrphans(
  collectionName: string,
  foreignKey: string,
  validParentIds: Set<string>,
): Promise<{ deleted: number; error?: string }> {
  try {
    const snap = await adminDb.collection(collectionName).get()
    const orphanRefs = snap.docs
      .filter((d) => !validParentIds.has(d.data()[foreignKey] as string))
      .map((d) => adminDb.collection(collectionName).doc(d.id))

    for (const chunk of chunkArray(orphanRefs, 490)) {
      const batch = adminDb.batch()
      chunk.forEach((ref) => batch.delete(ref))
      await batch.commit()
    }

    return { deleted: orphanRefs.length }
  } catch (error) {
    return { deleted: 0, error: `${collectionName}: ${(error as Error).message}` }
  }
}

export async function cleanupOrphans(): Promise<Result<CleanupReport>> {
  try {
    const assocSnap = await adminDb.collection('associations').get()
    const assocIds = new Set(assocSnap.docs.map((d) => d.id))
    const inv = await deleteOrphans('inventaires', 'associationId', assocIds)

    const invSnap = await adminDb.collection('inventaires').get()
    const invIds = new Set(invSnap.docs.map((d) => d.id))
    const emp = await deleteOrphans('emplacements', 'inventoryId', invIds)

    const empSnap = await adminDb.collection('emplacements').get()
    const empIds = new Set(empSnap.docs.map((d) => d.id))
    const mat = await deleteOrphans('materiels', 'compartmentId', empIds)

    const errors = [inv.error, emp.error, mat.error].filter(Boolean) as string[]
    return ok({
      deletedInventaires: inv.deleted,
      deletedEmplacements: emp.deleted,
      deletedMateriels: mat.deleted,
      errors,
    })
  } catch (error) {
    return err(`Erreur fatale lors du nettoyage : ${(error as Error).message}`)
  }
}
