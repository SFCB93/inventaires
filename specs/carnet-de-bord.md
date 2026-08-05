# Spec — Carnet de bord véhicule

## Objectif
Permettre à un conducteur qui scanne le QR code d'un véhicule (un inventaire équipé d'une carte IoT) d'accéder à un menu d'actions au-delà du simple contrôle d'inventaire : suivi kilométrique, plein de carburant, signalement d'avarie, maintenance, désinfection — avec un historique consultable côté backoffice sur la page détail du véhicule.

## Utilisateurs concernés
- [x] Secouriste (frontoffice, non authentifié)
- [x] Responsable / Admin (backoffice, authentifié) — consultation de l'historique uniquement

## Parcours principal
1. Un conducteur scanne le QR code d'un inventaire. Si cet inventaire n'a **pas** de device IoT associé, rien ne change : contrôle séquentiel direct, comportement actuel inchangé.
2. Si l'inventaire a un device IoT associé (= c'est un véhicule), il arrive sur un menu proposant : Inventaire, Kilométrage, Carburant, Avarie, Maintenance, Désinfection.
3. Il saisit son nom une fois pour cette visite — prérempli si déjà renseigné sur cet appareil lors d'une visite précédente (n'importe quel véhicule, n'importe quel écran du frontoffice). Le champ reste visible et modifiable.
4. Il choisit une action :
   - **Inventaire** → parcours de contrôle existant, inchangé ; le nom déjà saisi préremplit le champ vérificateur en fin de contrôle.
   - **Kilométrage** → consulte l'historique des relevés précédents (information non sensible, visible sans authentification), saisit le kilométrage et la mission, valide.
   - **Carburant** → saisit la quantité (litres) et, facultativement, le montant payé (€), joint éventuellement une facture/photo, valide → un mail est envoyé aux adresses de notification de l'association.
   - **Avarie** → décrit le problème, valide → un mail est envoyé aux adresses de notification de l'association.
   - **Maintenance** → décrit l'intervention, joint éventuellement un document, valide.
   - **Désinfection** → choisit un protocole (périodique ou approfondie), consulte la checklist d'aide correspondante (purement indicative), valide → un mail est envoyé aux adresses de notification de l'association.
5. Après validation d'une action (hors Inventaire), une confirmation s'affiche avec un retour au menu pour enchaîner une autre action si besoin.
6. Un responsable consulte l'historique de toutes ces entrées (tous types confondus, triées chronologiquement) sur la page détail du véhicule (`/dashboard/vehicules/[id]`), à côté de l'historique de positions déjà existant.

## Parcours alternatifs et edge cases
- Inventaire sans device associé → comportement inchangé, pas de menu, contrôle direct (rétrocompatible avec tous les QR codes déjà imprimés).
- Nom non renseigné → chaque action requiert un nom non vide avant validation (même règle que le contrôle actuel).
- Upload de document en erreur (réseau, taille) → l'action reste bloquée avec une erreur affichée. Le document restant optionnel, l'action peut aussi être validée sans aucun fichier.
- Mail d'avarie qui échoue à l'envoi → l'entrée est tout de même enregistrée (la base est la source de vérité) ; l'échec mail est non-bloquant, comme les autres emails du projet.
- Device révoqué juste après le scan mais avant la validation d'une action → sans impact : le menu s'affiche selon l'état constaté au chargement de la page, l'action se rattache à l'inventaire (pas à la clé API). Le prochain scan repassera en mode contrôle direct si le device reste révoqué.
- Retour en arrière depuis une action vers le menu sans valider → aucune donnée n'est enregistrée, pas de brouillon persistant.

## Règles métier
- Un inventaire est considéré comme un "véhicule" si et seulement si un device IoT lui est associé (`vehicleDevices/{inventoryId}` existe) — aucun nouveau champ sur `Inventory`, cohérent avec la décision prise pour le suivi IoT.
- Le menu du carnet de bord n'apparaît que pour les véhicules ; les autres inventaires (armoires, sacs) gardent le parcours de contrôle direct actuel, sans aucune modification visible.
- Chaque entrée du carnet de bord (kilométrage, carburant, avarie, maintenance, désinfection) est horodatée, rattachée à l'inventaire et à l'association, et porte le nom de la personne qui l'a soumise.
- Le nom saisi est mémorisé côté navigateur (une seule clé de stockage partagée) et préremplit automatiquement tous les champs "nom" du frontoffice où il est demandé : menu du carnet de bord, fin de contrôle (vérificateur), résolution d'anomalie/péremption (correcteur — mécanisme déjà en place aujourd'hui pour ce dernier cas, à généraliser sur la même clé pour couvrir les trois). Le champ reste toujours visible et modifiable, ce n'est qu'un prérempli.
- "Avarie", "Carburant" et "Désinfection" déclenchent chacune un mail vers les adresses de notification de l'association (même mécanisme que les alertes existantes) ; l'entrée est enregistrée même si l'envoi du mail échoue. "Kilométrage" et "Maintenance" n'envoient aucun mail.
- La désinfection propose deux protocoles distincts, basés sur la fiche technique PSE 04FT05 (« Nettoyage et désinfection d'un véhicule ou d'un local ») : **périodique** (entretien courant : cellule sanitaire + cabine de conduite) et **approfondie** (idem, en sortant tout le matériel de la cellule, plafond → parois → placards/tiroirs → sol, matériel désinfecté séparément). Chacun a sa propre checklist d'étapes affichée au moment de la saisie, purement indicative (aucune case à cocher obligatoire pour valider). Le log applicatif (nom, date/heure, protocole) remplace le cahier de traçabilité papier mentionné dans la fiche.
- L'historique des relevés de kilométrage est visible depuis le frontoffice public au moment de la saisie (pas de donnée sensible), pour donner au conducteur le dernier kilométrage connu sans avoir à le chercher ailleurs.
- Les documents joints (carburant, maintenance) sont optionnels. Le endpoint d'upload actuel (`/api/upload`) exige une session backoffice authentifiée et n'est donc pas utilisable depuis le frontoffice public — un mécanisme d'upload public dédié est nécessaire pour ces deux actions.
- Vérification d'appartenance : la lecture de l'historique côté backoffice vérifie que l'inventaire appartient à l'association de l'utilisateur connecté (même pattern que le reste du dashboard).

## Composants UI à créer
- `VehicleHubMenu` — menu affiché à la place du contrôle direct pour un véhicule : nom (prérempli) + 6 boutons (Inventaire, Kilométrage, Carburant, Avarie, Maintenance, Désinfection).
- `MileageLogForm` — historique des relevés précédents + kilométrage + mission.
- `FuelLogForm` — quantité en litres + montant payé (€, facultatif) + upload optionnel.
- `AnomalyReportForm` — description de l'avarie.
- `MaintenanceLogForm` — description + upload optionnel.
- `DisinfectionLogForm` — choix du protocole (périodique / approfondie) puis checklist indicative correspondante (cf. Données pour le contenu).
- `LogbookActionConfirmation` — écran de confirmation générique après validation, avec retour au menu.
- `VehicleLogbookHistory` — section historique sur la page détail du véhicule (liste chronologique, tous types confondus, libellé/icône selon le type).

## Use cases à implémenter
- `isVehicleUseCase(inventoryId)` → `Result<boolean>` — vérifie si l'inventaire a un device associé, pour la page frontoffice.
- `listMileageHistoryUseCase(inventoryId)` → `Result<MileageEntry[]>` — public, pour l'affichage dans `MileageLogForm`.
- `logMileageUseCase(input)` → `Result<undefined>`
- `logFuelUseCase(input)` → `Result<undefined>`
- `reportAnomalyUseCase(input)` → `Result<undefined>` — enregistre l'entrée et déclenche le mail.
- `logMaintenanceUseCase(input)` → `Result<undefined>`
- `logDisinfectionUseCase(input)` → `Result<undefined>`
- `getLogbookHistoryUseCase(inventoryId, associationId)` → `Result<LogbookEntry[]>` — pour la page détail véhicule côté backoffice.

## Données
- Nouvelle collection `logbookEntries` : `associationId`, `inventoryId`, `type` (`mileage` | `fuel` | `anomaly` | `maintenance` | `disinfection`), `submittedBy` (nom), `submittedAt`, et les champs spécifiques au type (kilométrage, mission, quantité de carburant, montant payé en € — facultatif, URL du document, description).
- Aucune modification du modèle `Inventory` ni des collections `vehicleDevices` / `vehicleStatuses` déjà en place.

## Contenu des checklists de désinfection
Contenu statique de l'application (pas de donnée Firestore), extrait de la fiche technique PSE 04FT05 (09-2014). Purement indicatif, aucune case à cocher n'est obligatoire pour valider.

Chaque checklist se présente en deux blocs distincts et non liés entre eux : la conduite à tenir (étapes séquentielles) dans un encart, et le rappel de la technique des 2 seaux dans un second encart séparé (référencée depuis les étapes mais pas détaillée à l'intérieur, pour ne pas alourdir la séquence).

**Désinfection périodique — conduite à tenir**
- Avant de commencer : aérer le véhicule (portes ouvertes) ; se laver les mains ; mettre des gants à usage unique non stériles et des lunettes de protection ; dépoussiérer et nettoyer le sol et l'intérieur du véhicule.
- Cellule sanitaire : ôter le matériel encombrant les surfaces ; nettoyer et désinfecter toutes les surfaces sauf le sol (lingette à usage unique, technique des 2 seaux — voir encart) ; laisser sécher sans rincer ; réintégrer le matériel nettoyé et désinfecté ; nettoyer et désinfecter le sol en terminant par lui (technique des 2 seaux + balai à franges — voir encart) ; laisser sécher avant de pénétrer dans la cellule.
- Cabine de conduite : nettoyer au pulvérisateur le tableau de bord, le volant, le levier de vitesse, les manettes, le frein à main, les poignées de portes, les appareils de communication ; étaler avec une lavette à usage unique, laisser sécher, ne pas rincer ; laver le sol de l'intérieur vers l'extérieur.
- Pour terminer : jeter le matériel à usage unique et les gants dans le sac DASRI (jaune) ; se laver les mains.

**Désinfection périodique — encart technique des 2 seaux**
1. Préparer le seau rouge (lavage) avec la solution détergente-désinfectante diluée selon les indications du fournisseur.
2. Remplir le seau bleu (rinçage) avec de l'eau claire.
3. Tremper la frange dans le seau rouge.
4. Laver le sol en partant du fond vers l'extérieur, en faisant des « S ».
5. Essorer la frange dans le seau bleu.
6. Répéter (tremper rouge → laver → essorer bleu) autant que nécessaire.
7. Changer l'eau du seau bleu dès qu'elle devient trouble.
8. À la fin : vider et rincer les deux seaux, laver la frange (en machine si besoin, séparément du linge) et laisser sécher le tout.

**Désinfection approfondie — conduite à tenir**
- Avant de commencer : aérer le véhicule (portes ouvertes) ; se laver les mains ; mettre des gants à usage unique non stériles et des lunettes de protection ; dépoussiérer et nettoyer le sol et l'intérieur du véhicule.
- Cellule sanitaire : sortir tout le matériel de la cellule et le déposer sur un plan de travail réservé au matériel non désinfecté ; nettoyer et désinfecter toutes les surfaces sauf le sol, en commençant par le plafond puis les parois, sans oublier les tiroirs et l'intérieur des placards, en insistant sur le support de brancard (technique des 2 seaux — voir encart) ; laisser sécher sans rincer ; nettoyer et désinfecter le matériel sorti de la cellule ; réintégrer l'ensemble du matériel nettoyé et désinfecté en vérifiant son état de fonctionnement ; nettoyer et désinfecter le sol en terminant par lui (technique des 2 seaux + balai à franges — voir encart) ; laisser sécher avant de pénétrer dans la cellule.
- Cabine de conduite : nettoyer au pulvérisateur le tableau de bord, le volant, le levier de vitesse, les manettes, le frein à main, les poignées de portes, les appareils de communication ; étaler avec une lavette à usage unique, laisser sécher, ne pas rincer ; laver le sol de l'intérieur vers l'extérieur.
- Pour terminer : jeter le matériel à usage unique et les gants dans le sac DASRI (jaune) ; se laver les mains.

**Désinfection approfondie — encart technique des 2 seaux**
1. Préparer le seau rouge (lavage) avec la solution détergente-désinfectante diluée selon les indications du fournisseur.
2. Remplir le seau bleu (rinçage) avec de l'eau claire.
3. Tremper la frange dans le seau rouge.
4. Laver le sol en partant du fond vers l'extérieur, en faisant des « S ».
5. Essorer la frange dans le seau bleu.
6. Répéter (tremper rouge → laver → essorer bleu) autant que nécessaire.
7. Changer l'eau du seau bleu dès qu'elle devient trouble.
8. À la fin : vider et rincer les deux seaux, laver la frange (en machine si besoin, séparément du linge) et laisser sécher le tout.

## Notifications mail
- "Avarie signalée" : mail immédiat aux adresses de notification de l'association, contenant la description et le nom du déclarant.
- "Plein effectué" : mail immédiat aux adresses de notification, contenant la quantité, le montant payé (si renseigné), le nom du déclarant et un lien vers le document si joint.
- "Désinfection effectuée" : mail immédiat aux adresses de notification, contenant le protocole réalisé (périodique/approfondie) et le nom du déclarant.
- Aucune notification pour "Kilométrage" et "Maintenance".

## Hors scope
- Édition ou suppression d'une entrée du carnet de bord après soumission (frontoffice comme backoffice) — non demandé.
- Alerte automatique liée à la maintenance (ex : "prochaine vidange dans X km") — nécessiterait un seuil configurable, non demandé.
- Export ou filtrage avancé de l'historique (par type, par date, sélecteur d'échelle de temps) — liste chronologique simple suffisante pour cette feature.
- Validation ou contrainte sur le kilométrage saisi (ex : doit être supérieur au précédent relevé) — non demandé, saisie libre.
- Plusieurs conducteurs/noms différents pour une même visite sans revenir au menu — un seul nom actif par visite, modifiable en revenant au menu.
- Le "protocole simplifié" de la fiche 04FT05 (entre deux victimes/transports) n'est pas proposé dans le carnet de bord — seuls périodique et approfondie sont demandés pour cette feature.
