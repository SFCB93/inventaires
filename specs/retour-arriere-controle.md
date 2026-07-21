---
feature: retour-arriere-controle
status: implemented
updated: 2026-07-19
---

# Spec — Retour arrière pendant un contrôle

## Contexte

Le flow de contrôle est actuellement unidirectionnel : une fois un item noté, le secouriste avance
vers le suivant. Si une erreur est faite (mauvais statut, mauvaise date), il n'y a aucun moyen de
corriger sans repartir de zéro.

## Comportement attendu

### Bouton "Précédent"

- Un bouton **← Précédent** apparaît sur la vue `item` dès que l'index de l'item courant n'est pas
  le tout premier (compartment 0, item 0).
- Au tap, le résultat du dernier item enregistré est **supprimé** du store (`results`) et les
  index `compartmentIndex` / `itemIndex` reculent d'un cran.
- L'item précédent s'affiche vierge (statut Présent/Anomalie non pré-rempli, comme à la première
  visite) — **sauf la date de péremption**, voir "Évolution — mémorisation de la date" ci-dessous.

### Évolution (2026-07-19) — mémorisation de la date pendant le retour arrière

**Problème** : les dates de péremption des items critiques (`isCritical: true`) doivent être
ressaisies à chaque contrôle (pas de pré-remplissage depuis le dernier contrôle, cf.
`validateur-inventaire.md`). Sans mémorisation, un aller-retour en arrière pendant le contrôle en
cours (ex. : items A, B, C, D ; B critique périssable, C périssable ; on avance jusqu'à D puis on
revient à A) faisait perdre les dates déjà saisies pour B et C durant CE contrôle, forçant une
re-saisie fastidieuse au second passage.

**Comportement** : la date de péremption saisie pour un item est mémorisée pour la durée du
contrôle en cours, indépendamment du retour arrière. Si l'item est revisité (après un ou plusieurs
retours arrière), son champ date est pré-rempli avec la dernière valeur saisie durant ce contrôle.
Le statut (Présent/Anomalie) et le commentaire, eux, restent vierges — seule la date est mémorisée.

- La mémorisation se fait à la validation de l'item (tap Présent ou Anomalie), pas à chaque frappe.
- Si l'item est revisité et que la date est modifiée (y compris effacée), la nouvelle valeur
  remplace la précédente.
- Cette mémoire est propre au contrôle en cours : elle est réinitialisée avec le reste du store au
  démarrage d'un nouveau contrôle (`init(inventoryId)`).
- Priorité de pré-remplissage pour un item périssable : mémoire de CE contrôle > (si non critique)
  dernière date connue d'un contrôle précédent (`lastExpiryDates`) > vierge.

### Calcul de "l'item précédent"

| Cas | Comportement |
|-----|-------------|
| `itemIndex > 0` | `itemIndex -= 1`, `compartmentIndex` inchangé |
| `itemIndex === 0` && `compartmentIndex > 0` | `compartmentIndex -= 1`, `itemIndex` = dernier index du compartiment précédent |
| Premier item du contrôle | Bouton non affiché |

### Suppression du résultat

`store.results` est un tableau ordonné dans l'ordre de saisie. Le retour arrière supprime le
**dernier élément** du tableau (le résultat de l'item qu'on vient de quitter pour revenir).

## Ce qui ne change pas

- Le swipe gauche/droite n'est pas affecté.
- Le bouton "Précédent" n'est pas affiché sur les écrans `welcome`, `summary`, `confirmation`.
- Pas de retour possible depuis `summary` vers les items.

## Composants concernés

| Fichier | Changement |
|---------|-----------|
| `useValidatorStore.ts` | ~~Rien — les setters existants suffisent~~ Évolution : nouveau champ `draftExpiryDates: Record<string, string>` + setter `setDraftExpiryDate(itemId, date)`, réinitialisé dans `INITIAL` |
| `useValidatorOrchestrator.ts` | Nouvelle fonction `goBack()` exposée. Évolution : `recordResult` alimente `draftExpiryDates` à chaque validation d'item ; `draftExpiryDates` exposé dans la valeur de retour |
| `ValidatorOrchestrator.tsx` | Passe `onBack` à la vue item. Évolution : `initialExpiryDate` de `ItemCard` regarde d'abord `draftExpiryDates`, puis (si non critique) `lastExpiryDates` |
| `ItemCard.tsx` ou nouveau `BackButton.tsx` | Affichage conditionnel du bouton Précédent |

## Hors scope

- Retour depuis `summary` vers les items.
- Édition in-place d'un résultat déjà saisi sans revenir en arrière.
- Mémorisation du statut (Présent/Anomalie) ou du commentaire au retour arrière — seule la date
  de péremption est concernée par l'évolution du 2026-07-19.
