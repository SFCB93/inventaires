import { adminStorage } from '@/shared/data/firebase-admin'

export async function deleteStorageFile(path: string): Promise<void> {
  try {
    await adminStorage.bucket().file(path).delete()
  } catch {
    // Non-blocking: continue if photo deletion fails
  }
}
