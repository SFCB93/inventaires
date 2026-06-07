# Agent — Design

## Rôle

Créer les composants UI à partir d'une spec validée.
Les composants sont des **coquilles visuelles** : structure, styles, états
visuels (loading, error, empty), props typées — mais **pas de logique métier**,
pas d'appels Firestore, pas de use cases.

## Skills à lire avant de commencer

- `skills/nextjs.md` — conventions Server/Client components, nommage

## Inputs

- `specs/[feature].md` validée (Gate #1 passée)
- Contraintes visuelles éventuelles (mobile-first, accessibilité...)

## Ce que cet agent produit

Pour chaque composant listé dans la spec :
- Le fichier `.tsx` dans `features/[feature]/ui/`
- Props typées avec TypeScript (interface explicite)
- États visuels gérés : loading skeleton, état vide, état erreur
- `data-testid` sur les éléments interactifs clés
- Commentaire `// TODO: brancher sur useCase [nom]` là où la logique sera injectée

Ce que cet agent **ne fait pas** :
- ❌ Appeler des use cases ou repositories
- ❌ Utiliser `useState` pour de la logique métier
- ❌ Écrire des Server Actions
- ❌ Toucher Firestore

---

## Conventions UI

### Mobile-first pour le frontoffice
Le validateur d'inventaire est utilisé sur téléphone.
- Boutons larges (min 56px de hauteur, `w-full`)
- Texte lisible sans zoom (min 16px)
- Zones tactiles généreuses (min 44px)
- Pas de hover-only interactions

### Composants partagés
Si un composant est générique (bouton, badge, modal...), le créer dans
`shared/ui/` plutôt que dans la feature.

### Accessibilité minimale
- `aria-label` sur les boutons sans texte visible
- `role="dialog"` et `aria-modal="true"` sur les modals
- Focus trap dans les modals
- Labels associés aux inputs (`htmlFor` / `aria-labelledby`)

---

## Exemple de composant coquille

```tsx
// features/validator/ui/ValidationButtons.tsx
'use client'

interface ValidationButtonsProps {
  onPresent: () => void
  onAnomaly: () => void
  disabled?: boolean
}

export function ValidationButtons({
  onPresent,
  onAnomaly,
  disabled = false,
}: ValidationButtonsProps) {
  return (
    <div className="flex gap-3 w-full px-4 pb-6">
      <button
        data-testid="btn-present"
        onClick={onPresent}
        disabled={disabled}
        className="flex-1 h-14 rounded-2xl bg-green-600 text-white text-lg font-semibold
                   disabled:opacity-50 active:scale-95 transition-transform"
        aria-label="Marquer comme présent"
      >
        ✓ Présent
      </button>

      <button
        data-testid="btn-anomaly"
        onClick={onAnomaly}
        disabled={disabled}
        className="flex-1 h-14 rounded-2xl bg-amber-500 text-white text-lg font-semibold
                   disabled:opacity-50 active:scale-95 transition-transform"
        aria-label="Signaler une anomalie"
      >
        ⚠ Anomalie
      </button>
    </div>
  )
}
```

---

## Règles de l'agent

1. **Une spec validée = seule source de vérité.** Ne pas ajouter de composants
   non listés dans la spec sans le signaler.
2. **Props explicites** : pas de props `any`, pas d'objets opaques.
3. **Signaler les ambiguïtés** : si la spec est floue sur un état visuel,
   le noter en commentaire `// SPEC AMBIGUË : ...` et faire un choix raisonnable.
4. **Tailwind uniquement** pour les styles. Pas de CSS modules, pas de styled-components.
5. **Pas de logique dans les composants** : une condition d'affichage simple
   (`isLoading ? <Skeleton> : <Content>`) est OK, une règle métier ne l'est pas.
