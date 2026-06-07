# Skill — Firestore

## SDK utilisé : Firebase Admin uniquement

Tous les accès Firestore se font côté serveur (Server Actions, Server Components,
API routes) via le SDK Admin. Il n'y a **pas** de client Firestore dans ce projet.

```ts
// shared/data/firebase-admin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export const adminDb = getFirestore()
```

Ne jamais exposer `adminDb` côté client. Ne jamais importer `firebase-admin`
dans un composant `'use client'`.

---

## Structure des collections

```
associations/
  {assocId}/
    name: string
    notificationEmails: string[]

inventaires/
  {inventaireId}/
    associationId: string
    name: string

emplacements/
  {emplacementId}/
    inventoryId: string
    name: string
    order: number

materiels/
  {materielId}/
    compartmentId: string
    name: string
    photoUrl: string
    hasExpiry: boolean
    isCritical: boolean
    order: number

controles/
  {controleId}/
    associationId: string
    inventoryId: string
    verifierName: string
    submittedAt: Timestamp
    results: Array<{
      itemId: string
      compartmentId: string
      status: 'ok' | 'anomaly'
      comment: string | null
      expiryDate: string | null    # format ISO 'YYYY-MM-DD'
    }>

corrections/
  {correctionId}/
    associationId: string
    inventoryId: string
    itemId: string
    expiryDate: string             # format ISO 'YYYY-MM-DD'
    correctedAt: Timestamp
```

---

## Pattern Repository

Chaque feature a son propre repository dans `features/[feature]/data/repository.ts`.
Le repository est la **seule** couche qui connaît `adminDb`.

```ts
// features/[feature]/data/repository.ts
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/shared/data/firebase-admin'
import type { Result } from '@/shared/domain/result'
import { ok, err } from '@/shared/domain/result'

export const myRepository = {
  async getAll(associationId: string): Promise<Result<Item[]>> {
    try {
      const snap = await adminDb
        .collection('items')
        .where('associationId', '==', associationId)
        .orderBy('order')
        .get()
      return ok(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Item)))
    } catch (error) {
      return err(`Impossible de charger les éléments : ${(error as Error).message}`)
    }
  },

  async create(data: CreateItemDto): Promise<Result<void>> {
    try {
      await adminDb.collection('items').add({
        ...data,
        createdAt: FieldValue.serverTimestamp(),
      })
      return ok(undefined)
    } catch (error) {
      return err(`Impossible de créer l'élément : ${(error as Error).message}`)
    }
  },
}
```

---

## Batching — limites Firestore

Firestore impose deux limites importantes :

| Opération | Limite | Helper |
|-----------|--------|--------|
| Requête `in` / `not-in` | 30 valeurs max | `chunkArray(ids, 30)` |
| Batch write | 500 opérations max | `chunkArray(refs, 490)` |

Toujours utiliser `chunkArray` de `@/shared/lib/array` :

```ts
import { chunkArray } from '@/shared/lib/array'

// Requêtes 'in' par lots de 30
const allDocs: FirebaseFirestore.QueryDocumentSnapshot[] = []
for (const chunk of chunkArray(ids, 30)) {
  const snap = await adminDb.collection('items').where('compartmentId', 'in', chunk).get()
  allDocs.push(...snap.docs)
}

// Batch writes par lots de 490
for (const chunk of chunkArray(refs, 490)) {
  const batch = adminDb.batch()
  chunk.forEach((ref) => batch.delete(ref))
  await batch.commit()
}
```

---

## Vérification d'appartenance (ownership)

Avant toute mutation (update, delete), vérifier que la ressource appartient
à l'association de l'utilisateur connecté.

```ts
// Dans le repository
async checkOwnership(inventoryId: string, associationId: string): Promise<Result<void>> {
  try {
    const doc = await adminDb.collection('inventaires').doc(inventoryId).get()
    if (!doc.exists) return err('Inventaire introuvable.')
    if (doc.data()!.associationId !== associationId) return err('Accès non autorisé.')
    return ok(undefined)
  } catch (error) {
    return err(`Erreur lors de la vérification : ${(error as Error).message}`)
  }
}

// Dans la Server Action, avant la mutation
const owned = await inventoryRepository.checkOwnership(inventoryId, user.associationId)
if (!owned.ok) return owned
```

Ne jamais omettre cette vérification pour les mutations, même si la route est
protégée par le middleware d'auth.

---

## Ce qu'il ne faut pas faire

- ❌ Importer `firebase-admin` ou `adminDb` dans un composant `'use client'`
- ❌ Utiliser le client SDK Firebase (`firebase/firestore`) — ce projet utilise Admin uniquement
- ❌ Oublier le try/catch — toujours retourner `Result<T>`
- ❌ Faire des requêtes `in` avec plus de 30 valeurs sans `chunkArray`
- ❌ Faire des batch writes avec plus de 490 opérations sans `chunkArray`
- ❌ Muter une ressource sans vérifier l'appartenance à l'association
- ❌ Stocker des données sensibles (clés, mots de passe) dans Firestore
