# Spec — Photo par URL

## Objectif

Permettre au responsable de renseigner la photo d'un matériel en collant une URL d'image,
en alternative à l'upload de fichier.

## Utilisateurs concernés

- [x] Responsable / Admin (backoffice, authentifié)

## Parcours principal

1. Le responsable ouvre le formulaire d'ajout ou de modification d'un matériel (`ItemForm`).
2. Il voit la zone photo avec son bouton d'upload existant **et** un lien/bouton secondaire
   « Entrer une URL ».
3. Il clique sur « Entrer une URL » : un champ texte apparaît dans la zone photo.
4. Il saisit une URL HTTPS d'image (ex. `https://example.com/sha.png`).
5. Un aperçu s'affiche en temps réel dès que l'URL est valide.
6. Il soumet le formulaire.
7. L'URL est stockée telle quelle dans `photoUrl` en Firestore.
8. La photo s'affiche normalement dans le backoffice et dans le validateur frontoffice.

## Parcours alternatifs et edge cases

- Si l'URL ne commence pas par `https://` → champ en erreur, soumettre bloqué, message
  « L'URL doit commencer par https:// ».
- Si l'URL est valide mais l'image inaccessible (domaine inexistant, 404…) → aperçu cassé
  (comportement natif du navigateur), soumission autorisée quand même.
- Si le responsable avait déjà uploadé un fichier, puis entre une URL → l'URL prend le dessus,
  le fichier est effacé, `photoStoragePath` est vidé.
- Si le responsable avait entré une URL, puis sélectionne un fichier → le fichier prend le
  dessus, le champ URL est vidé.
- Si le responsable clique sur « Supprimer la photo » → l'URL et l'éventuel fichier sont
  effacés, aperçu retiré.
- Si le responsable bascule entre les deux modes (URL ↔ fichier) sans valider → seul le
  dernier mode actif est conservé à la soumission.

## Règles métier

- L'URL doit commencer par `https://` (pas `http://`, pas de chemin relatif).
- Fichier et URL sont **mutuellement exclusifs** : le dernier renseigné efface l'autre.
- Aucune validation serveur de l'URL (pas d'appel `/api/upload`, pas de téléchargement côté
  serveur).
- `photoStoragePath` est vide (`''`) quand la photo provient d'une URL externe.

## Composants UI à créer / modifier

- `ItemForm` — ajouter le lien de bascule et le champ URL dans la zone photo.
- `useItemForm` — ajouter la gestion de l'état URL et de la priorité URL/fichier.

## Use cases à implémenter

Aucun nouveau use case. `createItemUseCase` et `updateItemUseCase` acceptent déjà `photoUrl`
comme string arbitraire.

## Données

Pas de changement de schéma Firestore. `photoUrl` stocke déjà un string (base64, URL Firebase
Storage ou URL externe sont tous valides). `photoStoragePath` est vidé quand la photo est
une URL externe.

## Affichage de l'image

`next/image` exige que les domaines soient déclarés dans `next.config.ts`.
Les URLs externes (hors `firebasestorage.googleapis.com`) ne correspondent à aucun pattern
actuel → le composant `<Image>` crashera ou refusera de charger.

Fix attendu : ajouter `{ protocol: 'https', hostname: '**' }` dans `remotePatterns`
de `next.config.ts` pour autoriser toute origine HTTPS.
Ce changement affecte à la fois `ItemForm` (aperçu) et `ItemCard` (frontoffice).

## Notifications mail

Aucune. Ce changement n'affecte pas les emails.

## Hors scope

- Validation que l'URL pointe réellement vers une image (content-type, accessibilité).
- Support `http://`.
- Copie de l'image distante dans Firebase Storage.
- Redimensionnement des images distantes.
