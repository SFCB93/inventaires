---
feature: cleanup-orphans
status: implemented
updated: 2026-06-29
---

# Spec — Nettoyage quotidien des documents orphelins

## Objectif

Supprimer chaque nuit les documents Firestore dont le document parent a été
supprimé, pour éviter l'accumulation de données mortes.

## Utilisateurs concernés

Aucun utilisateur direct — tâche de fond déclenchée par Vercel Cron.

## Parcours principal

1. Vercel déclenche le CRON selon le planning configuré dans `vercel.json`.
2. L'API route vérifie l'en-tête `Authorization: Bearer CRON_SECRET`.
3. Les orphelins sont identifiés et supprimés **de haut en bas** :
   a. `inventaires` dont `associationId` ne correspond à aucune `association`
   b. `emplacements` dont `inventoryId` ne correspond à aucun `inventaire`
      (y compris ceux supprimés à l'étape a)
   c. `materiels` dont `compartmentId` ne correspond à aucun `emplacement`
      (y compris ceux supprimés à l'étape b)
4. La route retourne un résumé JSON avec le nombre de documents supprimés par
   collection et les erreurs éventuelles.

## Parcours alternatifs et edge cases

- Appel sans `CRON_SECRET` valide → 401, rien n'est supprimé.
- Collection parente vide (ex : aucune association) → tous les enfants sont
  supprimés (comportement attendu).
- Erreur Firestore sur une collection → l'erreur est loguée dans le résumé,
  les autres collections continuent d'être traitées.
- Beaucoup d'orphelins → suppression en batches de 490 (limite Firestore : 500).
- Déclenchement manuel (debug) → comportement identique.

## Règles métier

- Un `inventaire` est orphelin si son `associationId` ne correspond à aucun
  document dans `associations`.
- Un `emplacement` est orphelin si son `inventoryId` ne correspond à aucun
  document dans `inventaires` **après** suppression des inventaires orphelins.
- Un `materiel` est orphelin si son `compartmentId` ne correspond à aucun
  document dans `emplacements` **après** suppression des emplacements orphelins.
- L'ordre de suppression est **top-down** (inventaires → emplacements →
  materiels) afin qu'une seule exécution nettoie toute une chaîne orpheline.
- Les `controles` ne sont pas nettoyés — ils constituent un historique et
  sont conservés même si l'inventaire parent est supprimé.
- La route est protégée par `Authorization: Bearer CRON_SECRET`, identique
  aux autres CRON de l'application.

## Composants UI à créer

Aucun.

## Use cases à implémenter

- `cleanupOrphansUseCase()` → `Result<CleanupReport>`

```ts
type CleanupReport = {
  deletedInventaires: number
  deletedEmplacements: number
  deletedMateriels: number
}
```

## Données

Collections lues et potentiellement modifiées :

| Collection     | Opération          | Champ de liaison  |
|----------------|--------------------|-------------------|
| `associations` | Lecture (IDs)      | —                 |
| `inventaires`  | Lecture + delete   | `associationId`   |
| `emplacements` | Lecture + delete   | `inventoryId`     |
| `materiels`    | Lecture + delete   | `compartmentId`   |

Pas de nouveaux champs ni de changement de schéma.

## Notifications mail

Aucune.

## Hors scope

- Nettoyage des `controles` orphelins (données historiques conservées intentionnellement).
- Suppression des photos Firebase Storage des matériels orphelins (Storage non utilisé).
- Interface admin de visualisation des orphelins avant suppression (dry-run).
- Nettoyage d'autres collections éventuelles futures.
