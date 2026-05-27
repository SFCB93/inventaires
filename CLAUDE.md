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

### Taille des fichiers — règle stricte
**Maximum 100 lignes** par fichier. Exceptions admises uniquement pour :
- Repositories avec opérations en cascade complexes
- Fichiers de tests (suites de tests longues)

Pour les dépasser, documenter pourquoi dans un commentaire en tête de fichier.

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

Exception : état local trivial (`isOpen`, `isHovered`) peut rester dans le composant si le fichier reste sous 100 lignes.

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

---

## Agents disponibles

| Agent | Fichier | Rôle |
|-------|---------|------|
| Spec | `agents/spec.md` | Transforme une demande en spec fonctionnelle |
| Design | `agents/design.md` | Crée les composants UI (coquilles visuelles) |
| Dev | `agents/dev.md` | Implémente use cases, repositories, branchement |
| Review | `agents/review.md` | Relit le code et produit un rapport structuré |
| Test | `agents/test.md` | Écrit les tests après validation de la review |

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

### Gates strictes
- **Gate Spec** : s'arrêter après avoir produit `specs/[feature].md`.
  Afficher : `⛔ GATE SPEC — Spec produite. Valide avant de continuer.`
  Ne pas lancer le design sans confirmation explicite.

- **Gate Implémentation** : s'arrêter après le dev.
  Afficher : `⛔ GATE IMPLÉMENTATION — Implémentation terminée. Valide avant la review.`
  Ne pas lancer la review sans confirmation explicite.

---

## Skills disponibles

| Skill | Fichier | Quand le lire |
|-------|---------|---------------|
| Next.js | `skills/nextjs.md` | Avant tout travail sur les routes, layouts, Server Actions |
| Firestore | `skills/firestore.md` | Avant tout travail sur la couche data/ |
| Testing | `skills/testing.md` | Avant d'écrire des tests |
| Email | `skills/email.md` | Avant de toucher les templates ou l'envoi mail |

**Règle** : lire le ou les skills pertinents avant de commencer chaque agent.

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

- Remote : `git@github.com:Gguigre/inventaires.git` (branche `main`)
- Chaque push sur `main` déclenche un déploiement automatique sur Vercel.
- Ne jamais pousser un code qui casse le build.

---

## Amélioration continue des skills et agents

Si, au cours d'une discussion ou d'une analyse de bug, il apparaît qu'un changement dans un fichier `CLAUDE.md`, `agents/*.md` ou `skills/*.md` aurait pu éviter le problème, proposer la modification et l'appliquer avec la permission explicite de l'utilisateur.
