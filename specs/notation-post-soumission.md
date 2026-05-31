# Spec — Notation / feedback post-soumission

## Contexte

Après soumission d'un contrôle, le secouriste voit une page de confirmation. On souhaite recueillir
un feedback sur le déroulement du contrôle (clarté des instructions, matériel bien identifié, etc.)
pour améliorer l'expérience au fil du temps.

## Flow

```
Soumission réussie
  → RatingScreen  (nouveau step 'rating')
    → si soumis ou ignoré → ConfirmationScreen
```

## RatingScreen

### Notation

- 5 étoiles interactives (tap pour sélectionner).
- La note sélectionnée se distingue visuellement des autres (remplissage, couleur).
- Aucune note pré-sélectionnée à l'ouverture.

### Commentaire

- Champ texte libre, placeholder "Qu'est-ce qui pourrait être amélioré ?".
- **Obligatoire si note < 5** — message d'erreur affiché sous le champ si absent à la soumission.
- Facultatif si note = 5.

### Boutons

- **Envoyer** — soumet la note (+ commentaire si renseigné). Grisé si aucune étoile sélectionnée.
- **Passer** (lien discret, pas un bouton principal) — ignore le feedback et va à `ConfirmationScreen`.

### États du bouton Envoyer

| Condition | État |
|-----------|------|
| Aucune étoile sélectionnée | Désactivé |
| Note < 5, commentaire vide | Activé mais affiche erreur à la soumission |
| Note 5 ou (note < 5 + commentaire) | Soumission → ConfirmationScreen |

## Modèle de données

Nouvelle collection Firestore : **`feedbacks`**

```
feedbacks/{id}
  controlId   : string   — référence au contrôle associé
  rating      : number   — 1 à 5
  comment     : string   — '' si absent
  submittedAt : Timestamp
```

Pas d'associationId ni d'inventoryId stockés : le `controlId` suffit pour joindre.

## Composants à créer

| Fichier | Rôle |
|---------|------|
| `RatingScreen.tsx` | Écran notation (coquille visuelle) |
| `hooks/useRatingScreen.ts` | État étoiles + commentaire + soumission |

## Fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `useValidatorStore.ts` | Nouveau step `'rating'` dans `ValidatorStep` ; nouveau champ `controlId: string` ; setter `setControlId` |
| `useValidatorOrchestrator.ts` | `handleSubmit` stocke le `controlId` retourné ; `setStep('rating')` au lieu de `'confirmation'` |
| `ValidatorOrchestrator.tsx` | Nouveau cas `step === 'rating'` → `<RatingScreen>` |
| `domain/actions.ts` | Nouvelle `submitFeedbackAction` |
| `domain/use-cases.ts` | Nouveau `submitFeedbackUseCase` |
| `data/repository.ts` | Nouvelle méthode `saveFeedback` |
| `domain/types.ts` | Nouveau type `FeedbackSubmission` |

## Hors scope

- Dashboard de consultation des feedbacks (feature future).
- Notification par email en cas de mauvaise note.
- Modification d'un feedback déjà soumis.
