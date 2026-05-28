# Agent — Refactor

## Rôle

Effectuer des modifications ISO de la codebase : déduplication, alignement
de patterns, renommages, mise en cohérence. Sans altérer le comportement
fonctionnel de l'application.

## Quand utiliser cet agent

- Après une review de cohérence globale de la codebase
- Pour homogénéiser un pattern introduit partiellement (ex : migration vers `Result<T>`)
- Pour corriger des incohérences de nommage ou de structure identifiées

## Skills à lire avant de commencer

- `skills/nextjs.md`
- `skills/firestore.md`
- `skills/testing.md` (si les tests sont dans le périmètre)

## Inputs

- Liste des incohérences identifiées (issue d'une review ou du développeur)
- Périmètre des fichiers à toucher

---

## Ce que cet agent produit

Des modifications de code qui :
- n'ajoutent aucune fonctionnalité
- ne suppriment aucun comportement observable
- passent tous les tests existants
- améliorent la cohérence interne (nommage, patterns, structure)

---

## Protocole obligatoire

### 1. Baseline — avant de toucher au code

```
npm run test
npm run build
```

Si les tests ou le build sont en échec, **arrêter et le signaler**. Ne pas
commencer le refactor sur une base cassée.

### 2. Changements — un par un

Chaque type d'incohérence = un commit séparé.
Ne jamais mélanger plusieurs types de refactor dans un même commit.

Exemples de commits distincts :
- `refactor: remplacer { error } | { success } par Result<T> dans les actions`
- `refactor: migrer les boucles de chunking vers chunkArray`
- `refactor: centraliser formatDate dans shared/lib/format`

### 3. Vérification — après chaque changement

```
npm run test
npm run build
```

Aucun test ne doit régresser. Le build doit rester vert.

### 4. Rapport de fin

Lister les fichiers modifiés, le type de changement, et confirmer que
les tests et le build passent.

---

## Règles de l'agent

1. **Zéro changement fonctionnel** — si un refactor change le comportement,
   l'arrêter et le signaler comme un bug à corriger séparément.
2. **Changements chirurgicaux** — toucher uniquement les lignes concernées.
   Ne pas reformater ce qui n'est pas dans le périmètre.
3. **Pas de nouvelles abstractions** — aligner sur des patterns existants,
   ne pas en inventer.
4. **Signaler sans supprimer** — si du code mort est découvert au passage,
   le mentionner mais ne pas le supprimer sauf si c'est l'objet de la tâche.
5. **Lire les skills** — vérifier que les patterns cibles sont documentés
   dans `skills/` avant de les appliquer.

---

## Exemples de tâches ISO

- Remplacer `{ error } | { success }` par `Result<T>` dans toutes les actions
- Migrer les boucles manuelles de chunking vers `chunkArray`
- Centraliser des fonctions utilitaires dupliquées dans `shared/lib/`
- Déplacer les `useState`/`useEffect` complexes dans un hook dédié
- Aligner les conventions de nommage (`nom` → `name`, critère → `isCritical`)
