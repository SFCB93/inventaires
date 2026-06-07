# Skill — Testing

## Philosophie

Dans ce projet, les tests ont deux objectifs précis :

**1. Protéger contre les régressions.**
Quand une IA modifie du code, elle peut casser silencieusement un comportement existant sans s'en rendre compte. Les tests détectent ces cassures avant qu'elles n'atteignent la prod.

**2. Vérifier que l'implémentation respecte la spec.**
Chaque règle métier de `specs/[feature].md` doit se traduire par au moins un test. Si la règle n'est pas testée, le dev IA peut l'ignorer ou la mal interpréter sans que ça se voie.

**Ce que les tests ne sont PAS dans ce projet :**
- Un objectif de coverage (pas de seuil à atteindre)
- Une documentation exhaustive du code
- Un filet de sécurité pour chaque ligne

**Règle d'or** : un test vaut quelque chose s'il peut échouer. Si un test ne peut jamais rater parce qu'il teste un détail d'implémentation ou un comportement trivial, ne l'écris pas.

---

## Ce qui mérite d'être testé

### Use cases — toujours

Les use cases sont le cœur de la spec. Chaque règle métier explicite dans `specs/[feature].md` doit avoir un test qui l'exprime.

Exemples de règles qui méritent un test :
- "Le commentaire est obligatoire en cas d'Anomalie"
- "La date de péremption est obligatoire pour les matériels critiques"
- "Le nom du vérificateur est obligatoire à la soumission"
- "Un échec d'envoi mail ne bloque pas la confirmation"

Exemples de choses qui ne méritent pas de test :
- Le happy path trivial sans règle métier
- Les comportements couverts par TypeScript (types, nullability)

### Composants — seulement les comportements non triviaux

Tester un composant si et seulement si :
- Il contient une règle métier visible (ex : bloquer un bouton selon une condition)
- Il a un état conditionnel critique (ex : afficher une erreur, désactiver un champ)
- Il serait difficile de détecter une régression sans test (ex : la modale reste ouverte si le commentaire est vide)

Ne pas tester :
- Le rendu de base (texte statique, mise en page)
- Les styles CSS
- Les comportements évidents couverts par les types

### E2E — parcours critiques uniquement

Un test E2E si et seulement si le parcours est dans cette liste :
- Parcours complet du validateur (frontoffice)
- Signalement d'une anomalie avec commentaire
- Saisie d'une date de péremption sur matériel critique
- Login backoffice + mutation critique

---

## Trois niveaux, trois outils

| Niveau | Outil | Cible |
|--------|-------|-------|
| Unitaire | Vitest | Use cases (règles métier, erreurs) |
| Composant | Vitest + Testing Library | Comportements UI non triviaux |
| E2E | Playwright | Parcours critiques complets |

---

## Configuration Vitest

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    exclude: ['**/node_modules/**', 'e2e/**'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

```ts
// src/tests/setup.ts
import '@testing-library/jest-dom'
```

---

## Tests de use cases

Mocker les repositories. Tester les règles métier, pas le code.

```ts
// features/validator/domain/use-cases.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { submitControlUseCase } from './use-cases'
import { validatorRepository } from '../data/repository'

vi.mock('../data/repository', () => ({
  validatorRepository: {
    saveControl: vi.fn(),
    getInventoryAssociationId: vi.fn(),
    getAssociationEmails: vi.fn(),
  },
}))

// ✓ Règle spec : "Le nom du vérificateur est obligatoire"
it("retourne une erreur si le nom du vérificateur est vide", async () => {
  const result = await submitControlUseCase(
    { ...mockSubmission, verifierName: '   ' },
    { inventoryName: 'VSL 42', anomalies: [], expiryDates: [] },
  )
  expect(result.ok).toBe(false)
  expect(validatorRepository.saveControl).not.toHaveBeenCalled()
})

// ✓ Règle spec : "Un échec d'envoi mail ne bloque pas la confirmation"
it("ne bloque pas la confirmation si l'envoi mail échoue", async () => {
  vi.mocked(sendControlCompletedEmail).mockResolvedValue({ ok: false, error: 'timeout' })
  const result = await submitControlUseCase(mockSubmission, emailContext)
  expect(result.ok).toBe(true)
})
```

---

## Tests de composants

Tester le comportement, pas l'implémentation. Utiliser `userEvent` plutôt que `fireEvent`.

```tsx
// ✓ Règle spec : "La popup bloque la fermeture si le commentaire est vide"
it("ne ferme pas la modale si le commentaire est vide", async () => {
  const user = userEvent.setup()
  const onConfirm = vi.fn()
  render(<AnomalyModal isOpen={true} onConfirm={onConfirm} onCancel={vi.fn()} />)

  await user.click(screen.getByTestId('btn-confirm-anomaly'))

  expect(onConfirm).not.toHaveBeenCalled()
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})
```

Toujours mocker `next/image` dans les tests de composants :
```ts
vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}))
```

---

## Tests E2E (Playwright)

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry' },
  projects: [{ name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } }],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
})
```

Les tests E2E utilisent les données de seed (`npx tsx scripts/seed-dev.ts`).
Annoter chaque test avec la règle spec qu'il couvre.

---

## Organisation des fichiers

```
features/
  validator/
    domain/
      use-cases.ts
      use-cases.test.ts   ← règles métier des use cases
    ui/
      AnomalyModal.tsx
      AnomalyModal.test.tsx  ← comportements non triviaux seulement

e2e/
  validator.spec.ts      ← parcours critiques
```

---

## Ce qu'il ne faut PAS faire

- ❌ Viser un pourcentage de coverage
- ❌ Tester chaque composant par principe
- ❌ Écrire un test pour chaque ligne de code
- ❌ Tester ce que TypeScript garantit déjà
- ❌ Dupliquer dans les tests ce qui est déjà couvert par les types
- ❌ Écrire des tests qui ne peuvent pas échouer
