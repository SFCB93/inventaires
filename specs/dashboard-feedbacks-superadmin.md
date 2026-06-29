---
feature: dashboard-feedbacks-superadmin
status: implemented
updated: 2026-06-29
---

# Spec — Dashboard feedbacks (superadmin)

## Objectif

Permettre au superadmin de consulter l'ensemble des feedbacks de notation laissés par les secouristes après soumission d'un contrôle.

## Utilisateurs concernés

- [ ] Secouriste (frontoffice)
- [ ] Admin (backoffice)
- [x] Superadmin uniquement

---

## Parcours principal

1. Le superadmin accède à `/admin/feedbacks` (lien depuis la page `/admin`).
2. Un tableau liste tous les feedbacks, du plus récent au plus ancien.
3. Chaque ligne affiche : date, note, commentaire, auteur.
4. Si aucun feedback n'existe → message vide.

---

## Données affichées

| Colonne | Source | Format |
|---|---|---|
| Date | `feedbacks.submittedAt` | JJ/MM/AAAA HH:mm |
| Note | `feedbacks.rating` | Étoiles (★ pleines / ☆ vides), 1 à 5 |
| Commentaire | `feedbacks.comment` | Texte brut, vide si absent |
| Auteur | `controles.verifierName` (via `feedbacks.controlId`) | Texte |

**Volume** : les 100 feedbacks les plus récents. Pas de pagination pour l'instant.

---

## Règles métier

- Accessible uniquement aux utilisateurs avec `role === 'superadmin'`. Si un admin standard tente d'accéder → redirection vers `/dashboard/inventaires`.
- Les feedbacks de **toutes** les associations sont affichés (vue globale).
- Un feedback sans contrôle lié (document supprimé) → auteur affiché comme "—".
- Un feedback avec `comment` vide → cellule vide, pas de placeholder.

---

## Structure des données Firestore

```
feedbacks/{feedbackId}
  controlId:   string
  rating:      number   // 1–5
  comment:     string
  submittedAt: Timestamp

controles/{controleId}
  verifierName: string
  ...
```

---

## Use cases

- `listFeedbacksUseCase(user: AuthenticatedUser)` → `Result<FeedbackRow[]>`
  - Vérifie `user.role === 'superadmin'`, sinon `err('Accès non autorisé.')`
  - Charge les 100 feedbacks les plus récents (`orderBy submittedAt desc, limit 100`)
  - Batch-fetch les contrôles liés pour récupérer `verifierName`
  - Retourne les lignes assemblées

```ts
type FeedbackRow = {
  id: string
  submittedAt: string   // ISO string
  rating: number
  comment: string
  verifierName: string  // '' si contrôle introuvable
}
```

---

## Composants UI

- `FeedbacksPage` — composant principal, tableau + état vide
- Pas de hook personnalisé nécessaire (Server Component, pas d'état client)

---

## Route

- **URL** : `/admin/feedbacks`
- **Fichier** : `src/app/(backoffice)/admin/feedbacks/page.tsx`
- **Feature** : `src/features/superadmin/` (réutilise la feature existante)
- **Accès** : `role === 'superadmin'` requis, redirect sinon

---

## Navigation

Ajouter un lien "Feedbacks" sur la page `/admin` existante (à côté du titre ou en sous-navigation).

---

## Hors scope

- Filtrage par association, par note, ou par date
- Pagination au-delà des 100 plus récents
- Suppression de feedbacks
- Export CSV
