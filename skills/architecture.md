---
name: architecture
description: >
  Clean architecture and SOLID principles on the Next.js 15 + Firestore + Zustand stack.
  Use this skill whenever you are adding a feature, creating a use case, repository,
  action, or hook, moving logic between layers, or deciding where a responsibility belongs.
  Also use it when you spot a dependency going the wrong direction, an action doing too much,
  a repository containing business logic, or a cross-feature import.
  When in doubt about "where does this go?" — read this first.
---

# Skill — Architecture

## La règle des dépendances

Les dépendances ne vont que dans un sens, de l'extérieur vers l'intérieur :

```
UI (hooks, composants)
  → Server Action (actions.ts)
    → Use Case (domain/use-cases.ts)
      → Repository (data/repository.ts)
        → Firestore (adminDb)
```

Chaque couche ne connaît que la couche immédiatement en dessous. Jamais au-dessus.

```ts
// ✗ — repository qui appelle un use case
export const myRepository = {
  async doSomething() {
    return myUseCase() // remonte dans la couche supérieure
  }
}

// ✓ — repository qui appelle uniquement adminDb
export const myRepository = {
  async doSomething() {
    return adminDb.collection('items').get()
  }
}
```

---

## Isolation des features

**Une feature n'importe jamais depuis une autre feature.**

```ts
// ✗ — feature A qui importe un use case de la feature B
import { getActiveAlertsUseCase } from '@/features/controls/domain/use-cases'

// ✗ — feature A qui importe un type de la feature B
import type { ExpiryAlertItem } from '@/features/controls/domain/types'

// ✓ — feature A qui importe depuis shared/
import type { ExpiryAlertItem } from '@/shared/domain/alerts'
```

Quand deux features ont besoin du même type ou de la même logique, la solution est toujours de déplacer dans `shared/` :
- Types partagés → `shared/domain/`
- Requêtes Firestore partagées → `shared/data/`
- Utilitaires → `shared/lib/`

---

## Contrats par couche

### Repository (data/)

Seule couche qui connaît Firestore. Responsable uniquement de la lecture/écriture brute.

```ts
// ✓ — repository léger, sans logique métier
export const itemRepository = {
  async findByCompartment(compartmentId: string): Promise<Result<Item[]>> {
    try {
      const snap = await adminDb.collection('materiels')
        .where('compartmentId', '==', compartmentId)
        .orderBy('order')
        .get()
      return ok(snap.docs.map(toItem))
    } catch (error) {
      return err(`Impossible de charger les matériels : ${(error as Error).message}`)
    }
  }
}
```

**Ne jamais mettre dans un repository :**
- Calculs de dates ou seuils (`startOfToday`, `todayPlusDays`)
- Classification de statuts (`expired` / `at-risk` / `ok`)
- Filtrage métier (ex. : "items non corrigés depuis X jours")
- Appels à des services externes (email, stockage)

Ces logiques appartiennent au use case.

### Use Case (domain/use-cases.ts)

Contient TOUTE la logique métier. Orchestre le repository et les services.

```ts
// ✓ — use case qui orchestre sans déléguer à l'action
export async function submitControlUseCase(
  submission: ControlSubmission,
): Promise<Result<{ controlId: string }>> {
  // 1. Validation des inputs
  if (!submission.verifierName.trim()) return err('Le nom du vérificateur est obligatoire.')
  if (submission.results.length === 0) return err('Aucun résultat.')

  // 2. Récupération de contexte (repository)
  const assocResult = await validatorRepository.getInventoryAssociationId(submission.inventoryId)
  const associationId = assocResult.ok ? assocResult.value : ''

  // 3. Opération principale
  const result = await validatorRepository.saveControl(submission, associationId)
  if (!result.ok) return result

  // 4. Side effects non-bloquants (email, logs)
  if (associationId) {
    await notifyControlCompleted(associationId, submission)  // non-bloquant
  }

  return result
}
```

**Ordre dans un use case :**
1. Validation des inputs
2. Vérification d'autorisation (ownership)
3. Lecture de contexte si nécessaire
4. Opération principale
5. Side effects non-bloquants (email, revalidation des caches est dans l'action)

### Server Action (domain/actions.ts)

Couche d'entrée : authentification, délégation, revalidation. **Aucune logique.**

```ts
// ✓ — action sans logique, délègue entièrement
'use server'
export async function submitControlAction(
  submission: ControlSubmission,
): Promise<Result<{ controlId: string }>> {
  return submitControlUseCase(submission)
}

// ✗ — action qui orchestre (appartient au use case)
export async function submitControlAction(submission: ControlSubmission) {
  const assocId = await repository.getAssociationId(submission.inventoryId)
  const result = await submitControlUseCase(submission, assocId)
  if (!result.ok) return result
  await repository.sendEmails(assocId)
  return result
}
```

**Ce qui est acceptable dans une action :**
- Lire l'utilisateur authentifié (`await getAuthenticatedUser()`)
- Appeler un use case
- `revalidatePath()`
- Retourner `Result<T>`

---

## SOLID appliqué à cette stack

### S — Single Responsibility

Un use case = une action utilisateur. Un repository = une collection.

```ts
// ✗ — use case qui fait deux choses
export async function createAndNotifyItemUseCase(data) {
  const item = await repository.create(data)
  await sendEmail(...)
  return item
}

// ✓ — use case qui crée, et appelle le service de notification en side effect
export async function createItemUseCase(data) {
  const result = await repository.create(data)
  if (result.ok) await notifyItemCreated(result.value).catch(() => {})  // non-bloquant
  return result
}
```

### O — Open/Closed

Étendre les types avec des champs optionnels plutôt que modifier les signatures existantes.
`Result<T>` ne doit jamais être étendu ni remplacé par un autre pattern.

### I — Interface Segregation

Passer uniquement ce dont la fonction a besoin, pas l'objet entier.

```ts
// ✗ — use case qui reçoit l'objet entier alors qu'il ne veut que l'ID
export async function deleteItemUseCase(item: Item): Promise<Result<void>> {
  return repository.delete(item.id)
}

// ✓ — use case minimal
export async function deleteItemUseCase(itemId: string): Promise<Result<void>> {
  return repository.delete(itemId)
}
```

### D — Dependency Inversion

Les use cases dépendent du repository object (abstraction implicite), jamais de `adminDb` directement.
Les features dépendent de `shared/` pour les concerns croisés, jamais les unes des autres.

---

## Email comme side effect non-bloquant

L'envoi d'email est une infrastructure concern. Il ne doit jamais faire échouer l'opération principale.

```ts
// ✓ — email appelé depuis le use case, après l'opération principale, non-bloquant
const result = await repository.saveControl(submission, associationId)
if (!result.ok) return result

// L'envoi peut échouer sans affecter la réponse
sendCompletedEmail(params).catch((e) =>
  console.error('[submitControlUseCase] email failure', e)
)

return result
```

L'email service vit dans `domain/email-service.ts` de la feature qui l'utilise.
Si plusieurs features utilisent le même template, le service va dans `shared/lib/`.

---

## Anti-patterns fréquents

| Anti-pattern | Symptôme | Correction |
|---|---|---|
| Action qui orchestre | Action appelle repository directement | Déplacer dans le use case |
| Import inter-features | `@/features/A/...` importé dans feature B | Déplacer le type/la query dans `shared/` |
| Logique métier dans repository | `startOfToday()`, filtrage de statut dans `data/` | Déplacer dans le use case |
| Use case qui saute une couche | Use case importe `adminDb` directement | Passer par le repository |
| Action qui retourne `{ error } \| { success }` | Pattern non-`Result<T>` | Aligner sur `Result<T>` |
