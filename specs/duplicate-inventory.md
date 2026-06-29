---
feature: duplicate-inventory
status: implemented
updated: 2026-06-29
---

# Spec — Duplication d'un inventaire

## Objectif

Permettre à l'admin de dupliquer un inventaire existant en une copie complète
et indépendante (inventaire + emplacements + matériels), sans aucune référence
partagée avec l'original.

## Utilisateurs concernés

- [x] Responsable / Admin (backoffice, authentifié)

## Parcours principal

1. L'admin est sur la page `/dashboard/inventaires`.
2. Il clique sur le bouton "Dupliquer" d'un inventaire de la liste.
3. Le bouton passe en état chargement (désactivé).
4. Le système crée une copie complète : nouvel inventaire nommé
   "Copie de [nom original]", avec tous ses emplacements et tous leurs
   matériels (deep copy).
5. La liste se rafraîchit — la copie apparaît avec son nouveau nom.

## Parcours alternatifs et edge cases

- Inventaire sans emplacement → seul l'inventaire est dupliqué, la copie
  est vide. Comportement attendu.
- Emplacement sans matériel → l'emplacement est dupliqué vide.
- Erreur serveur → message d'erreur affiché sur la ligne de l'inventaire
  concerné, les autres inventaires ne sont pas affectés.
- Double-clic → le bouton est désactivé pendant l'opération, une seule
  duplication est déclenchée.
- Un inventaire très grand (> 490 matériels au total) → les écritures
  Firestore se font en batches successifs de 490.

## Règles métier

- La copie est entièrement indépendante de l'original. Modifier ou supprimer
  l'original n'affecte pas la copie, et inversement.
- Le nom de la copie est "Copie de [nom original]".
- `associationId` de la copie est identique à celui de l'original.
- Les champs `order` des emplacements et matériels sont préservés.
- Les `photoUrl` (base64) sont copiées telles quelles.
- La copie n'hérite pas de l'historique des contrôles de l'original.

## Composants UI à créer / modifier

- `InventoryListItem` — ajouter un bouton "Dupliquer" avec état chargement
  et affichage d'erreur inline.
- `useInventoryListPage` — ajouter `handleDuplicate(inventoryId)` et l'état
  associé (`duplicatingId`, `duplicateError`).

## Use cases à implémenter

- `duplicateInventoryUseCase(inventoryId, associationId)` → `Result<Inventory>`
  Lit l'inventaire source, crée la copie complète, retourne le nouvel inventaire.

## Données

Collections lues : `inventaires`, `emplacements`, `materiels`
Collections modifiées (création) : `inventaires`, `emplacements`, `materiels`

Pas de nouveau champ. Pas de changement de schéma.

## Notifications mail

Aucune.

## Hors scope

- Duplication partielle (sélectionner certains emplacements ou matériels).
- Renommer la copie à la création (le nom "Copie de …" est automatique).
- Référence entre l'original et la copie (feature future éventuelle).
- Duplication depuis la page de détail d'un inventaire.
