# Spec — Validateur d'inventaire (frontoffice)

## Objectif

Permettre à un secouriste de contrôler le contenu d'un inventaire (véhicule, armoire, sac…) emplacement par emplacement, matériel par matériel, depuis son téléphone, en scannant un QR code, sans compte requis.

## Utilisateurs concernés

- [x] Secouriste (frontoffice, non authentifié)
- [ ] Responsable / Admin (backoffice, authentifié)

---

## Parcours principal

1. Le secouriste scanne le QR code collé sur l'inventaire → son téléphone ouvre `/inventaire/[inventaireId]`.
2. L'écran d'accueil affiche le nom de l'inventaire, le nombre d'emplacements et le nombre total de matériels, avec un bouton **Commencer le contrôle**.
3. Avant chaque emplacement, une **carte d'emplacement** s'affiche avec le nom du compartiment. Le secouriste swipe dans n'importe quelle direction (ou tape) pour entrer dans l'emplacement.
4. Pour chaque matériel de l'emplacement (trié par `order`) :
   - La photo du matériel (si renseignée)
   - Son nom
   - Un champ date de péremption **uniquement si `hasExpiry: true`**, clairement labellisé "(facultatif)" ou "(obligatoire)" selon `isCritical`
5. Le secouriste peut renseigner la date de péremption avant sa décision.
6. Le secouriste appuie sur **✓ Présent** ou **⚠ Anomalie** (ou swipe gauche/droite), ou swipe **vers le bas** pour signaler que le matériel est **Absent**.
7. Si **Anomalie** → une popup s'ouvre, le commentaire est obligatoire avant de continuer.
8. Si **Absent** (swipe bas) → enregistré directement comme anomalie avec commentaire "Absent", sans popup.
9. Si le matériel est `hasExpiry: true` et `isCritical: true` et que la date n'est pas renseignée → impossible de valider comme **Présent** uniquement. Les décisions Anomalie et Absent ne sont pas bloquées.
10. L'écran avance automatiquement au matériel suivant dans le même emplacement.
11. Quand tous les matériels d'un emplacement sont traités → carte d'emplacement du suivant (trié par `order`).
10. Après le dernier matériel du dernier emplacement → écran récapitulatif groupé par emplacement : statut de chaque matériel, anomalies mises en avant.
11. Le secouriste saisit son **nom** (champ obligatoire) puis appuie sur **Soumettre le contrôle**.
12. Écran de confirmation terminal : "Contrôle enregistré. Merci !" avec la date et l'heure.
13. Un mail de synthèse est envoyé aux adresses configurées sur le compte admin de l'association.

---

## Pré-remplissage de la date de péremption

Pour les matériels `hasExpiry: true, isCritical: false` (périssables non critiques), le champ
date de péremption est pré-rempli avec la **dernière date connue** issue des contrôles précédents,
si elle existe.

**Règles :**
- Uniquement pour `hasExpiry: true, isCritical: false`. Les matériels critiques ne sont jamais pré-remplis : la date doit être re-saisie à chaque contrôle pour garantir sa fraîcheur.
- La date pré-remplie est modifiable librement par le secouriste.
- Si aucun contrôle précédent n'a enregistré de date pour ce matériel → champ vide (comportement actuel).

**Source de données :**
Les 3 contrôles les plus récents de l'inventaire sont chargés au démarrage. On construit une map
`itemId → dernière expiryDate connue` (premier contrôle trouvé avec une date pour cet item).

---

## Parcours alternatifs et edge cases

- Si `inventaireId` inconnu ou supprimé → page d'erreur explicite : "Cet inventaire n'existe pas ou a été supprimé."
- Si l'inventaire ne contient aucun emplacement, ou que tous ses emplacements sont vides → page d'erreur : "Cet inventaire ne contient aucun matériel à contrôler."
- Si un emplacement ne contient aucun matériel → il est silencieusement ignoré (non affiché).
- Si le secouriste ferme l'onglet ou perd la connexion en cours de route → à la réouverture de la même URL, le contrôle repart de zéro. Aucune persistance partielle.
- Si la soumission échoue (réseau coupé, erreur Firestore) → message d'erreur non bloquant, bouton **Réessayer** visible. Les réponses saisies sont conservées en mémoire (Zustand) pour permettre le retry.
- Si le matériel est `isCritical` et la date de péremption est vide au moment de valider **Présent** → le champ passe en erreur, la décision Présent est bloquée jusqu'à saisie. Les décisions Anomalie et Absent ne sont pas bloquées.
- Si le commentaire d'anomalie est vide → impossible de fermer la popup, message de validation affiché.
- Si le champ nom du vérificateur est vide à la soumission → impossible de soumettre, message de validation affiché.
- Après soumission réussie → la page de confirmation est terminale : pas de possibilité de modifier ou de resoumettre depuis cette session.
- Si le chargement des dates précédentes échoue → le contrôle démarre normalement avec les champs vides (dégradé silencieux, non bloquant).

---

## Règles métier

- L'accès au frontoffice est entièrement **public** : aucune authentification requise.
- Chaque matériel reçoit exactement **une** décision (Présent, Anomalie, ou Absent) avant de passer au suivant. Pas de saut possible.
- **Absent** (swipe bas) : raccourci pour enregistrer une anomalie avec commentaire "Absent" sans ouvrir de popup. Réservé au cas où le matériel est complètement manquant (pas une anomalie partielle).
- Un commentaire est **obligatoire** en cas d'Anomalie.
- Le champ date de péremption est affiché **uniquement pour les matériels `hasExpiry: true`** (matériels périssables). Les matériels non périssables (lampe torche, ciseaux…) n'ont pas de champ date.
- La date de péremption est **facultative** pour les matériels `hasExpiry: true, isCritical: false`.
- La date de péremption est **obligatoire** pour tout matériel `hasExpiry: true, isCritical: true` **marqué Présent**. Elle n'est pas requise pour les décisions Anomalie ou Absent (matériel non accessible ou manquant).
- La mention "(facultatif)" ou "(obligatoire)" est affichée à côté du label date selon `isCritical`.
- Le format de date attendu est **JJ/MM/AAAA** (ou via date picker natif du navigateur).
- Le nom du vérificateur est **obligatoire** à la soumission.
- Le contrôle n'est écrit en Firestore **qu'à la soumission finale** : aucune écriture partielle pendant la saisie.
- Chaque soumission crée **un document `controle` distinct** ; plusieurs contrôles du même inventaire sont possibles (historique conservé).
- La date/heure de soumission est horodatée côté serveur (`serverTimestamp`), pas côté client.
- Le mail de synthèse est envoyé **après** l'écriture Firestore réussie. Un échec d'envoi mail ne bloque pas la confirmation à l'utilisateur (loggué côté serveur).
- Les emplacements sont parcourus dans l'ordre de leur champ `order` (croissant). Les matériels dans un emplacement sont parcourus dans l'ordre de leur propre champ `order`.

---

## Composants UI à créer

- `EcranAccueil` — nom de l'inventaire, nombre d'emplacements et de matériels, bouton de démarrage
- `CarteEmplacement` — affiche le nom de l'emplacement avant d'y entrer ; swipe ou tap dans n'importe quelle direction pour continuer ; bouton Précédent si applicable
- `EnTeteEmplacement` — affiche le nom de l'emplacement courant et la progression globale
- `CarteMateriel` — affiche photo, nom, champ date de péremption (toujours visible) et boutons de décision ; gère le swipe gauche (Présent), droite (Anomalie), bas (Absent)
- `BoutonsDecision` — deux boutons larges (Présent / Anomalie)
- `ModalAnomalie` — popup avec textarea de commentaire ; bloque la fermeture si vide
- `BarreProgression` — indicateur "matériel X sur N (emplacement Y sur Z)"
- `EcranRecapitulatif` — résultats groupés par emplacement, anomalies mises en avant, champ nom du vérificateur, bouton Soumettre
- `EcranConfirmation` — écran terminal après soumission réussie
- `EcranErreur` — erreur générique : inventaire introuvable, inventaire vide, ou erreur critique de soumission

---

## Use cases à implémenter

- `chargerInventaire(inventaireId: string)` → `Result<{ inventaire: Inventaire; emplacements: EmplacementAvecMateriels[]; lastExpiryDates: Record<string, string> }>` — charge l'inventaire, ses emplacements et leurs matériels (triés par `order`), et les dernières dates de péremption connues par `itemId`
- `soumettreControle(input: SoumissionControle)` → `Result<{ controleId: string }>` — persiste le contrôle complet et déclenche le mail

```ts
type Inventaire = {
  id: string
  nom: string
  associationId: string
}

type EmplacementAvecMateriels = {
  id: string
  nom: string
  order: number
  materiels: Materiel[]
}

type Materiel = {
  id: string
  nom: string
  photoUrl: string   // '' si absente — le bloc photo n'est pas affiché
  hasExpiry: boolean // true = matériel périssable → champ date affiché
  isCritical: boolean // true = date obligatoire (implique hasExpiry: true)
  order: number
}

type SoumissionControle = {
  inventaireId: string
  nomVerificateur: string
  resultats: ResultatMateriel[]
}

type ResultatMateriel = {
  materielId: string
  emplacementId: string
  statut: 'present' | 'anomalie'
  commentaire?: string       // obligatoire si anomalie
  datePeremption?: string    // obligatoire si isCritical + Présent, facultatif sinon
}
```

---

## Données

**Collections Firestore impliquées**

- `inventaires` — un document par inventaire (véhicule, armoire, sac…) ; champs : `nom`, `associationId`
- `emplacements` — un document par emplacement ; champs : `inventaireId`, `nom`, `order: number`
- `materiels` — un document par matériel ; champs : `emplacementId`, `nom`, `photoUrl`, `isCritical: boolean`, `order: number`
- `controles` — nouvelle collection, un document par contrôle soumis

**Structure d'un document `controles`**

```
controles/{controleId}
  inventoryId: string
  associationId: string
  verifierName: string
  submittedAt: Timestamp          // serverTimestamp
  results: [
    {
      itemId: string
      compartmentId: string
      status: 'present' | 'anomaly'
      comment: string | null
      expiryDate: string | null
    }
  ]
```

---

## Notifications mail

**Mail de synthèse (cette feature)**
- **Déclencheur** : soumission réussie d'un contrôle
- **Destinataires** : adresses email configurées sur le compte admin de l'association à laquelle appartient l'inventaire
- **Contenu** :
  - Nom de l'inventaire, nom du vérificateur
  - Date et heure du contrôle
  - Nombre de matériels vérifiés, nombre d'anomalies
  - Liste des anomalies groupées par emplacement (nom du matériel + commentaire)
  - Liste des dates de péremption saisies, groupées par emplacement
- **Envoi** : via Resend, template react-email, depuis une route API Next.js (`/api/controle/notification`)
- **Échec d'envoi** : le contrôle est considéré comme soumis ; erreur loguée côté serveur, non remontée à l'utilisateur

**Mail d'alerte péremption (feature future — hors scope)**
- Les `datePeremption` collectées lors des contrôles seront la source de données pour des alertes mail envoyées aux admins lorsqu'une péremption est imminente.
- Le déclencheur, la fréquence et le seuil d'alerte (ex. : J-30) sont à définir dans une spec dédiée.

---

## Hors scope

- Modification ou suppression d'un contrôle déjà soumis
- Authentification du vérificateur (frontoffice entièrement public)
- Reprise d'un contrôle interrompu (pas de persistance partielle)
- Génération des QR codes (feature backoffice distincte)
- Alertes de péremption imminente (feature distincte — voir section Notifications ci-dessus)
- Gestion des adresses mail destinataires (feature backoffice — paramètres du compte admin)
- Affichage de l'historique des contrôles au vérificateur
- Gestion de l'ordre des emplacements (drag & drop, feature backoffice distincte)
