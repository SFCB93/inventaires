---
feature: gestion-comptes-admin
status: implemented
updated: 2026-06-29
---

# Spec — Gestion des comptes admin d'une association

## Objectif

Permettre à un admin de voir qui a accès à son espace, d'inviter un co-admin,
et de changer son mot de passe — sans intervention du superadmin.

## Utilisateurs concernés

- [x] Responsable / Admin (backoffice, authentifié)

## Parcours 1 — Liste des comptes admin

1. L'admin ouvre la page Paramètres (`/dashboard/parametres`).
2. Une nouvelle section "Comptes administrateurs" affiche la liste des comptes
   ayant accès à l'association (email + date de création si disponible).
3. Chaque compte peut être supprimé (sauf le compte de l'admin connecté lui-même).

## Parcours 2 — Invitation d'un co-admin

1. L'admin clique sur "Inviter un administrateur".
2. Il saisit l'adresse email du futur admin.
3. Il valide — le système crée le compte Firebase Auth, le doc `users` en
   Firestore, génère un lien de définition de mot de passe et envoie l'email
   d'invitation (même template que la création d'asso).
4. Le nouvel admin apparaît dans la liste.

## Parcours 3 — Changer son mot de passe

1. L'admin clique sur "Changer mon mot de passe".
2. Le système envoie un email de réinitialisation Firebase à l'adresse du
   compte connecté.
3. Un message de confirmation s'affiche : "Un lien a été envoyé à [email]."

## Parcours alternatifs et edge cases

- Email déjà utilisé par un compte Firebase → erreur : "Un compte existe déjà
  avec cet email."
- Email déjà admin de cette association → erreur : "Ce compte est déjà admin."
- Email invalide → erreur inline, soumission bloquée.
- Suppression de son propre compte → bloquée (bouton absent ou désactivé).
- Association sans autre admin → suppression du seul compte bloquée (l'asso
  se retrouverait sans accès).
- Erreur d'envoi d'email → le compte est créé, le lien est affiché dans l'UI
  pour copie manuelle (même comportement que la création d'asso superadmin).

## Règles métier

- Un admin peut inviter autant de co-admins qu'il veut pour son association.
- Un admin ne peut gérer que les comptes de sa propre association.
- La suppression d'un compte révoque l'accès (suppression du doc `users` +
  désactivation du compte Firebase Auth). Le compte Auth est désactivé, pas
  supprimé, pour préserver la traçabilité.
- Le changement de mot de passe passe par un lien Firebase (pas de saisie
  ancien/nouveau mot de passe en UI — trop complexe avec Firebase Auth).
- `role` du nouveau compte : `'admin'`, `associationId` : celui de l'admin
  qui invite.

## Composants UI à créer / modifier

- `AdminAccountsSection` — nouvelle section dans `ParametresPage` :
  liste des comptes, bouton inviter, bouton changer mot de passe.
- `InviteAdminForm` — formulaire inline (email + bouton Inviter).
- `useAdminAccounts` — hook : charge la liste, gère invite / suppression /
  reset password.
- `ParametresPage` — ajout de la section `AdminAccountsSection`.

## Use cases à implémenter

- `listAdminAccountsUseCase(associationId, user)` → `Result<AdminAccount[]>`
- `inviteAdminUseCase(email, associationId, user)` → `Result<{ resetLink: string }>`
- `removeAdminUseCase(targetUid, associationId, user)` → `Result<void>`
- `sendPasswordResetUseCase(user)` → `Result<void>`

```ts
type AdminAccount = {
  uid: string
  email: string
  createdAt: Date | null
}
```

## Données

Collections lues / modifiées :
- `users` — lecture (liste), écriture (ajout), suppression
- Firebase Auth — lecture (emails), création, désactivation

Pas de nouveau champ Firestore.

## Notifications mail

- Invitation : email avec lien de définition de mot de passe (template existant).
- Reset mot de passe : email Firebase natif (`generatePasswordResetLink`).

## Hors scope

- Modification de l'email d'un compte existant.
- Suppression définitive d'un compte Firebase Auth (désactivation uniquement).
- Rôles différenciés entre admins d'une même asso (tous ont les mêmes droits).
- Interface superadmin pour gérer les comptes d'une asso tierce.
