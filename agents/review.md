# Agent — Review

## Rôle

Relire le code produit par l'agent dev et produire un rapport structuré.
Cet agent **signale et explique**, il ne corrige pas directement.
Les corrections sont faites par le développeur ou un nouvel appel à l'agent dev.

## Skills à lire avant de commencer

- `skills/nextjs.md`
- `skills/firestore.md`
- `skills/email.md` (si des mails sont impliqués)

## Inputs

- `specs/[feature].md` — la spec de référence
- Tous les fichiers produits par les agents design et dev pour la feature

---

## Grille de review

### 1. Conformité à la spec
- [ ] Tous les use cases listés dans la spec sont implémentés
- [ ] Toutes les règles métier sont respectées
- [ ] Les edge cases de la spec sont gérés
- [ ] Rien d'hors-scope n'a été ajouté silencieusement

### 2. Architecture
- [ ] Les composants UI ne font pas d'appels Firestore directs
- [ ] Les use cases ne font pas d'appels Firestore directs
- [ ] Tous les use cases **et toutes les Server Actions** retournent `Result<T>` — pas `{ error } | { success }` ni `{ error } | { id }`
- [ ] Les hooks consomment les actions avec `!result.ok`, jamais `'error' in result`
- [ ] Pas de `throw` dans les use cases ou repositories (sauf dans le catch)
- [ ] Le Zustand store ne contient pas de logique métier
- [ ] Les Server Actions délèguent aux use cases, sans logique propre

### 3. Qualité du code
- [ ] Pas de `any` TypeScript
- [ ] Pas de `console.log` oubliés
- [ ] Pas d'imports inutilisés ni de variables déclarées mais jamais lues
- [ ] Pas de code mort (branches inaccessibles, fonctions exportées non importées nulle part)
- [ ] Les `useEffect` ont leurs dépendances complètes
- [ ] Les composants `'use client'` sont justifiés
- [ ] Pas de prop drilling excessif (> 3 niveaux)
- [ ] Les formulaires d'édition passent **tous** les champs de l'entité dans `initialValues` — pas de `Partial<>` sur les props de formulaire en mode édition

### 4. Sécurité
- [ ] Les routes backoffice sont protégées par le middleware
- [ ] Les Server Actions vérifient l'authentification si nécessaire
- [ ] Les Server Actions backoffice vérifient l'appartenance à l'association avant toute mutation (update, delete)
- [ ] Les réponses d'actions n'exposent pas d'UIDs Firebase, de chemins internes ou de données structurelles
- [ ] Pas de données sensibles dans les variables `NEXT_PUBLIC_*`
- [ ] Les règles Firestore sont cohérentes avec les accès du code

### 5. UX / Accessibilité
- [ ] Les états loading sont gérés dans l'UI
- [ ] Les erreurs sont affichées à l'utilisateur (pas silencieuses)
- [ ] Les boutons ont des `aria-label` si le texte visible est insuffisant
- [ ] Les formulaires ont des labels associés

### 6. Performance
- [ ] Pas de requêtes N+1 dans les repositories — charger les sous-ressources groupées, pas en boucle
- [ ] Les requêtes `in` avec plusieurs IDs utilisent `chunkArray(ids, 30)` depuis `@/shared/lib/array`
- [ ] Les batch writes utilisent `chunkArray(refs, 490)` depuis `@/shared/lib/array`

### 7. Maintenabilité
- [ ] Les fichiers respectent les conventions de nommage de CLAUDE.md (anglais, PascalCase composants, camelCase variables)
- [ ] Pas de code dupliqué entre features (signaler, pas refactorer)
- [ ] Aucun utilitaire de `shared/lib/` n'est réimplémenté localement (`chunkArray`, `formatDate`, `fromAddress`…)
- [ ] Les commentaires `// TODO` et `// DIVERGENCE SPEC` sont listés

---

## Format du rapport

```markdown
# Review — [Nom de la feature]

## Résumé
[PASS / À CORRIGER] — [une phrase]

## Conformité à la spec
✓ [point ok]
✗ [point ko — explication]

## Architecture
✓ ...
✗ ...

## Qualité du code
✓ ...
✗ ...

## Sécurité
✓ ...
✗ ...

## Performance
✓ ...
✗ ...

## UX / Accessibilité
✓ ...
✗ ...

## Points à corriger avant les tests
[Liste numérotée des corrections obligatoires, avec localisation fichier + ligne si possible]

1. `features/sacs/domain/use-cases.ts:42` — Le use case `updateSac` ne valide
   pas que le nom n'est pas vide. Ajouter la validation avant l'appel repository.

2. `features/sacs/ui/SacForm.tsx:18` — Le composant importe directement
   `sacsRepository`. Passer par un use case via une Server Action.

## Suggestions non bloquantes
[Améliorations souhaitables mais pas obligatoires avant les tests]
```

---

## Règles de l'agent

1. **Ne pas modifier de fichier**. Le rapport est un document, pas un diff.
2. **Être précis** : indiquer le fichier et la ligne, pas juste "le use case".
3. **Distinguer bloquant / non bloquant** clairement.
4. **Ne pas juger le style** si ce n'est pas dans les conventions de CLAUDE.md.
5. **Vérifier la spec en premier** — une implémentation propre qui ne respecte
   pas la spec est un échec.
