---
feature: qrcode
status: implemented
updated: 2026-06-29
---

# Spec — QR Code par inventaire

## Objectif

Permettre à un responsable d'accéder au lien frontoffice d'un inventaire et d'afficher son QR code depuis le backoffice, pour pouvoir l'imprimer ou le coller sur l'objet physique.

## Utilisateurs concernés

- [ ] Secouriste (frontoffice, non authentifié)
- [x] Responsable / Admin (backoffice, authentifié)

---

## Parcours principal

1. Le responsable est sur la page de détail d'un inventaire (`/dashboard/inventaires/[inventaireId]`).
2. Il voit un bouton **QR Code** (ou icône) dans l'en-tête de la page.
3. Il clique → une modale s'ouvre affichant :
   - Le QR code (image) encodant l'URL publique `https://<domaine>/inventaire/[inventaireId]`
   - L'URL en clair sous le QR code, sélectionnable
   - Un bouton **Copier le lien**
   - Un bouton **Imprimer**
4. Le bouton **Copier le lien** copie l'URL dans le presse-papier et change momentanément de libellé en "Copié !" (retour à "Copier le lien" après 2 secondes).
5. Le bouton **Imprimer** déclenche `window.print()` — la modale est optimisée pour l'impression (seul le nom de l'inventaire, le QR code et l'URL sont visibles, sans chrome de navigation).
6. Le responsable ferme la modale via la croix ou en cliquant en dehors.

---

## Parcours alternatifs et edge cases

- Si `window.navigator.clipboard` n'est pas disponible (contexte non-HTTPS en dev, navigateur ancien) → le bouton "Copier le lien" est remplacé par un champ `<input readonly>` pré-rempli avec l'URL, que l'utilisateur peut sélectionner manuellement.
- Si la génération du QR code échoue (erreur de la librairie) → un message d'erreur s'affiche dans la modale à la place du QR code.
- La modale peut être fermée avec la touche `Escape`.

---

## Règles métier

- L'URL encodée dans le QR code est toujours `<origin>/inventaire/[inventaireId]` — elle est construite côté client avec `window.location.origin`.
- Le QR code est généré **entièrement côté client** : aucune requête serveur, aucun stockage.
- La feature est accessible uniquement depuis le backoffice authentifié. Aucune nouvelle route publique n'est créée.
- La taille du QR code affiché dans la modale est 256 × 256 px. À l'impression, il est centré sur la page, précédé du nom de l'inventaire en titre.

---

## Composants UI à créer

- `QrCodeButton` — bouton/icône dans l'en-tête de la page inventaire qui ouvre la modale
- `QrCodeModal` — modale affichant le QR code, l'URL, les boutons Copier et Imprimer

## Hooks à créer

- `useQrCodeModal` — état ouvert/fermé, génération de l'URL, logique copier-dans-presse-papier (avec fallback), et fermeture sur Escape

---

## Use cases à implémenter

Aucun use case métier : la feature est purement côté client (pas de lecture ni d'écriture Firestore). L'inventaireId est déjà disponible sur la page de détail.

---

## Données

Aucune modification du modèle Firestore. L'identifiant de l'inventaire est lu depuis les props de la page existante.

---

## Notifications mail

Aucune.

---

## Hors scope

- Régénération ou rotation de l'identifiant d'inventaire (le lien est permanent)
- Personnalisation du QR code (couleur, logo)
- Téléchargement du QR code en PNG/SVG
- Affichage du QR code dans le frontoffice
- Gestion des QR codes depuis la liste des inventaires (hors page de détail)
