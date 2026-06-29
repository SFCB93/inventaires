---
feature: notation-post-soumission
status: implemented
updated: 2026-06-29
---

# Spec — Notation post-soumission

## Objectif

Recueillir un feedback du secouriste juste après la soumission d'un contrôle,
pour mesurer la qualité perçue du déroulement et identifier les points à améliorer.

## Utilisateurs concernés

- [x] Secouriste (frontoffice, non authentifié)

## Parcours principal

1. Le secouriste soumet le contrôle (bouton "Soumettre le contrôle" sur le récapitulatif).
2. La soumission réussit — au lieu de l'écran de confirmation, un écran de notation s'affiche.
3. Le secouriste sélectionne une note de 1 à 5 étoiles.
4. Si la note est inférieure à 5, il saisit un commentaire (obligatoire).
5. Il appuie sur "Envoyer" — le feedback est enregistré.
6. L'écran de confirmation habituel s'affiche.

## Parcours alternatifs et edge cases

- Si le secouriste ne souhaite pas noter → bouton "Passer" : aucun feedback enregistré, affichage direct de la confirmation.
- Si aucune étoile n'est sélectionnée → bouton "Envoyer" désactivé.
- Si note < 5 et commentaire vide → message d'erreur sous le champ, soumission bloquée.
- Si l'envoi du feedback échoue (réseau) → message d'erreur affiché, bouton "Réessayer", le secouriste peut aussi "Passer".
- Si le secouriste clique "Passer" pendant une soumission en cours → bouton désactivé (isSubmitting).

## Règles métier

- La notation est **facultative** : un secouriste peut toujours passer sans noter.
- Le commentaire est **obligatoire pour toute note strictement inférieure à 5**.
- La note doit être un entier entre 1 et 5 inclus.
- L'échec de l'enregistrement du feedback **ne bloque pas** la confirmation du contrôle : "Passer" reste accessible.
- Le feedback est lié au `controlId` du contrôle qui vient d'être soumis.

## Composants UI à créer

- `RatingScreen` — écran de notation : 5 étoiles interactives, champ commentaire, bouton Envoyer, lien Passer
- `hooks/useRatingScreen` — état des étoiles, commentaire, soumission, gestion erreurs

## Use cases à implémenter

- `submitFeedbackUseCase(submission: FeedbackSubmission)` → `Result<void>`
  - Valide que `rating` est entre 1 et 5
  - Valide que `comment` est renseigné si `rating < 5`
  - Délègue à `validatorRepository.saveFeedback`

## Données

Collection Firestore : **`feedbacks`**

```
feedbacks/{id}
  controlId   : string    — référence au contrôle associé
  rating      : number    — entier 1 à 5
  comment     : string    — chaîne vide si non renseigné
  submittedAt : Timestamp
```

Modification du store Zustand `useValidatorStore` :
- Ajout du step `'rating'` dans `ValidatorStep`
- Ajout du champ `controlId: string` et son setter `setControlId`

Modification de `submitControlAction` :
- Retourne `Result<{ controlId: string }>` (au lieu de `Result<void>`)
  pour permettre au store de mémoriser l'identifiant du contrôle soumis.

## Notifications mail

Aucune.

## Hors scope

- Consultation des feedbacks dans le backoffice.
- Notification par email en cas de mauvaise note.
- Modification ou suppression d'un feedback soumis.
- Affichage de statistiques de satisfaction.
