---
feature: gestion-inventaires
status: implemented
updated: 2026-06-29
---

# Spec — Gestion des inventaires, emplacements et matériels (backoffice)

## Objectif

Permettre à un responsable d'association de créer et maintenir la structure complète de ses inventaires (emplacements et matériels) depuis le backoffice authentifié.

## Utilisateurs concernés

- [ ] Secouriste (frontoffice, non authentifié)
- [x] Responsable / Admin (backoffice, authentifié)

---

## Parcours principal

### Gestion des inventaires

1. L'admin est connecté et navigue vers `/dashboard/inventaires`.
2. Il voit la liste de tous les inventaires de son association (nom, nombre d'emplacements).
3. Il clique sur **Créer un inventaire** → un formulaire apparaît (nom).
4. À la validation, l'inventaire est créé et l'admin est redirigé vers sa page détail.
5. Sur la page détail (`/dashboard/inventaires/[inventaireId]`), il voit :
   - Le nom de l'inventaire (modifiable en ligne)
   - La liste de ses emplacements, ordonnés par `order`, avec leurs matériels
   - Un bouton **Ajouter un emplacement**
6. Il peut modifier le nom de l'inventaire directement sur la page.
7. Il peut supprimer l'inventaire depuis cette page.

### Duplication d'un inventaire

8. Sur la liste des inventaires, chaque ligne dispose d'un bouton **Dupliquer**.
9. L'admin clique sur **Dupliquer** → état de chargement sur le bouton.
10. Un nouvel inventaire est créé avec :
    - Nom : `[nom original] (copie)`
    - Tous les emplacements dupliqués (nouveaux IDs, mêmes noms, même `order`)
    - Tous les matériels dupliqués dans leurs emplacements respectifs
      (nouveaux IDs, mêmes noms, même `photoUrl`, mêmes `hasExpiry`, `isCritical`, `order`)
11. Le nouvel inventaire apparaît dans la liste. L'admin reste sur la page liste.

### Gestion des emplacements

8. L'admin clique **Ajouter un emplacement** → formulaire inline (nom).
9. À la validation, l'emplacement apparaît en bas de la liste avec `order` = dernier + 1.
10. Il peut modifier le nom d'un emplacement en cliquant dessus.
11. Il peut réordonner les emplacements par drag & drop — le champ `order` est mis à jour.
12. Il peut supprimer un emplacement (avec ses matériels).

### Gestion des matériels

13. Dans chaque emplacement, l'admin voit la liste des matériels ordonnés par `order`.
14. Il clique **Ajouter un matériel** → formulaire inline : nom (obligatoire), URL photo (optionnel), `isCritical` (case à cocher, décochée par défaut).
15. À la validation, le matériel apparaît dans l'emplacement.
16. Il peut modifier un matériel (nom, URL photo, `isCritical`) en cliquant dessus.
17. Il peut réordonner les matériels par drag & drop dans leur emplacement.
18. Il peut supprimer un matériel.

---

## Parcours alternatifs et edge cases

- Si la liste des inventaires est vide → message "Aucun inventaire. Créez-en un !" avec le bouton de création.
- Si un inventaire n'a pas encore d'emplacements → message "Aucun emplacement. Ajoutez-en un !" sur sa page détail.
- Si un emplacement n'a pas encore de matériels → message "Aucun matériel. Ajoutez-en un !" dans sa section.
- Si le nom de l'inventaire est vide à la validation → message d'erreur inline, pas de création.
- Si le nom de l'emplacement est vide → message d'erreur inline, pas de création.
- Si le nom du matériel est vide → message d'erreur inline, pas de création.
- Si la suppression d'un inventaire est demandée → confirmation obligatoire avant suppression ("Supprimer cet inventaire et tout son contenu ?").
- Si la suppression d'un emplacement est demandée → confirmation obligatoire ("Supprimer cet emplacement et ses matériels ?").
- Si une erreur réseau survient lors d'une mutation → message d'erreur non bloquant, l'action peut être retentée.
- Si la duplication échoue en cours de route → les documents partiellement créés seront supprimés par le CRON de nettoyage des orphelins ; un message d'erreur s'affiche à l'admin.
- Si l'admin accède à l'URL d'un inventaire qui n'appartient pas à son association → page 404.
- Si l'utilisateur n'est pas authentifié → redirigé vers la page de login par le middleware.

---

## Règles métier

- Un admin ne peut voir et gérer que les inventaires de **son association** (`associationId` issu de son profil auth).
- Le nom d'un inventaire est **obligatoire** et non vide.
- Le nom d'un emplacement est **obligatoire** et non vide.
- Le nom d'un matériel est **obligatoire** et non vide.
- La photo d'un matériel est **optionnelle**. Si absente, le frontoffice affiche "Pas de photo".
- `isCritical` est un booléen, **faux par défaut**.
- L'ordre des emplacements est défini par le champ `order` (entier croissant). Le drag & drop le met à jour.
- L'ordre des matériels est défini par le champ `order` au sein de leur emplacement. Le drag & drop le met à jour.
- La suppression d'un inventaire supprime en cascade tous ses emplacements et leurs matériels.
- La suppression d'un emplacement supprime en cascade tous ses matériels.
- Les contrôles existants (`controles`) ne sont **pas supprimés** lors de la suppression d'un inventaire : ils restent à titre d'historique.
- Un inventaire appartient à une seule association ; cette appartenance ne peut pas être changée après création.
- La duplication produit une **copie indépendante** — aucune référence partagée entre l'original et la copie.
- La `photoUrl` (base64) est copiée telle quelle — c'est une donnée, pas une référence externe.
- `photoStoragePath` reste `''` dans la copie (Firebase Storage hors scope).
- Le nom de la copie est `[nom original] (copie)`. Si l'original s'appelle déjà `X (copie)`, la copie s'appelle `X (copie) (copie)` — pas de logique de déduplication des noms.

---

## Composants UI à créer

- `InventoryList` — liste paginable des inventaires de l'association, avec bouton de création
- `InventoryListItem` — une ligne de la liste (nom, compteur d'emplacements, lien vers le détail, bouton Dupliquer)
- `CreateInventoryForm` — formulaire de création d'inventaire (nom, validation inline)
- `InventoryDetailPage` — page détail : nom éditable, liste des emplacements, actions
- `CompartmentSection` — section dépliable pour un emplacement : nom éditable, liste des matériels, drag & drop
- `CreateCompartmentForm` — formulaire inline de création d'emplacement
- `ItemRow` — ligne de matériel : nom, badge isCritical, icône photo, actions (éditer, supprimer, drag handle)
- `CreateItemForm` — formulaire inline de création de matériel (nom, upload photo optionnel, isCritical)
- `EditItemForm` — formulaire d'édition de matériel (mêmes champs, avec remplacement de la photo existante)
- `DeleteConfirmDialog` — modale de confirmation générique pour les suppressions

---

## Use cases à implémenter

```ts
// Inventaires
listInventoriesUseCase(associationId: string) → Result<Inventory[]>
createInventoryUseCase(associationId: string, name: string) → Result<Inventory>
updateInventoryUseCase(inventoryId: string, associationId: string, name: string) → Result<void>
deleteInventoryUseCase(inventoryId: string, associationId: string) → Result<void>
getInventoryUseCase(inventoryId: string, associationId: string) → Result<InventoryWithCompartments>
duplicateInventoryUseCase(inventoryId: string, associationId: string) → Result<Inventory>

// Emplacements
createCompartmentUseCase(inventoryId: string, name: string) → Result<Compartment>
updateCompartmentUseCase(compartmentId: string, name: string) → Result<void>
deleteCompartmentUseCase(compartmentId: string) → Result<void>
reorderCompartmentsUseCase(inventoryId: string, orderedIds: string[]) → Result<void>

// Matériels
createItemUseCase(compartmentId: string, data: CreateItemData) → Result<Item>
updateItemUseCase(itemId: string, data: UpdateItemData) → Result<void>
deleteItemUseCase(itemId: string) → Result<void>
reorderItemsUseCase(compartmentId: string, orderedIds: string[]) → Result<void>
```

```ts
type Inventory = {
  id: string
  name: string
  associationId: string
}

type InventoryWithCompartments = Inventory & {
  compartments: CompartmentWithItems[]
}

type Compartment = {
  id: string
  name: string
  order: number
  inventoryId: string
}

type CompartmentWithItems = Compartment & {
  items: Item[]
}

type Item = {
  id: string
  name: string
  photoUrl: string
  isCritical: boolean
  order: number
  compartmentId: string
}

type CreateItemData = {
  name: string
  photoFile?: File       // upload Firebase Storage → stocké comme photoUrl
  isCritical: boolean
}

type UpdateItemData = Partial<CreateItemData>
```

---

## Données

**Firebase Storage** :
- Les photos sont uploadées dans le bucket Firebase Storage (plan Spark gratuit : 5 GB).
- Chemin de stockage : `materiels/{itemId}/{filename}`
- Après upload, l'URL publique de téléchargement est stockée dans `materiels.photoUrl`.
- Suppression d'un matériel → supprimer aussi son fichier dans Storage si `photoUrl` est renseignée.

**Collections Firestore existantes** (aucun nouveau champ requis) :

- `inventaires` — `name`, `associationId`
- `emplacements` — `inventoryId`, `name`, `order`
- `materiels` — `compartmentId`, `name`, `photoUrl`, `isCritical`, `order`

**Suppression en cascade** :
- Supprimer un inventaire → supprimer tous ses `emplacements` → supprimer tous les `materiels` de ces emplacements
- Supprimer un emplacement → supprimer tous ses `materiels`
- Nécessite des batch writes Firestore (max 500 opérations par batch)

**Requêtes nécessaires** :
- Inventaires par association : `where('associationId', '==', associationId)`
- Emplacements par inventaire : `where('inventoryId', '==', inventoryId).orderBy('order')`
- Matériels par emplacement : `where('compartmentId', 'in', compartmentIds)` (pattern déjà utilisé dans le validateur)

---

## Notifications mail

Aucune notification mail déclenchée par cette feature.

---

## Hors scope

- Recadrage ou compression de la photo avant upload
- Duplication d'un emplacement seul
- Duplication avec référence partagée (les matériels seraient les mêmes documents)
- Import/export CSV ou Excel des matériels
- Gestion des adresses mail de notification (feature distincte — paramètres du compte)
- Génération du QR code (feature distincte)
- Tableau de bord des contrôles (feature distincte)
- Gestion des comptes admin et associations (hors scope produit actuel)
- Suppression d'un inventaire ayant des contrôles associés : la suppression est autorisée, les contrôles sont conservés à titre d'historique (pas de blocage)
