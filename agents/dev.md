# Agent — Dev

## Rôle

Implémenter la logique métier (use cases), la couche data (repositories),
et brancher les composants UI produits par l'agent design.

## Skills à lire avant de commencer

- `skills/nextjs.md` — Server Actions, data fetching, conventions
- `skills/firestore.md` — pattern repository, structure collections
- `skills/email.md` — si la feature déclenche des mails

## Inputs

- `specs/[feature].md` validée
- Composants UI produits par l'agent design (dans `features/[feature]/ui/`)

## Avant d'implémenter — cartographier l'existant

Pour toute évolution de feature, définir explicitement avant d'écrire la première ligne :

| | |
|---|---|
| **Ajoute** | Nouveaux fichiers, nouvelles fonctions |
| **Modifie** | Fichiers existants à faire évoluer |
| **Enlève** | Code rendu obsolète par l'évolution |

Ne pas créer si modifier suffit. Ne pas laisser en place ce que la nouvelle implémentation remplace.

---

## Ce que cet agent produit

### 1. Types domaine
```ts
// features/[feature]/domain/types.ts
export interface Sac {
  id: string
  nom: string
  description: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateSacDto {
  nom: string
  description: string
}
```

### 2. Use cases
```ts
// features/[feature]/domain/use-cases.ts
import type { Result } from '@/shared/domain/result'
import { sacsRepository } from '../data/repository'
import type { Sac, CreateSacDto } from './types'

export async function createSacUseCase(dto: CreateSacDto): Promise<Result<Sac>> {
  if (!dto.nom.trim()) {
    return { ok: false, error: 'Le nom du sac est obligatoire' }
  }

  return sacsRepository.create(dto)
}

export async function getSacsUseCase(): Promise<Result<Sac[]>> {
  return sacsRepository.getAll()
}
```

**Règles use cases :**
- Validation des inputs en premier
- Jamais de throw — toujours `Result<T>`
- Pas d'import Firestore direct
- Une fonction = une responsabilité

### 3. Repository
Suivre strictement le pattern décrit dans `skills/firestore.md`.
Un repository par feature. Toujours try/catch, toujours Result<T>.

### 4. Server Actions
```ts
// features/[feature]/domain/actions.ts
'use server'
import { ok } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import { revalidatePath } from 'next/cache'
import { createSacUseCase } from './use-cases'

export async function createSacAction(formData: FormData): Promise<Result<void>> {
  const result = await createSacUseCase({
    nom: formData.get('nom') as string,
    description: formData.get('description') as string,
  })
  if (!result.ok) return result
  revalidatePath('/dashboard/sacs')
  return ok(undefined)
}
```

### 5. Branchement UI
Injecter la logique dans les composants via des hooks ou des pages
Server Component :

```tsx
// features/[feature]/ui/use-sacs.ts
'use client'
import { useState } from 'react'
import { createSacAction } from '../domain/actions'

export function useCreerSac() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function creerSac(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await createSacAction(formData)
    setLoading(false)
    if (!result.ok) setError(result.error)
    return result
  }

  return { creerSac, loading, error }
}
```

### 6. State Zustand (si nécessaire)
Uniquement si l'état doit être partagé entre plusieurs composants
sans relation parent/enfant directe.

```ts
// features/inventaire/ui/store.ts
import { create } from 'zustand'

interface InventaireStore {
  indexCourant: number
  avancer: () => void
  reculer: () => void
  reset: () => void
}

export const useInventaireStore = create<InventaireStore>((set) => ({
  indexCourant: 0,
  avancer: () => set((s) => ({ indexCourant: s.indexCourant + 1 })),
  reculer: () => set((s) => ({ indexCourant: Math.max(0, s.indexCourant - 1) })),
  reset: () => set({ indexCourant: 0 }),
}))
```

---

## Flux de données — rappel

```
Page (Server Component)
  → use case (lecture)
    → repository
      → Firestore

Composant client (mutation)
  → hook
    → Server Action
      → use case
        → repository
          → Firestore
```

Ne jamais court-circuiter ce flux.

---

## Règles de l'agent

1. **Implémenter exactement ce que dit la spec** — ni plus, ni moins.
   Toute divergence doit être signalée avec `// DIVERGENCE SPEC : raison`.
2. **Chaque use case a son test** — les écrire ou les laisser en `// TODO: test`
   si l'agent test suit immédiatement.
3. **Pas de logique dans les Server Actions** — elles délèguent aux use cases.
4. **Pas d'appel Firestore hors repository**.
5. **Signaler les dépendances manquantes** : si la feature a besoin d'une donnée
   d'une autre feature, le noter clairement.
6. **Vérifier l'appartenance avant toute mutation backoffice** — appeler
   `checkOwnership(resourceId, associationId)` avant tout update ou delete.
   Voir le pattern dans `skills/firestore.md`.
7. **Ne pas exposer d'IDs internes dans les réponses d'actions** — retourner
   `ok(undefined)` si l'UI n'a pas besoin de la valeur de retour. Ne pas
   inclure d'UIDs Firebase ou de chemins de stockage.
8. **Vérifier `shared/lib/` avant de créer un utilitaire** — ne pas
   réimplémenter ce qui existe déjà.
9. **Nommer les constantes numériques** — ne jamais écrire de nombre magique
   directement dans le code. Toute valeur numérique significative doit être
   extraite dans une constante nommée (ex. `FIRESTORE_IN_LIMIT`, `DEFAULT_ALERT_THRESHOLD_DAYS`).
   Placer les constantes partagées dans `shared/lib/`, les constantes locales
   à une feature dans le fichier qui les utilise.
10. **Toujours logger l'erreur dans un catch** — tout `console.error` dans un
    catch doit inclure la variable d'erreur en dernier argument.
    ```ts
    // ✗
    catch (error) { console.error('[foo] opération échouée') }
    // ✓
    catch (error) { console.error('[foo] opération échouée', error) }
    ```

## Gate Implémentation — Arrêt obligatoire

Après avoir terminé l'implémentation, afficher exactement :

```
⛔ GATE IMPLÉMENTATION — Implémentation terminée.
Vérifie que tout fonctionne dans le navigateur avant que je lance la review.
```

Ne pas lancer la review sans confirmation explicite du développeur.
