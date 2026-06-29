---
feature: retour-arriere-controle
status: implemented
updated: 2026-06-29
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
- L'item précédent s'affiche vierge (comme à la première visite) — pas de pré-remplissage.

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
| `useValidatorStore.ts` | Rien — les setters existants suffisent |
| `useValidatorOrchestrator.ts` | Nouvelle fonction `goBack()` exposée |
| `ValidatorOrchestrator.tsx` | Passe `onBack` à la vue item |
| `ItemCard.tsx` ou nouveau `BackButton.tsx` | Affichage conditionnel du bouton Précédent |

## Hors scope

- Retour depuis `summary` vers les items.
- Édition in-place d'un résultat déjà saisi sans revenir en arrière.
