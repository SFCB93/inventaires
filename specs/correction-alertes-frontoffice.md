---
feature: correction-alertes-frontoffice
status: draft
updated: 2026-07-19
---

# Spec — Correction d'anomalie/péremption depuis la page publique de contrôles

## Contexte

`/dashboard/controles` (backoffice, authentifié) affiche déjà un bloc "Anomalies et
alertes actives" avec un bouton **Corriger** par item, pour toute l'association
([controles.md](controles.md), Fonctionnalité 3). Ce même besoin existe côté terrain :
un secouriste qui consulte l'historique d'un inventaire (`/inventaire/[id]/controles`,
frontoffice public) doit pouvoir corriger une anomalie ou une péremption encore active
sans refaire un contrôle complet.

## Objectif

Ajouter le même bloc "alertes actives + correction" sur `/inventaire/[id]/controles`,
scopé au seul inventaire consulté, en réutilisant l'algorithme existant
(`getActiveAlerts`) plutôt qu'en le dupliquant.

## Utilisateurs concernés

- [x] Secouriste (frontoffice, non authentifié)
- [ ] Responsable / Admin (backoffice, authentifié) — non concerné, fonctionnalité déjà existante

---

## Décision d'architecture actée

### 1. Scoper `getActiveAlerts` par inventaire plutôt que filtrer après coup

`getActiveAlerts` (`shared/data/alerts-repository.ts`) scanne aujourd'hui tous les
inventaires + tous les contrôles + toutes les corrections d'une association avant de
filtrer. Appeler la version association-wide puis filtrer par `inventoryId` marcherait
mais ferait un scan complet à chaque chargement d'une page **publique**, potentiellement
sollicitée souvent.

→ Ajout d'un paramètre optionnel `inventoryId` à `getActiveAlerts`, sur le même principe
que le paramètre `includeAnomalies` déjà présent :
- Sans `inventoryId` : comportement inchangé (utilisé par le dashboard et le CRON).
- Avec `inventoryId` : les requêtes `controles`, `corrections` et `anomaly_corrections`
  sont filtrées directement sur `inventoryId` (au lieu de `associationId`), et l'étape
  "lister tous les inventaires de l'association" est sautée. La logique de fusion
  contrôle/correction et de calcul du statut actif (péremption expirée/à risque, anomalie
  non corrigée depuis) reste strictement identique — un seul algorithme, deux façons de
  le nourrir.

### 2. Écriture publique, sans authentification Firebase

`createCorrectionUseCase` / `createAnomalyCorrectionUseCase` exigent un `AuthenticatedUser`
+ vérification d'appartenance à l'association — ce modèle ne s'applique pas au
frontoffice, entièrement public.

Ce n'est pas un nouveau précédent : la soumission d'un contrôle est déjà publique et non
authentifiée, gardée par un simple champ texte libre (`verifierName`). Un secouriste peut
déjà lever n'importe quelle anomalie aujourd'hui en refaisant un contrôle complet — la
correction ciblée ne fait que raccourcir un chemin déjà possible, elle n'ouvre pas un
nouveau pouvoir d'écriture.

→ Deux nouveaux use cases publics (`createPublicCorrectionUseCase`,
`createPublicAnomalyCorrectionUseCase`) qui résolvent `associationId` server-side à partir
du seul `inventoryId` (jamais fourni par le client), sans passer par `getAuthenticatedUser()`.

`controlsRepository.getInventoryAssociationId` duplique une fonction équivalente déjà
présente dans `validatorRepository` (même lecture `inventaires/{id}.associationId`).
Duplication volontaire : chaque feature garde son propre `data/repository.ts` plutôt que
de faire dépendre `features/controls` du repository de `features/validator`.

### 3. Identité du correcteur : nom libre, mémorisé en local

Comme `verifierName` à la soumission d'un contrôle, mais **mémorisé** (`localStorage`)
pour ne pas le redemander à chaque correction. Le champ reste éditable — si un autre
secouriste utilise le même téléphone, il peut simplement écraser la valeur pré-remplie ;
la nouvelle valeur est sauvegardée pour la prochaine fois.

---

## Parcours principal

1. Le secouriste ouvre `/inventaire/[inventaireId]/controles` (bouton "Derniers
   contrôles" depuis la page inventaire, comme aujourd'hui).
2. Si des anomalies/péremptions sont encore actives pour CET inventaire, un bloc
   "Anomalies et alertes actives" apparaît au-dessus de l'historique des contrôles
   (réutilisation telle quelle de `AnomalyAlertsBlock`).
3. Un bouton **Corriger** par item ouvre une modale :
   - Anomalie : confirmation + champ "Corrigé par" (pré-rempli si déjà saisi sur ce
     téléphone), bouton Confirmer/Annuler.
   - Péremption : champ date obligatoire (même règle > J+seuil) + champ "Corrigé par"
     (même pré-remplissage), bouton Confirmer/Annuler.
4. À la confirmation, la correction est enregistrée (mêmes collections `corrections` /
   `anomaly_corrections` que le backoffice) et le nom saisi est sauvegardé en local.
   L'item disparaît immédiatement du bloc (revalidation de la page).
5. Si aucune alerte active pour cet inventaire → aucun bloc affiché (page inchangée par
   rapport à aujourd'hui).

## Edge cases

- Mêmes règles de validation de date que le backoffice (doit résoudre l'alerte, message
  d'erreur identique).
- Nom "Corrigé par" vide → bloqué, comme `verifierName` à la soumission d'un contrôle.
- Échec réseau/écriture → message d'erreur dans la modale, bouton Réessayer (comme le
  backoffice).
- Inventaire sans aucune alerte active → comportement actuel inchangé, aucun bloc ajouté.

---

## Composants UI

**Réutilisés tels quels** : `AnomalyAlertsBlock`.

**Nouveaux** (dans `features/validator/ui/`, zone publique) :
- `PublicCorrectionModal` — variante de `CorrectionModal` avec champ "Corrigé par"
- `PublicAnomalyCorrectionModal` — variante de `AnomalyCorrectionModal` avec champ
  "Corrigé par"

Dupliqués plutôt que rendus configurables : le champ "Corrigé par" n'a pas de sens côté
backoffice (identité déjà connue via l'auth), et les modales restent sous 120 lignes.

## Hooks à créer

- `usePublicCorrectionModal` (features/validator/ui/hooks) — même logique que
  `useCorrectionModal`, appelle `createPublicCorrectionAction`
- `usePublicAnomalyCorrectionModal` — idem pour l'anomalie
- `useCorrectorName` — lecture/écriture `localStorage`, valeur par défaut `''`

## Use cases à étendre / créer

```ts
// shared/data/alerts-repository.ts — paramètre ajouté, comportement existant inchangé
getActiveAlerts(
  associationId: string,
  thresholdDays?: number,
  includeAnomalies = true,
  inventoryId?: string,       // nouveau — scope les requêtes Firestore à cet inventaire
): Promise<Result<ActiveAlertsReport>>

// features/controls/domain/use-cases.ts
getInventoryActiveAlertsUseCase(
  inventoryId: string,
  associationId: string,
): Promise<Result<ActiveAlertsReport>>

// features/controls/domain/public-actions.ts ('use server', PAS de getAuthenticatedUser)
createPublicCorrectionUseCase(input: CreateCorrectionInput): Promise<Result<void>>
createPublicAnomalyCorrectionUseCase(input: CreateAnomalyCorrectionInput): Promise<Result<void>>
// associationId résolu server-side depuis inventoryId (nouvelle méthode
// controlsRepository.getInventoryAssociationId, miroir de celle du validator)
```

`CreateCorrectionInput` / `CreateAnomalyCorrectionInput` inchangés — `correctedBy` reçoit
le nom libre au lieu de l'uid admin.

## Données

Aucun changement de schéma. Mêmes collections `corrections` / `anomaly_corrections` que
le backoffice ; `correctedBy` contient un nom libre au lieu d'un uid Firebase côté public.

---

## Ce qui ne change pas

- `/dashboard/controles` et ses modales de correction — aucune modification.
- Le modèle d'authentification du backoffice.
- L'algorithme de calcul "alerte active" (péremption / anomalie non corrigée depuis) —
  une seule implémentation, réutilisée par les deux surfaces.

## Hors scope

- Limitation de fréquence / anti-abus sur les corrections publiques.
- Distinction visuelle entre correction faite en backoffice vs en frontoffice.
- Édition ou suppression d'une correction déjà enregistrée.
