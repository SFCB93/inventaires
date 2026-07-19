# Secourisme — Gestion du matériel

Site web de gestion du matériel pour une association de secourisme.

## Fonctionnalités principales

**Backoffice (authentifié)**
- Gestion des inventaires (véhicules, armoires, sacs…), emplacements, matériels
- Suivi des péremptions
- Génération de QR codes par inventaire
- Tableau de bord des contrôles reçus

**Frontoffice (public, accès par QR code)**
- Contrôle séquentiel emplacement par emplacement, matériel par matériel
- Interface mobile-first : photo, nom du matériel
- Deux boutons larges : ✓ Présent / ⚠ Anomalie
- Swipe gauche/droite en complément
- Popup commentaire obligatoire si Anomalie
- Champ date de péremption sur chaque carte (facultatif, obligatoire pour `isCritical`)
- Saisie du nom du vérificateur à la soumission

**Notifications**
- Mail aux responsables à chaque contrôle réalisé (anomalies + dates de péremption saisies)
- Alertes péremption imminente (feature future)

---

## Stack

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 15 (App Router) |
| Base de données | Firestore (Firebase) |
| Auth | Firebase Auth (backoffice uniquement) |
| Mail | Resend + react-email |
| QR Code | qrcode (génération uniquement) |
| State global | Zustand |
| Tests | Vitest + Testing Library + Playwright |

---

## Structure des dossiers

```
src/
├── app/                        # Routes Next.js App Router
│   ├── (backoffice)/           # Route group — authentifié
│   │   └── dashboard/
│   │       ├── inventaires/
│   │       ├── materiels/
│   │       └── controles/
│   ├── (frontoffice)/          # Route group — public
│   │   └── inventaire/
│   │       └── [inventaireId]/
│   └── api/                    # Route handlers (webhooks, etc.)
│
├── features/                   # Une feature = un dossier
│   ├── [feature]/
│   │   ├── ui/                 # Composants React (coquilles visuelles)
│   │   ├── domain/             # Use cases, types, règles métier
│   │   └── data/               # Repositories Firestore
│   └── ...
│
├── shared/
│   ├── ui/                     # Composants génériques réutilisables
│   ├── domain/                 # Types partagés, Result<T>
│   ├── data/                   # Firebase init, helpers Firestore
│   └── lib/                    # Utilitaires (dates, formatage...)
│
└── emails/                     # Templates react-email
```

---

## Conventions fondamentales

### Result<T>
Tous les use cases retournent `Result<T>` :
```ts
type Result<T> = { ok: true; value: T } | { ok: false; error: string }
```
Jamais de throw dans les use cases. Les erreurs sont des valeurs.

### Flux de données
```
UI (hooks/composants)
  → use cases (domain/)
    → repositories (data/)
      → Firestore
```
Les hooks et composants UI ne touchent **jamais** Firestore directement.
Ils appellent uniquement des use cases.

### State global
Zustand uniquement pour l'état UI partagé entre plusieurs composants
(ex : progression d'un inventaire en cours).
L'état local reste dans les composants.

### Réfléchir avant de coder
Ne pas supposer. Ne pas masquer la confusion. Exposer les compromis.

Avant d'implémenter :
- Énoncer ses hypothèses explicitement. En cas de doute, demander.
- Si plusieurs interprétations existent, les présenter — ne pas en choisir une silencieusement.
- Si une approche plus simple existe, la proposer. Pousser en retour quand c'est justifié.
- Si quelque chose n'est pas clair, s'arrêter. Nommer ce qui est confus. Demander.

### Simplicité avant tout
Code minimal qui résout le problème. Rien de spéculatif.

- Aucune feature au-delà de ce qui est demandé.
- Aucune abstraction pour du code à usage unique.
- Aucune "flexibilité" ou "configurabilité" qui n'a pas été demandée.
- Pas de gestion d'erreur pour des scénarios impossibles.
- Si tu écris 200 lignes et que 50 suffisent, réécris.

Se demander : "Un senior dirait-il que c'est trop compliqué ?" Si oui, simplifier.

### Formulaires d'édition — règle stricte
Ne jamais typer `initialValues` avec `Partial<FormValues>` sur un formulaire d'édition.
En mode édition, toutes les données de l'entité sont disponibles — les passer toutes explicitement.
`Partial<>` masque les oublis de champs au typage et crée des bugs silencieux (valeur par défaut au lieu de la vraie valeur).

```ts
// ✗ — Partial accepte { name, photoUrl } sans hasExpiry → bug silencieux
initialValues?: Partial<ItemFormValues>

// ✓ — TypeScript force à passer tous les champs en mode édition
initialValues?: ItemFormValues
```

### Changements chirurgicaux
Toucher uniquement ce qui doit l'être. Ne nettoyer que ce qu'on a soi-même sali.

Lors d'une modification :
- Ne pas "améliorer" le code adjacent, les commentaires ou le formatage.
- Ne pas refactorer ce qui n'est pas cassé.
- Respecter le style existant, même si on ferait autrement.
- Si du code mort sans rapport est repéré, le mentionner — ne pas le supprimer.

Quand les modifications créent des orphelins :
- Supprimer les imports/variables/fonctions rendus inutiles par NOS changements.
- Ne pas supprimer le code mort préexistant sauf si demandé explicitement.

Le test : chaque ligne modifiée doit se tracer directement à la demande.

### Exécution orientée objectif
Définir des critères de succès. Itérer jusqu'à vérification.

Transformer les tâches en objectifs vérifiables :
- "Ajouter de la validation" → "Écrire des tests pour les inputs invalides, puis les faire passer"
- "Corriger le bug" → "Écrire un test qui le reproduit, puis le faire passer"
- "Refactorer X" → "S'assurer que les tests passent avant et après"

Pour les tâches multi-étapes, énoncer un plan court :
```
1. [Étape] → vérifier : [contrôle]
2. [Étape] → vérifier : [contrôle]
```

Des critères solides permettent d'itérer de façon autonome. Des critères vagues ("faire en sorte que ça marche") nécessitent des clarifications constantes.

### Taille des fichiers — règle stricte
**Viser 100 lignes** par fichier, **maximum toléré 120**. Exceptions admises au-delà uniquement pour :
- Repositories avec opérations en cascade complexes
- Fichiers de tests (suites de tests longues)

Pour dépasser 120 lignes, documenter pourquoi dans un commentaire en tête de fichier.

### Hooks React — règle stricte
Les hooks personnalisés sont **toujours dans leur propre fichier** `ui/hooks/useXxx.ts`.
Un composant UI ne contient jamais de `useState` / `useEffect` complexes directement.
Il importe son hook et n'est qu'une coquille de rendu.

```
features/[feature]/ui/
  hooks/
    useXxx.ts       ← state + logique
  Xxx.tsx           ← import hook + JSX uniquement
```

Exception : état local trivial (`isOpen`, `isHovered`) peut rester dans le composant si le fichier reste sous 120 lignes.

### Nommage — règle absolue
Tout le code est en **anglais** : noms de types, interfaces, variables, fonctions, composants,
fichiers, `data-testid`, champs Firestore (`isCritical`, `order`, `photoUrl`, `expiryDate`…).
Seules les chaînes affichées à l'utilisateur (labels, messages, placeholders) restent en français.

### Modèle de données — hiérarchie principale
```
associations
  └── inventaires  (véhicule, armoire, sac…)
        └── emplacements  (triés par order)
              └── materiels  (triés par order)
controles          (résultats de chaque contrôle soumis)
```
Un compte admin appartient à une association. Il configure les adresses mail
destinataires des rapports de contrôle pour cette association.

### Vocabulaire métier
- **inventaire** : l'objet physique contrôlé (véhicule, armoire, sac…), identifié par un QR code
- **contrôle** : la session de vérification réalisée par un secouriste à un instant donné
- **emplacement** : compartiment d'un inventaire (tiroir, poche, compartiment…)
- **matériel** : article individuel dans un emplacement

### Auth
Firebase Auth côté backoffice uniquement.
Le frontoffice (validateur) est entièrement public.
Middleware Next.js protège le route group `(backoffice)`.

### Sécurité — règles strictes
**Vérification d'appartenance** : avant toute mutation backoffice (update, delete),
vérifier que la ressource appartient à l'association de l'utilisateur connecté.
Appeler `checkOwnership(resourceId, associationId)` en début d'action.
Si la vérification échoue : `return err('Accès non autorisé.')`.
Ne jamais omettre cette vérification, même si la route est protégée par le middleware.

**Ne pas exposer d'informations internes** dans les réponses d'actions :
- Pas d'UIDs Firebase
- Pas de chemins de stockage internes
- Retourner `ok(undefined)` quand la valeur n'est pas utilisée côté client

**Comptes orphelins Firebase Auth** : `createAssociation` et `createAdminAccount` créent
d'abord le compte Firebase Auth, puis écrivent dans Firestore.
Si l'étape Firestore échoue, un compte Auth existe sans document `users/` associé.
Le log `[createAssociation] Compte Auth créé (UID) mais échec Firestore — nettoyage manuel requis.`
indique ce cas. Procédure : supprimer l'UID manuellement dans la console Firebase Auth.

---

## Agents disponibles

| Agent | Fichier | Rôle |
|-------|---------|------|
| Spec | `agents/spec.md` | Transforme une demande en spec fonctionnelle |
| Design | `agents/design.md` | Crée les composants UI (coquilles visuelles) |
| Dev | `agents/dev.md` | Implémente use cases, repositories, branchement |
| Review | `agents/review.md` | Relit le code et produit un rapport structuré |
| Test | `agents/test.md` | Écrit les tests après validation de la review |
| Refactor | `agents/refactor.md` | Modifications ISO (déduplication, alignement de patterns, nommage) |

---

## Workflow standard

```
[Demande] → Agent spec → specs/[feature].md
                              ↓
                         ⛔ GATE SPEC — validation humaine
                              ↓
                         Agent design → composants UI
                              ↓
                         Agent dev → logique + data
                              ↓
                         ⛔ GATE IMPLÉMENTATION — validation humaine
                              ↓
                         Agent review → rapport
                              ↓
                         Agent test → tests
```

**Workflow de cohérence (ponctuel)** :
```
[Constat d'incohérence] → Agent review (périmètre codebase)
                                ↓
                           Agent refactor → corrections ISO
                                ↓
                           npm test + npm run build
```

### Gates strictes
- **Gate Spec** : s'arrêter après avoir produit `specs/[feature].md`.
  Afficher : `⛔ GATE SPEC — Spec produite. Valide avant de continuer.`
  Ne pas lancer le design sans confirmation explicite.

- **Gate Implémentation** : s'arrêter après le dev.
  Afficher : `⛔ GATE IMPLÉMENTATION — Implémentation terminée. Valide avant la review.`
  Ne pas lancer la review sans confirmation explicite.

---

## Skills disponibles

Les skills vivent dans `skills/` et se déclenchent automatiquement selon leur description frontmatter.

---

## Gestion du Git

### Quand commiter et pousser

**Commits autorisés librement** : corrections de bugs, fixes de build, ajustements CSS/UI mineurs.

**Commit + push après validation explicite** : une feature complète (spec → design → dev → review → test) ne doit être commitée et poussée qu'après confirmation de l'utilisateur.

Afficher à la fin du workflow :
`✅ FEATURE VALIDÉE — Prêt à commiter et pousser. Confirme pour continuer.`

Ne pas commiter ni pousser sans cette confirmation.

### Convention des messages de commit

Format : `type: description courte en français`

| Type | Usage |
|------|-------|
| `feat` | Nouvelle feature |
| `fix` | Correction de bug |
| `chore` | Config, deps, outillage |
| `test` | Ajout ou modification de tests |
| `docs` | Documentation |
| `refactor` | Refactoring sans changement de comportement |

Un commit par feature ou sous-ensemble cohérent. Pas de commits fourre-tout.

### Remote

- Chaque push sur `main` déclenche un déploiement automatique sur Vercel.
- Ne jamais pousser un code qui casse le build.

---

## Amélioration continue des skills et agents

Si, au cours d'une discussion ou d'une analyse de bug, il apparaît qu'un changement dans un fichier `CLAUDE.md`, `agents/*.md` ou `skills/*.md` aurait pu éviter le problème, proposer la modification et l'appliquer avec la permission explicite de l'utilisateur.
