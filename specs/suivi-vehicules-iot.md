# Spec — Suivi véhicules via carte IoT

## Objectif
Suivre en temps réel l'état (position GPS, coupe-circuit batterie) de chaque véhicule équipé d'une carte IoT, et permettre aux responsables de consulter l'historique de ses déplacements.

## Utilisateurs concernés
- [ ] Secouriste (frontoffice, non authentifié)
- [x] Responsable / Admin (backoffice, authentifié)

Acteur technique additionnel : la carte IoT elle-même, qui pousse ses données via un endpoint API dédié (machine-to-machine, aucun utilisateur humain à cette étape).

## Parcours principal
1. Depuis le dashboard "Véhicules", un admin clique sur "Ajouter", choisit un inventaire existant qui n'a pas encore de device associé, et obtient une clé API à flasher sur la carte.
2. La carte envoie régulièrement son état (position GPS, état du coupe-circuit) à un endpoint dédié, authentifiée par sa clé API. Le format exact de la requête HTTP à envoyer est consultable depuis le backoffice (encart "Device IoT" de la page détail d'un véhicule).
3. Le backend met à jour l'état courant du véhicule, et enregistre un nouveau point d'historique si les règles de déduplication le justifient (cf. règles métier).
4. Dans le dashboard, un responsable consulte la liste des véhicules déjà équipés d'un device : nom, état coupe-circuit, position courante, durée de stabilité de cet état, date du dernier ping reçu. Les inventaires sans device associé n'apparaissent pas dans cette liste.
5. En cliquant sur un véhicule, il visualise l'historique de ses positions sur une carte, avec un sélecteur d'échelle de temps.
6. Si un véhicule reste alimenté en continu (coupe-circuit non activé) plus de 4h sans changer de position, un mail d'alerte est envoyé aux adresses de notification de l'association — détecté soit dès le prochain ping reçu, soit au plus tard par le cron quotidien si le device ne réémet pas.

## Parcours alternatifs et edge cases
- Clé API invalide ou révoquée → l'endpoint rejette la requête (401), aucune écriture.
- Payload malformé (coordonnées hors bornes valides, champs manquants) → rejet (400), aucune écriture.
- Device associé à un inventaire supprimé entretemps → rejet, pas de crash silencieux.
- Admin révoque une clé API → la carte associée ne peut plus écrire tant qu'une nouvelle clé n'est pas générée et reflashée.
- Requêtes quasi simultanées du même device (retry réseau côté carte) → pas de contrainte d'idempotence stricte requise, un point GPS dupliqué proche n'a pas d'impact fonctionnel et la déduplication géographique limite déjà la redondance.
- Ping reçu avec un horodatage antérieur au dernier point retenu (livraison hors-ordre) → ignoré silencieusement, aucune écriture.
- Flux de requêtes anormalement élevé sur une clé API → requêtes excédentaires rejetées (limite de débit).
- Véhicule dont le device n'a jamais émis → afficher un état vide explicite plutôt qu'une carte silencieuse.
- Sélecteur d'échelle de temps demandant une période au-delà de la rétention (90 jours) → l'historique affiché s'arrête à la donnée encore disponible, pas d'erreur.
- Tentative d'ajout d'un device alors que tous les inventaires de l'association ont déjà un device associé → message informatif dans la modale d'ajout, pas d'erreur.
- Véhicule qui redémarre à bouger pendant qu'il est alimenté (avant ou après l'envoi de l'alerte) → un nouveau point est retenu, l'épisode "alimenté trop longtemps" repart de zéro (nouveau décompte, nouvelle alerte possible si le seuil est de nouveau dépassé).
- Association sans adresse de notification configurée → l'alerte est calculée mais aucun mail n'est envoyé (comportement identique aux alertes de péremption existantes).

## Règles métier
- Chaque carte IoT est identifiée par une clé API unique, générée et révocable depuis le backoffice, associée à un seul inventaire (véhicule).
- L'identité du véhicule pour une requête entrante est déterminée par la clé API fournie, jamais par un champ du corps de la requête — un device ne peut pas usurper l'identité d'un autre véhicule.
- La fréquence d'envoi côté device (fréquente cellule alimentée, espacée coupe-circuit activé) est définie par le firmware, hors périmètre de cette feature — le backend est agnostique de ce fonctionnement et applique la même règle de déduplication quelle que soit la cadence reçue.
- Chaque ping reçu est comparé au dernier point retenu (position + état coupe-circuit) : si la position n'a pas bougé significativement et que l'état coupe-circuit est identique, le ping est ignoré intégralement (ni mise à jour de l'état courant, ni écriture d'historique). S'il diffère sur l'un des deux critères, l'état courant est mis à jour et un nouveau point d'historique est créé. Le seuil de distance exact est un détail à trancher en phase dev.
- Conséquence de cette règle : l'horodatage du point retenu correspond au moment où le véhicule a atteint sa position/état actuels, pas à la dernière réception d'un ping — le dashboard peut afficher "à la position Y depuis 1h" sans que ce délai ne se réinitialise à chaque ping identique reçu pendant l'immobilisation.
- Indépendamment de la déduplication, un horodatage `lastSeenAt` est mis à jour à chaque ping reçu, y compris ceux ignorés pour la position/historique (simple overwrite sur l'état courant, sans impact sur le volume de données). Il permet de savoir si le device émet toujours, même quand il n'a rien de nouveau à rapporter.
- Un ping dont l'horodatage est antérieur au dernier point retenu est ignoré — protège contre les livraisons hors-ordre ou les retries réseau qui corrompraient l'horodatage "depuis quand" affiché.
- Réassocier un device à un inventaire invalide immédiatement toute clé précédemment active pour cet inventaire : une seule clé valide à la fois par véhicule, ce qui permet une rotation de clé sans use case dédié.
- L'endpoint applique une limite de débit par clé API, pour se prémunir d'un device défaillant ou d'une clé compromise envoyant un flux de requêtes anormal. Le seuil exact est un détail à trancher en phase dev.
- La réponse de l'endpoint ne renvoie aucune information interne (UID, détails sur d'autres véhicules) — conforme aux règles de sécurité déjà appliquées aux autres endpoints du projet.
- Les points d'historique de position sont conservés 90 jours, puis supprimés automatiquement.
- Vérification d'appartenance : toute lecture backoffice de l'état ou de l'historique d'un véhicule vérifie que l'inventaire appartient à l'association de l'utilisateur connecté.
- Aucun champ `type` n'est ajouté à `Inventory` pour cette feature : un device peut être associé à n'importe quel inventaire existant, sans distinction formelle "véhicule".
- Un véhicule alimenté (coupe-circuit non activé) dont la position/état n'a pas changé depuis plus de 4h (seuil fixe) déclenche une alerte mail.
- Deux déclencheurs indépendants vérifient ce seuil, avec le même garde-fou (`poweredAlertSent`) pour ne jamais doubler l'envoi :
  - à chaque ping reçu sans changement (position/état identiques) — détection quasi immédiate tant que le device continue d'émettre ;
  - un cron quotidien — filet de sécurité si le device cesse d'émettre après avoir atteint le seuil (limite du plan Vercel Hobby : un cron ne peut s'exécuter qu'une fois par jour, la détection par cron seul serait donc décalée de plusieurs heures).
- Une seule alerte est envoyée par épisode d'immobilisation alimentée : dès qu'un nouveau point est retenu pour ce véhicule (déplacement ou changement d'état), `poweredAlertSent` est réinitialisé et l'alerte peut de nouveau se déclencher si le seuil est de nouveau dépassé.
- Le mail du cron regroupe tous les véhicules d'une même association en un seul envoi ; le déclenchement par ping envoie un mail par véhicule au moment où il est détecté (pas de groupement possible, la détection est individuelle).

## Composants UI à créer
- `VehicleFleetStatus` — vue d'ensemble backoffice listant uniquement les véhicules ayant déjà un device associé : nom du véhicule, état coupe-circuit, position courante, durée depuis laquelle cet état/position est stable, date du dernier ping (`lastSeenAt`). Bouton "Ajouter" (en-tête et état vide) pour ouvrir `AddVehicleDeviceForm`.
- `AddVehicleDeviceForm` — modale de sélection d'un inventaire parmi ceux sans device associé, puis génération de sa clé API (affichée une fois).
- `VehicleDeviceLinkForm` — encart "Device IoT" de la page détail d'un véhicule ; régénération (rotation en un geste) et révocation de la clé API, plus un accès à `VehicleApiDocModal`.
- `VehicleApiDocModal` — popup documentant le format de la requête HTTP attendue par l'endpoint (méthode, en-têtes, corps JSON, codes de réponse), pour faciliter le paramétrage du firmware.
- `VehiclePositionHistoryMap` — carte affichant l'historique de positions d'un véhicule.
- `TimeRangeSelector` — sélecteur d'échelle de temps pour l'historique affiché.

## Use cases à implémenter
- `linkDeviceUseCase(input)` → `Result<{ inventoryId, apiKey }>`
- `revokeDeviceUseCase(inventoryId)` → `Result<undefined>`
- `receiveVehicleStatusUseCase(input)` → `Result<undefined>` — appelé par l'endpoint, authentifie via la clé, met à jour l'état courant, décide de l'enregistrement d'un point d'historique.
- `getFleetStatusUseCase(associationId)` → `Result<VehicleStatus[]>` — uniquement les inventaires ayant un device associé.
- `listUnlinkedInventoriesUseCase(associationId)` → `Result<UnlinkedInventory[]>` — inventaires de l'association sans device associé, pour la modale d'ajout.
- `getVehiclePositionHistoryUseCase(inventoryId, timeRange)` → `Result<Position[]>`
- `runVehiclePoweredAlertsCronUseCase()` → `Result<{ processed, sent, errors }>` — appelé par un cron, envoie les alertes "véhicule laissé alimenté" par association.

## Données
- Association device ↔ inventaire (clé API, révocation) : rattachée à l'inventaire existant — nom de collection/champs exacts à trancher en dev.
- État courant du véhicule : dernière position (lat/lng), état coupe-circuit, horodatage du dernier point retenu (= depuis quand cet état est stable), `lastSeenAt` (dernier ping reçu, quel qu'il soit), `poweredAlertSent` (indique si l'alerte a déjà été envoyée pour l'épisode d'immobilisation en cours).
- Historique de positions : une entrée par point retenu (position, état coupe-circuit, horodatage), avec une expiration à 90 jours entraînant une suppression automatique.

## Notifications mail
- "Véhicule laissé alimenté" : détecté soit immédiatement à la réception d'un ping sans changement (mail individuel), soit par un cron quotidien de rattrapage (mail groupé par association) — aux adresses de notification déjà configurées (mêmes destinataires que les alertes de péremption). Un seul mail par épisode d'immobilisation, jusqu'à ce que le véhicule bouge ou coupe son circuit.
- Les signalements avarie/maintenance avec envoi de mail relèvent du carnet de bord (feature séparée).

## Hors scope
- Carnet de bord (kilométrage, avaries, maintenance, désinfection, plein) — feature distincte.
- Alertes en cas de déclenchement du coupe-circuit ou de sortie de zone (géofencing) — feature future éventuelle.
- Dégradation de résolution de l'historique au-delà de la rétention (ex : garder 1 point/heure après 30 jours) — non demandé, suppression pure après 90 jours.
- Ajout d'un champ `type` sur `Inventory` — association manuelle suffisante pour cette feature.
- Reverse geocoding (affichage d'une adresse lisible plutôt que lat/lng) — coordonnées brutes suffisantes pour l'instant.
- Alerte ou notification en cas de device silencieux — `lastSeenAt` est capturé, mais aucun seuil ni notification de "device hors ligne" n'est défini dans cette feature.
