---
feature: photo
status: implemented
updated: 2026-06-29
---

# Spec — Photo d'un matériel

## Objectif

Permettre au responsable de renseigner la photo d'un matériel via deux méthodes
(upload fichier, collage presse-papier), toutes deux stockées en base64 localement
pour éviter les photos cassées par URL décommissionnée.

## Utilisateurs concernés

- [x] Responsable / Admin (backoffice, authentifié)

## Parcours principal — upload fichier

1. Le responsable ouvre le formulaire d'ajout ou de modification d'un matériel.
2. Il clique sur « Choisir une photo ».
3. L'explorateur de fichiers s'ouvre.
4. Il sélectionne une image.
5. L'image est redimensionnée et convertie en base64 côté client.
6. Un aperçu s'affiche dans la zone photo.
7. Il soumet le formulaire — `photoUrl` contient le base64.

## Parcours principal — collage presse-papier

1. Le responsable copie une image dans son presse-papier
   (capture d'écran, copie depuis un navigateur, etc.).
2. Il interagit avec n'importe quel élément du formulaire
   (champ nom, bouton, checkbox…).
3. Il appuie sur Ctrl+V / ⌘V.
4. L'image est lue depuis le presse-papier, redimensionnée et convertie en base64.
5. Un aperçu s'affiche dans la zone photo.
6. Il soumet le formulaire — `photoUrl` contient le base64.

## Parcours alternatifs et edge cases

- Ctrl+V alors qu'aucun élément du formulaire n'a le focus → ignoré.
- Ctrl+V avec du texte dans le presse-papier → ignoré, le texte est collé normalement
  dans le champ actif (champ nom par exemple).
- Ctrl+V pendant un redimensionnement en cours (`isResizing`) → ignoré.
- Sélection d'un fichier non-image → ignoré par `accept="image/*"`.
- Erreur de redimensionnement (fichier corrompu) → photo inchangée, pas de message.
- Clic sur « Supprimer la photo » → aperçu retiré, `photoUrl` vide à la soumission.

## Règles métier

- Toute photo est stockée en base64 dans `photoUrl`.
- Il n'est pas possible de saisir une URL externe manuellement.
- Les `photoUrl` HTTPS existantes en base sont nettoyées par un script de migration
  avant le déploiement (`photoUrl` mis à `''`).
- `photoStoragePath` est toujours `''` (upload Firebase Storage hors scope).
- Le collage est intercepté au niveau du `<form>` — pas seulement dans la zone photo —
  pour couvrir toute interaction dans le formulaire sans nécessiter de clic préalable
  dans la zone photo.

## Composants UI à créer / modifier

- `PhotoPickerField` — supprimer intégralement le mode URL (champ texte, bouton bascule,
  gestion `urlError`) ; conserver le bouton upload et l'aperçu ; ajouter un indicateur
  visuel mentionnant le collage (Ctrl+V / ⌘V).
- `ItemForm` — ajouter `onPaste={handlePhotoPaste}` sur l'élément `<form>`.
- `useItemForm` — supprimer tout l'état URL (`photoMode`, `urlInput`, `urlError`,
  `onPhotoModeChange`, `onPhotoUrlChange`) ; ajouter `handlePhotoPaste`.

## Use cases à implémenter

Aucun nouveau use case. `createItemUseCase` et `updateItemUseCase` acceptent déjà
`photoUrl` comme string arbitraire.

## Données

Pas de changement de schéma Firestore.
`photoUrl` stocke un string base64 (ou `''` si pas de photo).
`photoStoragePath` reste `''`.

## Notifications mail

Aucune. Ce changement n'affecte pas les emails.

## Hors scope

- Saisie manuelle d'une URL externe.
- Upload vers Firebase Storage.
- Drag & drop de fichier sur la zone photo.
- Validation que le contenu collé est bien une image (content-type).
- Suppression rétroactive des URLs HTTPS dans Firestore.
