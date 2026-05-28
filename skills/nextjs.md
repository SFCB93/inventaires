# Skill — Next.js 15 (App Router)

## Conventions de routing

### Route groups
- `(backoffice)/` — pages authentifiées, layout avec sidebar
- `(frontoffice)/` — pages publiques, layout mobile-first

Le middleware Next.js protège `(backoffice)` :
```ts
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/(backoffice)/:path*']
}
```

### Co-localisation
Chaque route peut co-localiser ses propres composants si elle est la seule
à les utiliser. Les composants partagés entre routes vont dans `features/[feature]/ui/`.

---

## Server vs Client components

**Par défaut : Server Component.**
Ajouter `'use client'` uniquement si le composant a besoin de :
- hooks React (useState, useEffect, useCallback...)
- event listeners (onClick, onChange...)
- Zustand store
- accès au browser (window, localStorage...)

**Règle** : les Server Components fetchen les données et les passent en props
aux Client Components. Ne pas fetcher dans les Client Components sauf
via Server Actions ou mutation.

---

## Server Actions

Utiliser les Server Actions pour les mutations (create, update, delete).
Ne pas créer de route API REST pour ça.

```ts
// features/sacs/domain/actions.ts
'use server'

import { ok } from '@/shared/domain/result'
import type { Result } from '@/shared/domain/result'
import { createSacUseCase } from './use-cases'
import { revalidatePath } from 'next/cache'

export async function createSacAction(formData: FormData): Promise<Result<void>> {
  const nom = formData.get('nom') as string
  const result = await createSacUseCase({ nom })
  if (!result.ok) return result
  revalidatePath('/dashboard/sacs')
  return ok(undefined)
}
```

Les Server Actions retournent `Result<T>`, jamais de throw.
Ne jamais retourner `{ error } | { success }` ou exposer des IDs internes.

---

## Data fetching

Fetcher dans les Server Components via les use cases directement
(pas de fetch HTTP interne) :

```ts
// app/(backoffice)/dashboard/sacs/page.tsx
import { getSacsUseCase } from '@/features/sacs/domain/use-cases'

export default async function SacsPage() {
  const result = await getSacsUseCase()
  if (!result.ok) return <ErrorState message={result.error} />
  return <SacsListe sacs={result.value} />
}
```

---

## Layouts

- `app/layout.tsx` — layout racine (fonts, providers globaux)
- `app/(backoffice)/layout.tsx` — sidebar, header, vérification auth
- `app/(frontoffice)/layout.tsx` — layout mobile plein écran

---

## Conventions de nommage fichiers

| Type | Convention | Exemple |
|------|-----------|---------|
| Page | `page.tsx` | `app/(backoffice)/dashboard/sacs/page.tsx` |
| Layout | `layout.tsx` | `app/(backoffice)/layout.tsx` |
| Server Action | `actions.ts` | `features/sacs/domain/actions.ts` |
| Use case | `use-cases.ts` | `features/sacs/domain/use-cases.ts` |
| Repository | `repository.ts` | `features/sacs/data/repository.ts` |
| Hook | `use-[nom].ts` | `features/sacs/ui/use-sacs.ts` |
| Composant | PascalCase | `features/sacs/ui/SacCard.tsx` |

---

## Providers

Wrapper les providers Firebase et Zustand dans un composant client dédié :

```ts
// shared/ui/Providers.tsx
'use client'

export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

Importer dans `app/layout.tsx` uniquement. Pas de client Firebase dans ce projet — tous les accès Firestore passent par le SDK Admin côté serveur.

---

## Ce qu'il ne faut pas faire

- ❌ Fetcher Firestore dans un Client Component (sauf cas justifié avec listener temps réel)
- ❌ Créer des routes API REST pour des mutations simples → utiliser Server Actions
- ❌ Importer des modules Node-only dans des Client Components
- ❌ Mettre de la logique métier dans les pages ou les layouts
