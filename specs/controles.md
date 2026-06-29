---
feature: controles
status: implemented
updated: 2026-06-29
---

# Spec — Gestion des vérifications (contrôles)

## Objectif

Permettre aux responsables d'association de consulter l'historique des contrôles réalisés,
de suivre l'état des péremptions à travers le temps, et d'être alertés automatiquement
par e-mail lorsque des matériels arrivent à péremption ou sont périmés.

## Utilisateurs concernés

- [ ] Secouriste (frontoffice, non authentifié)
- [x] Responsable / Admin (backoffice, authentifié)

---

## Fonctionnalité 1 — Dashboard des contrôles

### Parcours principal

1. Le responsable accède à `/dashboard/controles` depuis la sidebar.
2. La page liste tous les contrôles soumis pour les inventaires de son association,
   triés par date décroissante.
3. Chaque ligne du tableau affiche :
   - Nom de l'inventaire
   - Nom du vérificateur
   - Date et heure de soumission
   - **Anomalies** (badge rouge si > 0) : items avec `status === 'anomaly'` ou dont
     la date de péremption était déjà expirée à la date de soumission du contrôle
   - **À risque** (badge orange si > 0) : items dont la date de péremption se situait
     entre la date de soumission et J+30 à partir de cette même date
   - **À corriger** (badge bleu si > 0) : alertes péremption actives pour cet inventaire,
     recalculées à chaque chargement de page (corrections en attente, état courant)
4. En cliquant sur une ligne, le responsable accède au détail du contrôle.
5. L'écran de détail affiche :
   - En-tête : inventaire, vérificateur, date
   - Résultats groupés par emplacement : nom du matériel, statut (✓ Présent / ⚠ Anomalie),
     commentaire si anomalie, date de péremption si saisie
   - Pour chaque matériel dont une péremption a été saisie lors de CE contrôle :
     un badge **"Corrigé"** si un contrôle POSTÉRIEUR a enregistré une nouvelle date
     de péremption > J+30 pour ce même matériel ; sinon, le statut courant
     (périmé / à risque / ok) calculé à partir de la date saisie.

### Edge cases

- Si l'association n'a aucun contrôle → message "Aucun contrôle enregistré pour l'instant."
- Si un inventaire a été supprimé depuis le contrôle → afficher le nom de l'inventaire
  tel qu'il était au moment du contrôle (champ `inventoryName` dénormalisé — voir Données).
- Pagination : 20 contrôles par page si la liste dépasse 20 entrées.

---

## Fonctionnalité 2 — CRON alertes péremption

### Déclencheur

Route `GET /api/cron/peremptions` protégée par `Authorization: Bearer CRON_SECRET`.
Appelée une fois par jour (Vercel Cron ou GitHub Actions).

### Comportement

Pour chaque association :

1. Récupérer tous les inventaires de l'association.
2. Pour chaque inventaire, identifier les matériels avec `hasExpiry: true`.
3. Pour chaque matériel, trouver la **date de péremption la plus récente** enregistrée
   dans un contrôle (`controles[].resultats[].datePeremption` non nulle, pour ce `materielId`).
4. Calculer le statut :
   - **Périmé** : date ≤ aujourd'hui
   - **Bientôt périmé** : aujourd'hui < date ≤ aujourd'hui + 30 jours
   - **OK** : date > aujourd'hui + 30 jours
   - **Inconnu** : aucune date de péremption jamais enregistrée → ignoré (hors scope)
5. Si au moins un matériel est **Périmé** ou **Bientôt périmé** pour cette association :
   envoyer **un seul e-mail de synthèse** aux adresses de notification de l'association.
6. Si tous les matériels sont **OK** → aucun e-mail envoyé.

### Résolution ("lever l'anomalie")

La résolution peut intervenir de deux façons :

1. **Automatique** : un nouveau contrôle est soumis et enregistre une nouvelle date de
   péremption > J+30 pour ce matériel.
2. **Manuelle** : un responsable saisit une correction directement depuis le dashboard
   (voir Fonctionnalité 3 ci-dessous).

Dans les deux cas, le matériel disparaît **immédiatement** du bloc d'alertes du dashboard :
`getActiveExpiryAlertsUseCase` est recalculé à chaque chargement de page depuis Firestore.
Le CRON, lui, utilise la même logique pour décider s'il doit envoyer un e-mail — il ne pilote
pas l'affichage du dashboard.

### Contenu de l'e-mail d'alerte péremption

- Objet : `⚠ Alertes péremption — [Nom association]`
- Corps :
  - Section **Périmés** (si applicable) : liste des matériels avec nom inventaire,
    nom emplacement, nom matériel, date de péremption
  - Section **Bientôt périmés** (si applicable) : même structure
  - Mention "Ces matériels ne figureront plus dans les alertes une fois remplacés et
    un nouveau contrôle soumis."

### Réponse de la route CRON

```json
{ "processed": 3, "emailsSent": 1, "errors": [] }
```
Retourner HTTP 200 même si certains envois mail échouent (logguer les erreurs).

---

## Fonctionnalité 3 — Condensé des alertes péremption et corrections manuelles

### Parcours principal

1. En haut de la page `/dashboard/controles`, avant la liste des contrôles,
   un bloc **"Alertes péremption actives"** affiche tous les matériels dont
   la date de péremption la plus récente (issue d'un contrôle OU d'une correction
   manuelle) est expirée ou arrive dans moins de 30 jours.
2. Les items sont groupés en deux sections : **Périmés** (critique) et **Bientôt périmés**.
3. Pour chaque item : nom de l'inventaire, nom de l'emplacement, nom du matériel,
   date de péremption actuelle.
4. Un bouton **Corriger** par item ouvre une modale avec :
   - Le nom du matériel en titre
   - Un champ date obligatoire "Nouvelle date de péremption"
   - Un bouton Confirmer / Annuler
5. À la confirmation, une **correction** est enregistrée. L'item disparaît du bloc
   d'alertes si la nouvelle date est > J+30. Dans le détail des contrôles passés,
   cet item apparaît désormais avec le badge **"Corrigé"**.
6. Si aucune alerte active → le bloc affiche "Aucune alerte de péremption en cours. ✓"

### Edge cases

- Si la nouvelle date saisie est déjà expirée ou dans moins de 30 jours → le champ
  passe en erreur : "Cette date ne résout pas l'alerte (doit être > J+30)."
- Si la correction échoue (réseau) → message d'erreur dans la modale, bouton Réessayer.

---

## Fonctionnalité 4 — E-mail de soumission d'un contrôle

**Déjà implémenté** dans `features/validateur/domain/actions.ts`.
Cette spec confirme le comportement existant — aucune modification requise.

---

---

## Règles métier

- Un responsable ne voit que les contrôles des inventaires de **son association**.
- Le seuil d'alerte "bientôt périmé" est fixé à **30 jours** (J+30).
- La résolution peut être **automatique** (nouveau contrôle avec bonne date) ou
  **manuelle** (correction saisie depuis le dashboard par un responsable authentifié).
- `anomalyCount` et `atRiskCount` sont calculés **par rapport à la date de soumission
  du contrôle**, pas par rapport à aujourd'hui : ils représentent un snapshot de l'état
  des péremptions au moment où le contrôle a été réalisé.
- La colonne **À corriger** représente l'état courant (recalculé à chaque chargement) ;
  elle peut donc différer des colonnes Anomalies / À risque d'une même ligne.
- Le badge "Corrigé" dans le détail d'un contrôle est calculé dynamiquement :
  il compare la date saisie lors DE CE contrôle avec la date la plus récente tous contrôles confondus.
- Le CRON envoie **au maximum un e-mail par association par jour**.
- Un matériel `hasExpiry: true` mais **sans aucune date jamais enregistrée** est ignoré
  par le CRON (statut "Inconnu" = hors scope de cette feature).
- La route CRON est protégée par `Authorization: Bearer CRON_SECRET`.

---

## Composants UI à créer

- `ControlsListPage` — bloc alertes actives + tableau paginé des contrôles
- `ExpiryAlertsBlock` — section "Alertes péremption actives" avec liste groupée et boutons Corriger
- `CorrectionModal` — modale avec champ date + validation + soumission
- `ControlDetailPage` — détail d'un contrôle groupé par emplacement, avec badges statut
- `ExpiryStatusBadge` — badge réutilisable : "Périmé" / "Bientôt périmé" / "OK" / "Corrigé"

## Hooks à créer

- `useControlsListPage` — pagination locale
- `useCorrectionModal` — état ouvert/fermé, validation de la date, soumission

---

## Use cases à implémenter

- `listControlsUseCase(associationId: string)` → `Result<ControlSummary[]>`
- `getControlDetailUseCase(controlId: string, associationId: string)` → `Result<ControlDetail>`
- `getActiveExpiryAlertsUseCase(associationId: string)` → `Result<ExpiryAlertReport>` — affiché dans le dashboard ET utilisé par le CRON
- `createCorrectionUseCase(data: CreateCorrectionInput)` → `Result<void>`

```ts
type ControlSummary = {
  id: string
  inventoryId: string
  inventoryName: string       // dénormalisé à la soumission
  verifierName: string
  submittedAt: Date
  anomalyCount: number        // status 'anomaly' OU expiryDate <= submittedAt
  atRiskCount: number         // submittedAt < expiryDate <= submittedAt + 30j
}

type ControlDetail = {
  id: string
  inventoryName: string
  verifierName: string
  submittedAt: Date
  compartments: {
    id: string
    name: string
    results: {
      itemId: string
      itemName: string
      status: 'present' | 'anomaly'
      comment: string | null
      expiryDate: string | null       // date saisie lors de CE contrôle
      currentExpiryStatus: 'expired' | 'at-risk' | 'ok' | 'fixed' | null
      // null si hasExpiry: false ou aucune date jamais saisie pour cet item
    }[]
  }[]
}

type ExpiryAlertReport = {
  expired: ExpiryAlertItem[]
  atRisk: ExpiryAlertItem[]          // bientôt périmé (< 30 jours)
}

type ExpiryAlertItem = {
  itemId: string
  itemName: string
  compartmentName: string
  inventoryId: string
  inventoryName: string
  latestExpiryDate: string           // ISO YYYY-MM-DD
  source: 'control' | 'correction'
}

type CreateCorrectionInput = {
  itemId: string
  inventoryId: string
  associationId: string
  newExpiryDate: string              // ISO YYYY-MM-DD, doit être > J+30
  correctedBy: string                // email ou uid de l'admin
}
```

---

## Données

### Modifications du schéma `controles`

Ajouter `inventoryName: string` (dénormalisé au moment de la soumission, ex. "Sac PS")
pour afficher le nom même si l'inventaire est supprimé ultérieurement.

**Migration** : les contrôles existants sans ce champ affichent `inventaireId` en fallback.

### Nouvelle collection `corrections`

```
corrections/{correctionId}
  itemId: string
  inventoryId: string
  associationId: string
  newExpiryDate: string    // ISO YYYY-MM-DD
  correctedBy: string      // email de l'admin
  correctedAt: Timestamp   // serverTimestamp
```

### Collections Firestore impliquées

- `inventaires` — lecture pour résoudre `associationId` → inventaires
- `emplacements` — lecture pour afficher les noms dans le détail du contrôle
- `materiels` — lecture pour afficher les noms et `hasExpiry`
- `controles` — lecture principale ; écriture lors de la soumission (`inventoryName` ajouté)
- `corrections` — nouvelle collection ; lecture par le CRON et le dashboard ; écriture par `createCorrectionUseCase`
- `associations` — lecture des `notificationEmails` pour le CRON

### Nouvelle route API

`GET /api/cron/peremptions`

---

## Notifications mail

### E-mail d'alerte péremption (nouveau)
- **Déclencheur** : route CRON `/api/cron/peremptions`
- **Destinataires** : `associations[associationId].notificationEmails`
- **Template** : `emails/ExpiryAlertEmail.tsx`
- **Fréquence** : quotidienne, uniquement si au moins un matériel est en alerte

### E-mail de soumission (existant)
- Déjà implémenté, aucune modification.

---

## Hors scope

- Configuration du délai de résolution automatique (fixé à > J+30)
- Historique des alertes envoyées
- Configuration du seuil d'alerte (fixé à 30 jours)
- Matériels sans aucune date de péremption jamais enregistrée
- Suppression ou modification d'un contrôle soumis
- Export CSV ou PDF de l'historique des contrôles
- Filtres sur la liste des contrôles (par inventaire, par vérificateur, par date)
