---
feature: gestion-comptes
status: implemented
updated: 2026-06-29
---

# Spec — Gestion des comptes

## Objectif

Permettre la création de nouveaux comptes association depuis un espace superadmin,
et donner aux responsables d'association la main sur leurs paramètres (nom, emails
de notification) sans passer par la console Firebase ou Firestore.

## Utilisateurs concernés

- [ ] Secouriste (frontoffice, non authentifié)
- [x] Responsable / Admin (backoffice, authentifié)
- [x] Superadmin (backoffice, rôle spécifique)

---

## Fonctionnalité 1 — Invitation d'une nouvelle association (superadmin)

### Parcours principal

1. Le superadmin accède à `/admin`.
2. Il voit la liste des associations existantes (nom + email admin).
3. Il clique sur "Nouvelle association".
4. Il remplit un formulaire :
   - Nom de l'association (ex. "Croix-Rouge Bordeaux")
   - Email du premier responsable
5. À la validation :
   - Un compte Firebase Auth est créé pour cet email.
   - Un document `associations/{id}` est créé avec le nom saisi.
   - Un document `users/{uid}` est créé avec `associationId` et `role: 'admin'`.
   - Un email Firebase "Définir votre mot de passe" est envoyé à l'adresse saisie.
6. Le nouveau responsable reçoit l'email, clique sur le lien, définit son mot de passe
   et peut se connecter au backoffice.

### Edge cases

- Si l'email existe déjà dans Firebase Auth → message d'erreur : "Un compte existe
  déjà pour cet email."
- Si le nom de l'association est vide → validation front bloque la soumission.
- Si l'email est invalide → validation front bloque la soumission.
- Si une erreur serveur survient après la création du compte Auth mais avant
  l'écriture Firestore → logger l'erreur et afficher un message d'erreur générique.
  Le compte Auth orphelin devra être nettoyé manuellement (hors scope).

---

## Fonctionnalité 2 — Paramètres de l'association

### Parcours principal

1. Le responsable connecté accède à `/dashboard/parametres` depuis la sidebar.
2. La page affiche les paramètres actuels de son association :
   - Section **Informations** : champ nom de l'association (pré-rempli)
   - Section **Emails de notification** : liste des adresses actuelles,
     avec un bouton de suppression par adresse et un champ pour en ajouter une nouvelle
3. Le responsable modifie les informations et clique sur "Enregistrer".
4. Les modifications sont sauvegardées dans `associations/{associationId}`.

### Edge cases

- Si le nom de l'association est vidé → validation bloque la soumission.
- Si l'email ajouté est invalide → message d'erreur inline.
- Si l'email ajouté est déjà dans la liste → message d'erreur inline.
- Si la liste d'emails de notification est vidée entièrement → autorisé
  (certaines associations peuvent ne pas vouloir de mails automatiques).
- Si la sauvegarde échoue → message d'erreur, les modifications ne sont pas perdues
  (l'état local du formulaire est conservé).

---

## Règles métier

- Seul un utilisateur avec `role: 'superadmin'` peut accéder à `/admin`.
  Tout autre utilisateur authentifié est redirigé vers `/dashboard/inventaires`.
- Le superadmin peut "entrer" dans n'importe quelle association depuis `/admin`.
  Cela positionne un cookie `acting-as: <associationId>` et redirige vers
  `/dashboard/inventaires`. Dans cet état, il dispose des mêmes droits qu'un
  admin ordinaire sur cette association.
- Quand le superadmin est en mode "admin d'une asso", le bouton **← Admin**
  dans la navbar efface le cookie et le renvoie vers `/admin`.
- Le superadmin sans cookie `acting-as` actif est redirigé vers `/admin` s'il
  tente d'accéder à une page `/dashboard`.
- La navbar s'adapte au contexte :
  - Superadmin sans asso active → affiche uniquement "Administration"
  - Superadmin avec asso active → affiche le menu complet + "← Admin"
  - Admin ordinaire → affiche le menu complet (Inventaires / Contrôles / Paramètres)
- Un responsable ne peut modifier que les paramètres de **sa propre association**
  (l'`associationId` vient de sa session ou du cookie `acting-as`).
- L'email du responsable (compte Firebase Auth) n'est pas modifiable depuis cette
  interface (hors scope).
- Le mot de passe n'est pas modifiable depuis cette interface (hors scope).

---

## Composants UI à créer

- `AdminPage` — liste des associations + bouton "Nouvelle association" (superadmin)
- `NewAssociationForm` — formulaire nom + email, soumission avec feedback
- `ParametresPage` — page paramètres de l'association (informations + emails)
- `NotificationEmailsEditor` — liste des emails avec ajout / suppression

## Hooks à créer

- `useNewAssociationForm` — état du formulaire, validation, soumission
- `useParametresPage` — chargement des paramètres, état du formulaire, sauvegarde

---

## Use cases à implémenter

- `createAssociationUseCase(input: CreateAssociationInput)` → `Result<void>`
- `listAssociationsUseCase()` → `Result<AssociationSummary[]>` (superadmin uniquement)
- `getAssociationSettingsUseCase(associationId: string)` → `Result<AssociationSettings>`
- `updateAssociationSettingsUseCase(associationId: string, data: UpdateAssociationInput, user: AuthenticatedUser)` → `Result<void>`

```ts
type CreateAssociationInput = {
  name: string
  adminEmail: string
}

type AssociationSummary = {
  id: string
  name: string
  adminEmail: string
}

type AssociationSettings = {
  name: string
  notificationEmails: string[]
}

type UpdateAssociationInput = {
  name: string
  notificationEmails: string[]
}
```

---

## Données

### Modification du schéma `users`

Ajout du champ `role: 'admin' | 'superadmin'` (optionnel, absence = `'admin'` par défaut).

**Migration** : les documents `users` existants sans ce champ sont traités comme `'admin'`.

### Schéma `associations` (existant, inchangé)

```
associations/{associationId}
  name: string
  notificationEmails: string[]
```

### Collections impliquées

- `users` — lecture du rôle pour la protection de `/admin` ; écriture lors de la création
- `associations` — lecture + écriture pour les paramètres et la liste superadmin

---

## Notifications mail

- **Invitation** : email Firebase "Définir votre mot de passe" envoyé automatiquement
  via Firebase Admin SDK (`generatePasswordResetLink`) à la création du compte.
  Pas de template custom (email Firebase natif).

---

## Hors scope

- Modification de l'email ou du mot de passe d'un responsable existant
- Suppression d'un compte ou d'une association
- Plusieurs admins par association
- Auto-inscription publique
- Déconnexion (pas de bouton logout demandé)
