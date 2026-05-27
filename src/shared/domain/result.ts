// shared/domain/result.ts
// Type Result<T> utilisé par tous les use cases du projet.
// Un use case ne throw jamais — il retourne toujours un Result.

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string }

// Helper pour créer un succès
export function ok<T>(value: T): Result<T> {
  return { ok: true, value }
}

// Helper pour créer une erreur
export function err<T>(error: string): Result<T> {
  return { ok: false, error }
}
