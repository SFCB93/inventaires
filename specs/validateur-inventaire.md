---
feature: validateur-inventaire
status: implemented
updated: 2026-06-29
---

# Spec — Validateur d'inventaire (frontoffice)

## Objectif

Permettre à un secouriste de contrôler le contenu d'un inventaire (véhicule, armoire, sac…) emplacement par emplacement, matériel par matériel, depuis son téléphone, en scannant un QR code, sans compte requis.

## Utilisateurs concernés

- [x] Secouriste (frontoffice, non authentifié)
- [ ] Responsable / Admin (backoffice, authentifié)

---

## Parcours principal

1. Le secouriste scanne le QR code collé sur l'inventaire → son téléphone ouvre `/inventaire/[inventaireId]`.
2. La **WelcomeScreen** affiche :
   - Le nom de l'inventaire, le nombre d'emplacements et le nombre total de matériels.
   - Un **mini tuto swipe** : 3 illustrations SVG côte à côte montrant les gestes disponibles (carte colorée décalée + flèche directionnelle).
   - Un lien discret **"Voir les derniers contrôles →"** vers `/inventaire/[inventaireId]/controles`.
   - Le bouton **Commencer le contrôle**.
3. Avant chaque emplacement, une **carte d'emplacement** affiche le nom du compartiment. Le secouriste swipe dans n'importe quelle direction (ou tape) pour entrer dans l'emplacement.
4. Pour chaque matériel de l'emplacement (trié par `order`) :
   - La photo du matériel (si renseignée).
   - Son nom.
   - Un champ **date de péremption** uniquement si `hasExpiry: true`, labellisé "(facultatif)" ou "(obligatoire)" selon `isCritical`.
5. Le secouriste peut renseigner la date de péremption avant sa décision.
6. Le secouriste appuie sur **✓ Présent** ou **⚠ Anomalie** (ou swipe gauche/droite), ou swipe **vers le bas** pour signaler que le matériel est **Absent**.
7. Si **Anomalie** → une popup s'ouvre, le commentaire est obligatoire avant de continuer.
8. Si **Absent** (swipe bas) → enregistré directement comme anomalie avec commentaire "Absent", sans popup ni validation de date.
9. Si le matériel est `isCritical: true` et la date est vide → impossible de valider **Présent**. Les décisions Anomalie et Absent ne sont pas bloquées.
10. L'écran avance automatiquement au matériel suivant dans le même emplacement.
11. Quand tous les matériels d'un emplacement sont traités → carte d'emplacement du suivant (trié par `order`).
12. Après le dernier matériel du dernier emplacement → écran récapitulatif groupé par emplacement : statut de chaque matériel, anomalies mises en avant.
13. Le secouriste saisit son **nom** (champ obligatoire) puis appuie sur **Soumettre le contrôle**.
14. Écran de confirmation terminal : "Contrôle enregistré. Merci !" avec la date et l'heure.
15. Un mail de synthèse est envoyé aux adresses configurées sur le compte admin de l'association.

---

## Pré-remplissage de la date de péremption

Pour les matériels `hasExpiry: true, isCritical: false` (périssables non critiques), le champ date de péremption est pré-rempli avec la **dernière date connue** issue des contrôles précédents, si elle existe.

**Règles :**
- Uniquement pour `hasExpiry: true, isCritical: false`. Les matériels critiques ne sont jamais pré-remplis : la date doit être re-saisie à chaque contrôle pour garantir sa fraîcheur.
- La date pré-remplie est modifiable librement par le secouriste.
- Si aucun contrôle précédent n'a enregistré de date pour ce matériel → champ vide.

**Source de données :** les 3 contrôles les plus récents de l'inventaire, requête Firestore `.orderBy('submittedAt', 'desc').limit(3)`. On construit une map `itemId → dernière expiryDate connue` (premier contrôle avec une date pour cet item).

---

## Champ date de péremption — format et validation

Le champ utilise `<input type="month">` :
- Sur **Android et iOS** → picker mois+année natif.
- Sur **Safari Desktop** (pas de support natif de `type="month"`) → champ texte libre avec placeholder `"AAAA-MM ou MM-AAAA"`.

**Formats acceptés :**
- `AAAA-MM` (ex. `2026-08`) — retourné par le picker natif.
- `MM-AAAA` (ex. `08-2026`) — saisie texte libre fallback.
- L'année doit commencer par `20` (péremptions en 20XX uniquement).

**Conversion :** toute valeur valide est convertie en `"YYYY-MM-01"` (1er du mois) avant stockage.

**Validation :** avant toute décision (Présent ou Anomalie), le format est validé. Si invalide → message d'erreur, décision bloquée. La validation n'est **pas** appliquée à la décision Absent.

**Bouton ×** : visible quand le champ contient une valeur, efface la date et réinitialise l'erreur éventuelle.

---

## Mini tuto swipe (WelcomeScreen)

Bloc statique affiché entre le texte d'intro et le bouton "Commencer". Trois illustrations SVG côte à côte :

| Geste | Direction | Couleur | Action |
|-------|-----------|---------|--------|
| Swipe droite | → | Amber | ⚠ Anomalie |
| Swipe gauche | ← | Emerald | ✓ Présent |
| Swipe bas | ↓ | Slate | ✕ Absent |

Chaque illustration montre : une carte de fond (blanc, bordure grise) + une carte colorée décalée dans la direction du geste + une flèche de la même couleur indiquant le mouvement. Composant entièrement statique, aucun state.

---

## Historique des contrôles (`/inventaire/[inventaireId]/controles`)

Page publique accessible depuis la WelcomeScreen (lien "Voir les derniers contrôles →").

**Affichage :**
- Les **10 derniers contrôles** de cet inventaire, triés du plus récent au plus ancien.
- Requête Firestore avec index composite : `inventoryId ASC + submittedAt DESC`, `.limit(10)`.
- Chaque contrôle est une ligne cliquable (**accordion**) affichant : nom du vérificateur, date/heure de soumission formatée en français, badge nombre d'anomalies.
- **Un seul contrôle peut être déployé à la fois.**
- Contenu déployé d'un contrôle :
  - Liste des anomalies : emplacement / matériel / commentaire.
  - Liste des dates de péremption saisies : emplacement / matériel / mois et année formaté.
  - Si aucune anomalie ni aucune péremption : "✓ Aucune anomalie — contrôle conforme".
- Lien "← Retour" vers la WelcomeScreen.

**Cas d'erreur :**
- `inventaireId` inconnu → `ErrorScreen`.
- Erreur Firestore sur les contrôles → `ErrorScreen` (erreur propagée, pas de liste vide silencieuse).
- Aucun contrôle soumis → message "Aucun contrôle réalisé pour l'instant."

---

## Parcours alternatifs et edge cases

- `inventaireId` inconnu ou supprimé → `ErrorScreen` : "Cet inventaire n'existe pas ou a été supprimé."
- Inventaire sans emplacement, ou tous emplacements vides → `ErrorScreen` : "Cet inventaire ne contient aucun matériel à contrôler."
- Emplacement sans matériel → silencieusement ignoré.
- Fermeture de l'onglet en cours de contrôle → redémarrage de zéro à la réouverture. Aucune persistance partielle.
- Échec de soumission → message d'erreur non bloquant, bouton Réessayer visible. Les réponses saisies sont conservées (Zustand) pour permettre le retry.
- Commentaire d'anomalie vide → impossible de fermer la popup.
- Nom du vérificateur vide à la soumission → impossible de soumettre.
- Après soumission réussie → page de confirmation terminale, pas de modification possible.
- Chargement des dates précédentes échoue → contrôle démarre normalement, champs vides (dégradé silencieux non bloquant).
- Matériel ou emplacement supprimé après un contrôle → les noms dans l'historique affichent "(matériel supprimé)" / "(emplacement supprimé)" à la place des identifiants bruts.

---

## Règles métier

- L'accès au frontoffice est entièrement **public** : aucune authentification requise, incluant la page `/controles`.
- Chaque matériel reçoit exactement **une** décision (Présent, Anomalie, ou Absent) avant de passer au suivant. Pas de saut possible.
- **Absent** (swipe bas) : raccourci pour enregistrer une anomalie avec commentaire "Absent" sans ouvrir de popup, sans validation de date. Réservé au cas où le matériel est physiquement manquant.
- Un commentaire est **obligatoire** en cas d'Anomalie.
- La date de péremption est **facultative** pour les matériels `hasExpiry: true, isCritical: false`.
- La date de péremption est **obligatoire** pour tout matériel `hasExpiry: true, isCritical: true` **marqué Présent**. Elle n'est pas requise pour les décisions Anomalie ou Absent.
- La mention "(facultatif)" ou "(obligatoire)" est affichée à côté du label date selon `isCritical`.
- Le nom du vérificateur est **obligatoire** à la soumission.
- Le contrôle n'est écrit en Firestore **qu'à la soumission finale** : aucune écriture partielle.
- Chaque soumission crée **un document `controles` distinct** ; plusieurs contrôles du même inventaire sont possibles.
- La date/heure de soumission est horodatée côté serveur (`serverTimestamp`).
- Le mail de synthèse est envoyé **après** l'écriture Firestore réussie. Un échec d'envoi mail ne bloque pas la confirmation (loggué côté serveur).
- Les emplacements sont parcourus dans l'ordre de leur champ `order` (croissant). Les matériels idem.

---

## Composants UI

| Composant | Fichier | Description |
|-----------|---------|-------------|
| `WelcomeScreen` | `features/validator/ui/WelcomeScreen.tsx` | Écran d'accueil : nom, stats, SwipeTutorial, lien contrôles, bouton Commencer |
| `SwipeTutorial` | `features/validator/ui/SwipeTutorial.tsx` | 3 illustrations SVG statiques des gestes de swipe |
| `CompartmentCard` | `features/validator/ui/CompartmentCard.tsx` | Carte d'emplacement avant d'y entrer |
| `CompartmentHeader` | `features/validator/ui/CompartmentHeader.tsx` | Nom de l'emplacement courant + progression globale |
| `ItemCard` | `features/validator/ui/ItemCard.tsx` | Photo, nom, date péremption (`type="month"`), boutons décision, gestion swipe |
| `DecisionButtons` | `features/validator/ui/DecisionButtons.tsx` | Boutons Présent / Anomalie |
| `AnomalyModal` | `features/validator/ui/AnomalyModal.tsx` | Popup commentaire obligatoire |
| `SummaryScreen` | `features/validator/ui/SummaryScreen.tsx` | Récapitulatif par emplacement, champ nom, bouton Soumettre |
| `ConfirmationScreen` | `features/validator/ui/ConfirmationScreen.tsx` | Écran terminal post-soumission |
| `ErrorScreen` | `features/validator/ui/ErrorScreen.tsx` | Erreur générique (inventaire introuvable, Firestore, etc.) |
| `RecentControlsPage` | `features/validator/ui/RecentControlsPage.tsx` | Page /controles : titre, lien retour, liste ou état vide |
| `ControlsAccordion` | `features/validator/ui/ControlsAccordion.tsx` | Accordion des contrôles récents : 1 ouvert à la fois, anomalies + péremptions |

---

## Use cases

```ts
// Charge l'inventaire, ses emplacements triés, et les dernières dates de péremption connues
loadInventoryUseCase(inventoryId: string): Promise<Result<{
  inventory: Inventory
  compartments: CompartmentWithItems[]
  lastExpiryDates: Record<string, string>
}>>

// Retourne les 10 contrôles les plus récents d'un inventaire (page publique /controles)
listRecentControlsUseCase(inventoryId: string): Promise<Result<PublicControlSummary[]>>

// Persiste le contrôle complet et déclenche le mail de synthèse
submitControlUseCase(
  submission: ControlSubmission,
  emailContext: ControlEmailContext,
): Promise<Result<{ controlId: string }>>
```

**Types :**

```ts
type Inventory = {
  id: string
  name: string
  associationId: string
}

type CompartmentWithItems = {
  id: string
  name: string
  order: number
  items: Item[]
}

type Item = {
  id: string
  name: string
  photoUrl: string    // '' si absente
  hasExpiry: boolean
  isCritical: boolean
  order: number
}

type ControlSubmission = {
  inventoryId: string
  verifierName: string
  results: ItemResult[]
}

type ItemResult = {
  itemId: string
  compartmentId: string
  status: 'present' | 'anomaly'
  comment?: string      // obligatoire si status === 'anomaly'
  expiryDate?: string   // format stocké : "YYYY-MM-01"
}

type PublicControlSummary = {
  id: string
  verifierName: string
  submittedAt: string   // ISO string (sérialisable server→client)
  anomalyCount: number  // dérivé de anomalies.length
  anomalies: { itemName: string; compartmentName: string; comment: string }[]
  expiryDates: { itemName: string; compartmentName: string; date: string }[]
}
```

---

## Données

**Collections Firestore impliquées**

- `inventaires` — `name`, `associationId`
- `emplacements` — `inventoryId`, `name`, `order`
- `materiels` — `compartmentId`, `name`, `photoUrl`, `hasExpiry`, `isCritical`, `order`
- `controles` — un document par contrôle soumis

**Structure d'un document `controles`**

```
controles/{controleId}
  inventoryId:   string
  associationId: string
  verifierName:  string
  submittedAt:   Timestamp   // serverTimestamp
  results: [
    {
      itemId:        string
      compartmentId: string
      status:        'present' | 'anomaly'
      comment:       string | null
      expiryDate:    string | null    // "YYYY-MM-01"
    }
  ]
```

**Index Firestore requis**

```
controles : inventoryId ASC + submittedAt DESC
```
Utilisé par `listRecentControlsUseCase` (limit 10) et `loadLastExpiryDates` (limit 3).

---

## Notifications mail

**Mail de synthèse**
- **Déclencheur** : soumission réussie d'un contrôle.
- **Destinataires** : adresses email configurées sur le compte admin de l'association.
- **Contenu** : nom de l'inventaire, vérificateur, date/heure, nombre de matériels, liste des anomalies par emplacement (nom + commentaire), liste des dates de péremption saisies.
- **Envoi** : via Resend, template react-email.
- **Échec d'envoi** : le contrôle est considéré soumis ; erreur loguée côté serveur uniquement.

---

## Hors scope

- Modification ou suppression d'un contrôle déjà soumis.
- Authentification du vérificateur.
- Reprise d'un contrôle interrompu (pas de persistance partielle).
- Génération des QR codes (feature backoffice distincte — voir `specs/qrcode.md`).
- Alertes de péremption imminente (feature distincte — voir `specs/config-alertes-peremption.md`).
- Pagination de l'historique des contrôles (liste fixe à 10).
- Accès au détail complet d'un contrôle depuis le frontoffice.
- Filtrage ou recherche dans l'historique.
- Animation du tuto swipe (illustrations statiques uniquement).
