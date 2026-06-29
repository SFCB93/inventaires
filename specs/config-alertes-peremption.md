---
feature: config-alertes-peremption
status: implemented
updated: 2026-06-29
---

# Spec — Configuration des alertes de péremption

## Objectif

Permettre à chaque association de configurer le seuil "à risque" et l'intervalle
minimum entre deux mails d'alerte par item, afin d'éviter les spams quotidiens
et d'adapter les alertes à leur rythme de contrôle.

## Utilisateurs concernés

- [x] Responsable / Admin (backoffice, authentifié) — configure les paramètres
- [ ] Secouriste (frontoffice, non authentifié)

---

## Parcours principal

1. L'admin ouvre la page Paramètres (`/dashboard/parametres`).
2. Il voit deux nouveaux champs dans une section "Alertes de péremption" :
   - **Seuil "à risque"** : nombre de jours avant expiration à partir duquel un matériel est considéré à risque (ex : 30 jours).
   - **Intervalle entre alertes** : nombre de jours minimum entre deux mails d'alerte pour un même item (ex : 7 jours).
3. Il modifie les valeurs et sauvegarde.
4. Les nouvelles valeurs sont immédiatement prises en compte pour :
   - le calcul du badge "à risque" dans le dashboard contrôles
   - la validation d'une correction (la nouvelle date doit être > aujourd'hui + seuil)
   - les mails d'alerte envoyés par le CRON quotidien

## Parcours alternatifs et edge cases

- Si l'admin ne configure pas ces champs → utiliser des valeurs par défaut : seuil 30 jours, intervalle 7 jours.
- Si le seuil est 0 ou négatif → refuser (validation côté use case).
- Si l'intervalle est 0 → refuser (minimum 1 jour, pour éviter le mode "envoi immédiat illimité").
- Si les deux champs sont vides → conserver les valeurs existantes (pas d'écrasement avec null).

---

## Règles métier

- Seuil "à risque" : entier ≥ 1, en jours.
- Intervalle entre alertes : entier ≥ 1, en jours.
- Ces valeurs sont stockées sur le document `associations/{assocId}`.
- La valeur du seuil pilote trois comportements simultanément :
  1. badge "à risque" dans le tableau de bord des contrôles
  2. validation de la date lors d'une correction (doit être > aujourd'hui + seuil)
  3. classification expired/at-risk dans le CRON d'alerte
- Un item ne reçoit pas de mail si un mail a déjà été envoyé pour lui il y a moins de `intervalDays` jours.
- La vérification de l'intervalle se fait sur la collection `expiry-alert-log`.

---

## Composants UI à créer

- `AlertSettingsSection` — section dans `ParametresPage`, deux inputs numériques (seuil + intervalle) avec sauvegarde. Ajouté aux côtés des sections existantes (`NotificationEmailsSection`, `AdminAccountsSection`).

---

## Use cases à implémenter

- `updateAlertSettingsUseCase(input: { thresholdDays: number; intervalDays: number }, user: AuthUser)` → `Result<void>`
  - Vérifie thresholdDays ≥ 1 et intervalDays ≥ 1
  - Appelle le repository pour persister sur l'association

---

## CRON quotidien d'alerte

Nouveau CRON distinct de `cleanup-orphans`. Appelé une fois par jour via `app/api/cron/expiry-alerts/route.ts`, protégé par `CRON_SECRET`.

Logique :
1. Pour chaque association, lire `alertThresholdDays` et `alertIntervalDays`.
2. Appeler `getActiveExpiryAlerts(associationId, thresholdDays)` (paramètre à ajouter).
3. Pour chaque item expiré ou à risque, vérifier dans `expiry-alert-log` s'il y a une entrée `sentAt` < `intervalDays` jours.
4. Filtrer les items qui n'ont pas encore été alertés dans l'intervalle.
5. Si au moins un item passe le filtre : envoyer un mail récapitulatif + créer les entrées `expiry-alert-log`.
6. Si aucun item → ne rien envoyer.

Use cases CRON :
- `sendExpiryAlertsUseCase(associationId: string)` → `Result<{ sent: number }>` — orchestre le filtre + mail + log

---

## Données

**Champs ajoutés sur `associations/{assocId}`** :
```
alertThresholdDays: number   # défaut : 30
alertIntervalDays: number    # défaut : 7
```

**Nouvelle collection `expiry-alert-log/`** :
```
{itemId}/
  associationId: string
  inventoryId: string
  lastSentAt: Timestamp
```
Un document par item, écrasé à chaque envoi (`set()` sans merge).
Pas d'index composite nécessaire — lecture par `associationId` uniquement.

**Modification de `getActiveExpiryAlerts`** : accepter `thresholdDays` en paramètre au lieu d'utiliser 30 en dur. Idem pour `todayPlusDays(30)` dans `listControls` et `createCorrectionUseCase`.

---

## Notifications mail

- **Mail quotidien CRON** — envoyé à `notificationEmails` de l'association si au moins un item expiré ou à risque n'a pas été alerté depuis `alertIntervalDays` jours. Contenu : liste des items concernés (nom, inventaire, date de péremption, statut expired/at-risk).

---

## Hors scope

- Interface de consultation du log d'alertes envoyées.
- Alertes par item individuel (granularité à l'inventaire uniquement pour le mail).
- Désactivation complète des alertes mail.
- Configuration différente par inventaire (niveau association uniquement).
