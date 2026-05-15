# Changelog

## [1.7.79] - Ajustements fiche d'évangélisation

### Changed
- Suppression de la question « L'âme rejoindra-t-elle une église VH ? » sur le formulaire, la modale d'édition, l'export Excel et le modèle d'import.
- Nouvelles options de **Culte envisagé** : Culte du Mercredi Soir - 19h, 1er Culte du Dimanche - 7h, 2e Culte du Dimanche - 10h, Pas encore décidé. Le parseur d'import accepte les libellés exacts ainsi que des alias courants (mercredi, 1er dimanche / 7h, 2e dimanche / 10h).
- Modèle Excel mis à jour : 13 colonnes (au lieu de 14).

## [1.7.78] - Champs détaillés sur la fiche d'évangélisation

### Added
- Nouveaux champs sur la fiche **Âme évangélisée** : Communauté fréquentée, Décision pour Jésus (Oui / Non / Pas encore), Rejoindra une église VH (Oui / Non), Culte envisagé (Mercredi soir, Vendredi soir, Dimanche matin, Dimanche soir, Pas encore décidé), Sujets de prière, Étudiant ayant conduit l'entretien.
- Formulaire d'ajout, modale d'édition, export Excel et import Excel mis à jour avec ces 6 champs (tous optionnels).
- Modèle Excel téléchargeable enrichi (14 colonnes) avec valeurs acceptées indiquées dans les en-têtes.
- Aperçu en liste : badges « Décision Jésus » et « Culte envisagé » affichés sous le nom dans le tableau.

## [1.7.77] - Dashboards Admin & Berger enrichis

### Added
- **Admin** : nouvel onglet **« Évangélisation »** dans le tableau de bord admin avec 4 KPI (total, importées, en attente, taux de conversion), histogramme 6 mois (évangélisées vs importées), classement des évangélistes (total / importées / taux + barre de progression), et alerte « âmes sans évangéliste ».
- **Berger** : 4ème KPI **Progression spirituelle** (% né de nouveau ou plus).
- **Berger** : nouveau widget **« Progression spirituelle de mes âmes »** — répartition par étape (né de nouveau / baptisé / académie / décidé / non décidé) + répartition par origine (évangélisation vs culte direct).
- **Berger** : tag **« évangélisation »** affiché à côté du nom des âmes provenant de l'évangélisation dans la liste de suivi.

## [1.7.76] - Tableau de bord Évangéliste

### Added
- Nouveau **tableau de bord dédié aux évangélistes** affiché automatiquement à la connexion.
- 4 indicateurs clés : total âmes évangélisées, à suivre, importées au culte, taux de conversion.
- Liste **« Âmes à relancer »** triée par urgence, avec badge couleur (vert / orange / rouge) et bouton « Contacter » qui ouvre le modal d'interaction.
- **Histogramme** d'activité sur les 6 derniers mois (mois courant en vert foncé).
- **Entonnoir de suivi** : importées / contactées à relancer / jamais contactées.
- Lien rapide vers l'import en masse depuis Excel.

## [1.7.75] - Import en masse d'âmes évangélisées depuis Excel

### Added
- Bouton **« Modèle Excel »** dans la page « Âmes évangélisées » : génère un fichier modèle prêt à remplir (instructions, en-têtes, ligne d'exemple).
- Bouton **« Importer Excel »** (Admin & Évangéliste) : sélection d'un fichier `.xlsx`, aperçu des lignes valides, détail des lignes ignorées avec motif, puis import en lots de 500 dans Firestore.
- Validation par ligne : nom obligatoire, genre M/F, lieu d'habitation, date d'évangélisation parseable (formats ISO, FR `JJ/MM/AAAA`, ou numérique Excel).
- Les âmes importées sont automatiquement assignées à l'utilisateur connecté (`evangelistId`).

## [1.7.74] - Import d'âmes par l'évangéliste & assignation

### Added
- Nouveau composant `EvangelistSelect` (sélecteur d'évangéliste actif, basé sur `role` legacy ou `businessProfiles`).
- L'**admin** peut désormais choisir l'**évangéliste responsable** lors de la création d'une âme évangélisée (sinon, l'utilisateur courant est assigné par défaut).
- L'**admin** peut **réassigner** l'évangéliste d'une âme évangélisée existante depuis le modal de modification.
- Champ `evangelistId` ajouté sur l'interface `Soul` et propagé lors de l'import depuis `evangelized_souls` vers `souls` (équivalent fonctionnel à `shepherdId`).

### Changed
- Les **évangélistes** peuvent désormais déclencher l'import d'une âme évangélisée vers la liste principale des âmes (auparavant réservé à l'admin / ADN).
- L'import d'une âme évangélisée conserve `evangelistId` en plus de la traçabilité `importedFromEvangelistId`.

## [1.7.73] - Suivi des âmes évangélisées par les évangélistes

### Added
- Les **évangélistes** disposent désormais des mêmes interactions que les **bergers** sur leurs âmes évangélisées :
  - Bouton **« Contacter »** dans la colonne Actions (ouvre le modal Appel / Visite / Message / SMS).
  - Nouvelle colonne **« Dernier contact »** avec badge coloré (vert / jaune / rouge selon l'ancienneté).
  - Historique des interactions par âme évangélisée.
- Les interactions enregistrées portent maintenant un champ `sourceCollection` (`souls` ou `evangelized_souls`) pour distinguer les sources.

### Changed
- `InteractionForm` / `InteractionModal` acceptent une prop `sourceCollection` (défaut `souls`, rétro-compatible) pour pointer sur la bonne collection lors de l'envoi de SMS et de la lecture du téléphone.
- Le composant `LastContactBadge` a été extrait dans `src/components/interactions/LastContactBadge.tsx` et est partagé entre les pages bergers et évangélistes.

## [1.7.72] - Chargement des âmes évangélisées

### Fixed
- Correction de l'erreur **« Erreur lors du chargement »** sur la page **Âmes évangélisées** : la liste n'utilise plus de tri Firestore nécessitant un index composite, et le tri par création décroissante est maintenant fait côté application.

## [1.7.71] - Connexion robuste en cas de doublon téléphone

### Fixed
- La connexion vérifie désormais tous les profils actifs trouvés pour le même numéro de téléphone (`users` et `admins`) et sélectionne celui dont le mot de passe correspond, au lieu de refuser le login après avoir testé seulement le premier document trouvé. Corrige le cas où un bon mot de passe était saisi mais comparé au mauvais profil.

## [1.7.70] - Reset de mot de passe ciblé sur le bon document

### Fixed
- Le reset de mot de passe pouvait afficher "succès" tout en mettant à jour un autre document Firestore que celui utilisé pour la connexion (cas des utilisateurs sans champ `uid` ou avec un `uid` synthétique). Le service utilise désormais en priorité l'**identifiant exact du document** (`docId`), garantissant que le nouveau mot de passe est immédiatement valide à la connexion.
- Logs de connexion enrichis (identifiant du document, présence et longueur du mot de passe stocké) pour diagnostiquer plus rapidement les cas similaires.

## [1.7.69] - Réinitialisation côté client + filtre de rôles complet

### Fixed
- La réinitialisation du mot de passe ne dépend plus de la Cloud Function Firebase (qui renvoyait `internal`). La mise à jour est faite directement sur le document Firestore de l'utilisateur, donc le nouveau mot de passe est utilisable immédiatement à la prochaine connexion.
- Messages d'erreur explicites en cas d'échec (utilisateur introuvable, mot de passe actuel incorrect, permission refusée, mot de passe trop court).

### Added
- Le filtre **Rôle** de la page **Gestion des Utilisateurs** propose désormais tous les profils métier : Administrateurs, Berger(e)s, ADN, **Responsables de Département**, **Responsables de Famille**, **Évangélistes**. Chaque filtre reconnaît à la fois le champ legacy `role` et les nouveaux `businessProfiles`.

## [1.7.68] - Réinitialisation de mot de passe vraiment fonctionnelle

### Fixed
- La réinitialisation du mot de passe met désormais à jour le mot de passe **réellement utilisé pour la connexion** (champ `password` du document utilisateur), et plus uniquement Firebase Auth. Le nouveau mot de passe défini par l'administrateur depuis la page Utilisateurs est immédiatement utilisable à la prochaine connexion.
- La connexion accepte maintenant le mot de passe personnalisé de chaque utilisateur en plus des mots de passe par défaut historiques (`@123456`).
- Les messages d'erreur de la fonction de réinitialisation sont remontés tels quels dans l'interface (mot de passe trop court, permission refusée, utilisateur introuvable…), au lieu du générique « Erreur lors de la réinitialisation du mot de passe ».

## [1.7.67] - Correctif réinitialisation de mot de passe

### Fixed
- La réinitialisation du mot de passe d'un utilisateur fonctionne désormais pour les administrateurs configurés via le **nouveau système de profils métier** (`businessProfiles`), et plus seulement via l'ancien champ `role`. Corrige l'erreur « Erreur lors de la réinitialisation du mot de passe » rencontrée notamment lors de la gestion des utilisateurs Évangélistes.

## [1.7.66] - Profil Évangéliste & Âmes évangélisées

### Added
- Nouveau **profil métier « Évangéliste »**, attribuable à un utilisateur depuis la modale d'édition (en plus de Berger, ADN, Resp. Famille, etc.). Un même utilisateur peut cumuler ce profil avec d'autres casquettes.
- Nouvelle catégorie d'âme : **« Âme évangélisée »**, stockée dans une **collection séparée** (`evangelized_souls`) — distincte de la liste des âmes ADN (aucun mélange).
- Nouvelle entrée de menu **« Âmes évangélisées »** (`/ames-evangelisees`), visible uniquement par les Évangélistes et les Administrateurs.
- Page complète de gestion des âmes évangélisées : ajout, modification, suppression, recherche, filtres (date d'évangélisation, statut), export Excel.
- Champs spécifiques : **date d'évangélisation**, **lieu d'évangélisation**, notes libres.
- Nouvelle permission `MANAGE_EVANGELIZED_SOULS` (accordée automatiquement aux Admin/Super Admin).

### Behavior
- Un **Évangéliste** ne voit que **ses propres** âmes évangélisées (filtrage Firestore par `evangelistId`).
- Un **Administrateur** voit toutes les âmes évangélisées de tous les évangélistes.
- L'**ADN ne voit pas** les âmes évangélisées : les deux listes sont totalement cloisonnées.


## [1.7.65] - Visibilité unifiée des bergers multi-casquettes

### Fixed
Tous les filtres, sélecteurs et compteurs de bergers de l'application reconnaissent désormais les utilisateurs ayant **plusieurs casquettes** (`businessProfiles`), pas uniquement le champ legacy `role`. Concrètement :

- **Page Utilisateurs** — le filtre **« Berger(e)s »** affiche maintenant tous les bergers, y compris les stagiaires et les bergers ayant aussi un autre profil (Resp. Département, ADN, Resp. Famille, etc.). Les filtres **« Administrateurs »** et **« ADN »** appliquent la même logique étendue.
- **Page Rappels (Berger)** — un berger multi-casquettes voit désormais ses âmes assignées et ses rappels.
- **Page Rappels par berger** (`/shepherd-reminders`) — la liste des bergers à relancer inclut tous les bergers actifs.
- **Carte des âmes** (`SoulMap`) — le sélecteur et la liste des bergers sont complets.
- **Statistiques générales** (Tableau de bord) — le compteur **« Bergers actifs »** prend en compte les multi-casquettes.
- **Gestion des menus utilisateurs** (Paramètres) — la liste des bergers/stagiaires affiche tous les utilisateurs concernés.
- **SMS** — un berger multi-casquettes accède bien à l'onglet « Mes âmes » au lieu d'être renvoyé vers « Test SMS ».
- **Interactions** — un berger multi-casquettes voit ses propres interactions filtrées correctement.
- **Édition d'une âme** — la pré-sélection automatique du berger courant fonctionne pour les multi-casquettes.

### Added
- Nouveau module utilitaire **`src/utils/roleHelpers.ts`** centralisant la détection des rôles (`isShepherdUser`, `isInternUser`, `isADNUser`, `isAdminUser`, `isDepartmentLeaderUser`, `isFamilyLeaderUser`, `hasAnyRole`). À utiliser systématiquement à la place des comparaisons `user.role === '…'`.

### Technical
Les requêtes Firestore qui filtraient sur `where('role', '==', 'shepherd')` ont été remplacées par un chargement de tous les utilisateurs actifs suivi d'un filtrage côté client via `isShepherdUser()`, car Firestore ne permet pas de combiner un filtre sur `role` avec un filtre sur `businessProfiles[].type` en une seule requête.

## [1.7.64] - Corrections du système SMS

### Fixed
- **Critique** : la création d'une âme n'est plus annulée si l'envoi du SMS de bienvenue échoue (erreur réseau, numéro invalide, etc.). L'âme est conservée et un avertissement invite à renvoyer le SMS manuellement depuis la liste.
- L'**indicatif `+225`** est désormais conservé dans la signature automatique des SMS (numéro complet pour le destinataire).

### Added
- **Aperçu en temps réel** du message final tel qu'il sera reçu par le destinataire (avec personnalisation `[nom]` / `[surnom]` et signature automatique) dans : envoi aux âmes assignées, envoi aux âmes indécises, et message individuel.
- Compteur de caractères basé sur la **vraie limite SMS de 160 caractères** (signature incluse), au lieu de l'ancienne limite trompeuse de 125.
- Nouvelle catégorie de modèle SMS **« Bienvenue »** pour les messages d'accueil des nouvelles âmes (à utiliser dans la console Firebase pour reclasser les modèles concernés).

### Changed
- Le formulaire d'ajout d'âme charge désormais les modèles de la catégorie **« Bienvenue »** (au lieu de « Suivi »).
- La modale d'envoi individuel aux âmes indécises charge désormais les modèles de la catégorie **« Suivi »** (au lieu de tous les modèles).
- `SMSService.getTemplates(category?)` accepte un paramètre optionnel pour filtrer par catégorie.

## [1.7.63] - Correction du filtre Berger

### Fixed
- Le **sélecteur** et le **filtre « Berger »** (page Âmes, modale d'édition, assignation par lot) affichent désormais **tous les bergers et stagiaires**, qu'ils soient identifiés par le champ legacy `role` **ou** via le système `businessProfiles`. Les bergers récemment promus via les profils métier ne sont plus invisibles.

## [1.7.62] - Charge par berger améliorée (Responsable de famille)

### Changed
- Bloc **« Répartition des bergers »** enrichi : badge **« Disponible »** vert pour les bergers à 0 âme, et la ligne **« Non assignées »** affiche désormais une **barre ambre proportionnelle** pour visualiser le déséquilibre à corriger.

## [1.7.61] - Recherche d'âmes (Responsable de famille)

### Added
- Nouvelle **barre de recherche** dans la liste des âmes du tableau de bord Responsable de famille : filtre instantané par **nom, surnom ou téléphone**.
- Message dédié quand aucun résultat ne correspond à la recherche.

## [1.7.60] - Sections visuelles renforcées (Responsable de famille)

### Changed
- Les en-têtes des sections **« À assigner »** et **« Assignées »** du tableau de bord Responsable de famille affichent désormais un **point coloré** (ambre pulsé pour les non assignées, vert pour les assignées) avec libellé en majuscules — pour mieux distinguer visuellement les deux groupes.

## [1.7.59] - StatCards uniformes (Responsable de famille)

### Changed
- Les 3 blocs de statistiques du tableau de bord **Responsable de famille** utilisent désormais le composant partagé `StatCard`, alignant le rendu visuel sur le reste de l'application (icônes, tendances, libellés cohérents).

## [1.7.58] - Tableau de bord Berger en temps réel

### Changed
- Le tableau de bord **Berger** se met à jour **en temps réel** : les âmes assignées et les interactions sont synchronisées via `onSnapshot` (Firestore) — plus besoin de recharger la page après une nouvelle interaction.
- Les statistiques (total âmes, interactions, à contacter) et la liste de suivi sont désormais dérivées en mémoire à partir des flux temps réel.

## [1.7.57] - Liste des âmes avec dernier contact (Berger)

### Changed
- La section « Interactions récentes » du tableau de bord **Berger** est remplacée par **« Mes âmes — suivi »** : liste de toutes les âmes triée par urgence (jamais contacté → > 14 j → récents).
- Chaque ligne affiche un **badge coloré** indiquant la dernière interaction (vert ≤ 7 j, jaune ≤ 14 j, rouge > 14 j, gris si jamais).
- Bouton **« Contacter »** sur chaque ligne ouvrant directement la modale d'interaction préremplie avec l'âme.

## [1.7.56] - Seuil « nécessite attention » aligné à 14 jours (Berger)

### Changed
- Le tableau de bord **Berger** considère désormais qu'une âme **nécessite attention** au-delà de **14 jours sans interaction** (au lieu de 5 jours), conformément aux règles métier.

## [1.7.55] - Répartition par famille de service (ADN)

### Added
- Nouveau bloc **« Répartition par famille de service »** sur le tableau de bord ADN, avec barres de progression vertes affichant le nombre et le pourcentage d'âmes par famille.
- Ligne dédiée **« Sans famille »** (couleur ambre) pour identifier les âmes non rattachées.

## [1.7.54] - Filtre par période sur le tableau de bord ADN

### Added
- Nouveau **sélecteur de période** (7 j, 30 j, 3 mois, 1 an, depuis le début) sur le tableau de bord ADN.
- La carte « Nouvelles âmes » se met à jour selon la période sélectionnée et son titre reflète la plage choisie.

## [1.7.53] - Hiérarchie visuelle du tableau de bord ADN

### Changed
- Refonte de la disposition des cartes du **tableau de bord ADN** : une **carte hero** verte met en avant le total des âmes avec les répartitions (assignées, non assignées, indécises) cliquables.
- Les 4 métriques secondaires (nouvelles, indécises, hommes/femmes assignés) sont regroupées sur une grille compacte 2/4 colonnes en dessous.

## [1.7.52] - Tableau de bord ADN en temps réel

### Changed
- Le **tableau de bord ADN** se met désormais à jour **en temps réel** dès qu'une âme est ajoutée, modifiée ou supprimée — plus besoin de recharger la page.
- Remplacement de `getDocs` par `onSnapshot` côté Firestore avec nettoyage propre du listener au démontage.

## [1.7.51] - Slider « À la une » multi-cartes selon l'écran (Replay)

### Changed
- Le carrousel **« À la une »** affiche désormais **1 carte sur mobile, 2 sur tablette, 3 sur desktop** simultanément, au lieu d'une largeur fixe de 320px qui sous-utilisait les grands écrans.
- Le snap horizontal et le swipe tactile restent actifs sur tous les formats.

## [1.7.50] - Sidebar filtres en panneau gauche fixe (Replay desktop XL)

### Added
- Sur très grand écran (≥ 1280px), les **filtres** (recherche, catégorie, orateur) sont désormais affichés dans une **sidebar gauche fixe (224px)** sticky, avec listes verticales cliquables et bouton « Réinitialiser ».
- Sous 1280px, les filtres restent affichés en haut de la liste (chips sur mobile, selects sur tablette/desktop) — aucun changement.
- Nouvelle variante `sidebar` du composant `TeachingFilters` pour réutilisation.

## [1.7.49] - Mini-player et badge « En cours » sur les cartes (Replay)

### Added
- **Overlay play au survol** des cartes d'enseignement (desktop/tablette) : un bouton play apparaît sur la vignette pour suggérer la lecture rapide.
- **Badge « En cours »** affiché en haut à gauche de la vignette pour l'enseignement actuellement chargé dans le lecteur, avec un point vert pulsé.
- Léger zoom de la vignette au survol pour une sensation plus vivante.

## [1.7.48] - Raccourcis clavier sur le lecteur audio

### Added
- Nouveaux **raccourcis clavier** actifs dès qu'un audio est ouvert :
  - `Espace` : Lecture / Pause
  - `←` / `→` : Reculer / Avancer de 10 s
  - `↑` / `↓` : Volume +/− 10 %
  - `N` / `P` : Enseignement suivant / précédent
  - `M` : Couper / rétablir le son
- Désactivés automatiquement quand le focus est sur un champ de saisie (input, textarea, select) pour ne pas perturber la frappe.

## [1.7.47] - Contrôles volume visibles dès la tablette (Lecteur audio)

### Changed
- Le **contrôle de volume** du lecteur audio est désormais visible dès la **tablette** (≥ 768px) au lieu du desktop uniquement (≥ 1024px). La vitesse de lecture l'était déjà.

## [1.7.46] - Side-drawer tablette pour la fiche détail (Replay)

### Added
- Sur tablette (768–1023px), la fiche détail s'ouvre désormais dans un **panneau latéral droit (380px)** glissant depuis le bord — l'espace écran est mieux exploité, la liste reste visible derrière l'overlay.
- En-tête sticky du drawer avec bouton de fermeture et clic sur l'overlay pour fermer.

### Fixed
- Breakpoint mobile resserré à `< 768px` (au lieu de `≤ 768px`) pour une transition propre vers le mode tablette.

## [1.7.45] - Layout deux colonnes desktop sur la page Replay

### Changed
- Sur desktop (≥ 1024px), la **fiche détail** s'affiche désormais dans une colonne droite **fixe (400px) et sticky**, à côté de la liste — fini le scroll vers le haut à chaque sélection.
- État vide : un placeholder « Sélectionnez un enseignement » est affiché tant qu'aucun audio n'est sélectionné, pour clarifier l'usage du panneau.
- Bouton de fermeture (X) en haut à droite de la fiche pour revenir à la vue liste pleine.

## [1.7.44] - Section « Récemment écoutés » sur la page Replay

### Added
- Nouvelle bande horizontale **« Récemment écoutés »** en haut de la page Replay, affichant les **5 derniers enseignements lancés**.
- Persistance locale via `localStorage` (aucune base de données impactée) — synchronisation en temps réel quand un nouvel audio démarre, y compris entre onglets.

## [1.7.43] - Fiche détail en bottom sheet sur mobile (Replay)

### Changed
- Sur la page **Replay**, la fiche détaillée d'un enseignement s'ouvre désormais sous forme de **panneau glissant depuis le bas** (bottom sheet, 85 vh) avec **overlay assombri** et **poignée de glissement**.
- Tap sur l'overlay ou le bouton **« Fermer »** pour revenir à la liste — plus besoin de scroller en haut de page.
- L'espace en bas est ajusté automatiquement quand le lecteur audio est actif.

## [1.7.42] - Slider « À la une » swipable au doigt sur mobile

### Fixed
- Sur la page **Replay**, le carrousel des enseignements à la une est désormais **scrollable horizontalement au doigt** sur mobile (le `overflow-x` était bloqué auparavant). Le snap-mandatory aligne automatiquement la carte la plus proche.
- La barre de défilement native est masquée pour un rendu propre.

## [1.7.41] - Chargement progressif des enseignements sur mobile

### Changed
- Sur la page **Replay**, la pagination Précédent/Suivant est remplacée sur mobile par un bouton **« Charger plus »** affichant le nombre d'enseignements restants (par lots de 8).
- Le compteur se réinitialise automatiquement quand un filtre (recherche, catégorie, orateur) change.
- Sur desktop, la pagination classique reste inchangée.

## [1.7.40] - Filtres en chips scrollables sur mobile (Replay)

### Changed
- Sur la page **Replay**, les filtres **Catégorie** et **Orateur** s'affichent désormais sous forme de **chips horizontalement scrollables** sur mobile (au lieu de menus déroulants empilés), pour gagner de la place verticale et accélérer la sélection.
- Les chips actifs s'affichent en vert primaire (#00665C). Sur desktop, les menus déroulants restent inchangés.

## [1.7.39] - Cartes d'enseignement compactes sur mobile

### Changed
- Sur la page **Replay**, les cartes d'enseignement adoptent un **layout horizontal** sur mobile (vignette 80×80 + texte) → 5–6 enseignements visibles sans scroller (au lieu de 2).
- La **durée** est désormais visible sur mobile.
- Affichage du **nombre d'écoutes** (ex. « 1.2k écoutes ») quand la donnée est disponible.
- Sur desktop, le layout vertical reste inchangé.

## [1.7.38] - Lecteur audio compact/étendu sur mobile

### Changed
- Sur mobile, le lecteur audio (page **Replay**) s'affiche désormais en **mini-barre de 64 px** (pochette, titre, prédicateur, recul −10 s, lecture/pause, fine barre de progression).
- Un **tap** sur la mini-barre déploie un **panneau plein écran** : grande pochette, contrôles complets (précédent / −10 s / play / +10 s / suivant), sélection de **vitesse de lecture (1× → 2×)**, téléchargement, partage, fermeture.
- Le comportement **desktop reste inchangé**.

## [1.7.37] - Doublons et orphelins dans la liste des serviteurs

### Added
- **Bannière d'alerte** (admin) en haut de la liste des serviteurs lorsqu'il existe des enregistrements liés à un département supprimé, avec modal **« Serviteurs orphelins »** permettant de tous les supprimer ou un par un.
- En vue **« Tous les serviteurs »**, les enregistrements partageant le même numéro de téléphone sont **regroupés sur une seule ligne**, avec les départements affichés sous forme de **badges**.
- Le formulaire d'ajout d'un serviteur affiche un **avertissement non bloquant** si le numéro de téléphone est déjà utilisé dans un autre département.

### Fixed
- Les enregistrements orphelins (département supprimé) ne polluent plus la liste principale et ne comptent plus comme des doublons.

## [1.7.36] - Mémorisation des filtres de la liste des âmes

### Added
- Les filtres de la page **Gestion des âmes** (recherche, berger, plage de dates, statut, tri, page) sont maintenant **mémorisés pendant la session** : en quittant puis revenant sur la page, l'utilisateur retrouve exactement la même vue.
- Nouveau bouton **« Réinitialiser les filtres »** affiché à côté de la barre de recherche dès qu'au moins un filtre est actif, pour tout remettre à zéro en un clic.
- Les filtres contextuels venant des widgets (`?filter=...`) restent prioritaires sur l'état mémorisé.

## [1.7.35] - Widget « Actions en attente » sur les dashboards

### Added
- Nouveau widget **« Actions en attente »** affiché en haut de chaque tableau de bord, calculé à la volée :
  - **ADN** : nombre d'âmes actives sans famille de service + âmes indécises à recontacter (chaque ligne cliquable vers la liste filtrée).
  - **Responsable de famille** : nombre d'âmes de la famille sans berger.
  - **Berger** : nombre d'âmes sans interaction depuis plus de 14 jours (lien vers « Mes Âmes Assignées »).
- Si tout est à jour, message positif **« Tout est à jour, beau travail ! »**.
- Nouveau filtre URL `?filter=unassigned_family` sur la page Gestion des Âmes, avec bandeau visible permettant de retirer le filtre.

## [1.7.34] - Fiche récapitulative après ajout d'une âme

### Added
- Après l'enregistrement réussi d'une nouvelle âme, le formulaire est remplacé par une **carte de confirmation** présentant les informations clés (Nom, Surnom, Téléphone, Famille de service, Provenance, statut du SMS de bienvenue).
- Boutons d'enchaînement **« + Enregistrer une autre âme »** et **« Voir la liste »** pour accélérer le travail de l'ADN.
- En cas de crédit SMS insuffisant, l'âme reste enregistrée et le statut « SMS non envoyé » est affiché clairement sur la fiche.

## [1.7.33] - Tri et charge par berger pour le responsable de famille

### Added
- Nouveau bloc **« Répartition des bergers »** sur le dashboard du responsable de famille : nombre d'âmes par berger avec barre de charge proportionnelle et pourcentage. Une ligne « Non assignées » récapitule les âmes en attente.
- Liste des âmes scindée en deux sections : **« À assigner »** (fond orange clair, en haut) et **« Assignées »** (en bas). Tri alphabétique dans chaque groupe.

### Changed
- Les âmes sans berger remontent désormais automatiquement en haut de la liste pour faciliter leur prise en charge.

## [1.7.32] - Statistiques cliquables sur le dashboard ADN

### Added
- Les cartes **« Âmes actives non assignées »**, **« Nouvelles âmes (Mois) »** et **« Âmes indécises »** du tableau de bord ADN sont désormais cliquables et ouvrent directement la liste filtrée correspondante.
- Mention **« Voir la liste → »** sur chaque carte cliquable, avec effet visuel au survol et navigation au clavier (Entrée / Espace).
- Prise en charge des paramètres URL `?filter=unassigned` et `?filter=this_month` sur la page Gestion des Âmes (filtre appliqué automatiquement, puis URL nettoyée).

## [1.7.31] - Indicateur de dernier contact pour les bergers

### Added
- Nouvelle colonne **« Dernier contact »** dans la page **Mes Âmes Assignées** avec un badge coloré (vert ≤ 7 j, jaune 8–14 j, rouge > 14 j, gris si jamais contactée).
- Tri par défaut sur le dernier contact (les âmes sans contact récent apparaissent en premier). Sélecteur permettant aussi de trier par nom.
- Bouton **« Contacter »** explicite sur chaque ligne (remplace l'icône) — ouvre directement la modale d'interaction (type Appel pré-sélectionné).

### Changed
- Après la fermeture de la modale d'interaction, la liste des derniers contacts est rechargée automatiquement.

## [1.7.30] - Import en masse d'âmes depuis Excel

### Added
- Nouveau bouton **« Importer Excel »** dans la page Gestion des Âmes (réservé aux rôles ADN, Admin et Super Admin).
- Modal d'import en 3 étapes : sélection du fichier, aperçu/validation ligne par ligne, import par batch avec barre de progression.
- Téléchargement d'un **modèle Excel vierge** avec en-têtes, exemples et listes déroulantes (Genre, Provenance, Âme indécise, Famille).
- Détection automatique des doublons de téléphone et des familles de service introuvables.

## [1.7.29] - Restriction des champs Provenance et Famille de service

### Fixed
- Les champs **« Provenance de l'âme »** et **« Famille de service »** sont désormais en lecture seule pour les bergers, responsables de famille et responsables de département. Seuls les rôles `adn`, `admin` et `super_admin` peuvent les modifier.


## [1.7.28] - Verrouillage de l'import basé sur le profil actif

### Fixed
- La cible d'import des serviteurs est désormais verrouillée sur le département du **profil actif** dès lors que l'utilisateur agit en tant que « Responsable de Département », même s'il dispose par ailleurs de droits admin. Pour importer dans un autre département, basculer sur le profil admin via le sélecteur de profils.


## [1.7.27] - Verrouillage du département cible à l'import (responsables)

### Fixed
- Un responsable de département ne peut plus choisir un autre département cible dans la modale « Importer des serviteurs » : la cible est automatiquement verrouillée sur son propre département. Le sélecteur reste disponible pour les administrateurs.


## [1.7.26] - Correction de l'import de serviteurs

### Fixed
- Correction de l'erreur **« Erreur lors du chargement »** dans le modal d'import des serviteurs (onglets « Depuis les âmes » et « Depuis les utilisateurs »)
- Suppression de la dépendance à un index composite Firestore : le tri par nom est désormais effectué côté client


## [1.7.25] - Création manuelle de serviteurs depuis le modal d'import

### Added
- Nouvel onglet **« Créer manuellement »** dans le modal d'import des serviteurs : permet aux chefs de département (et aux admins) d'ajouter un serviteur qui n'existe ni dans la liste des âmes ni dans celle des utilisateurs
- Le département est verrouillé sur celui du chef de département lorsqu'il ouvre le modal depuis son tableau de bord
- L'option « Responsable de département » dans la création manuelle est réservée aux administrateurs

### Changed
- Le formulaire d'ajout de serviteur (`ServantForm`) utilise désormais `ServantService.createServant`, avec une unicité téléphone/email **scopée au département** (une même personne peut être serviteur dans plusieurs départements sans blocage)


## [1.7.24] - Import de serviteurs depuis les âmes et utilisateurs

### Added
- Nouveau bouton **« Importer des serviteurs »** dans la gestion des serviteurs et le tableau de bord du responsable de département
- Possibilité d'ajouter des serviteurs en les important depuis la liste des **âmes** ou la liste des **utilisateurs** (n'importe quel rôle)
- Une même personne peut être serviteur dans plusieurs départements simultanément
- Affichage de l'origine du serviteur (badge « Importé d'âme » / « Importé d'utilisateur »)
- Détection des doublons : impossible d'importer deux fois la même personne dans le même département

### Changed
- Suppression de la contrainte d'unicité globale du téléphone/email côté serviteurs (multi-appartenance autorisée)


## [1.7.23] - Profil principal multi-rôles & nettoyage du login

### Added
- Possibilité de définir un **profil principal** pour les utilisateurs ayant plusieurs rôles ; ce profil est utilisé par défaut à la connexion
- Affichage de tous les rôles d'un utilisateur (badges multiples) dans la liste de gestion des utilisateurs, avec mise en évidence du profil principal (★)

### Changed
- Le sélecteur d'utilisateur de la page de connexion n'affiche plus le badge de rôle (nom + téléphone uniquement)
- L'utilisateur peut toujours basculer entre ses rôles via le sélecteur de profil dans l'en-tête après connexion


## [1.7.22] - Automatisation de la Mise à la Une pour les Audios

### Changed
- Les audios sont maintenant automatiquement mis à la une s'ils ont été publiés il y a moins de 7 jours
- Suppression de la case à cocher manuelle "Mettre à la une" dans le formulaire d'ajout/modification d'audio
- La logique de mise à la une est désormais basée sur la date de publication plutôt que sur un champ manuel
- Amélioration de l'expérience utilisateur avec une gestion automatisée du contenu à la une

### Removed
- Champ `featured` supprimé du formulaire de gestion des audios
- L'interface ne permet plus de définir manuellement le statut "à la une"

## [1.7.19] - Ajout des Photos de Profil pour les Âmes

### Added
- Ajout de la possibilité d'ajouter des photos de profil aux âmes
- Intégration du téléchargement et de l'affichage des photos dans les formulaires d'ajout et d'édition d'âme
- Affichage des photos de profil dans la liste des âmes avec icône par défaut si aucune photo
- Mise à jour du schéma de la base de données pour inclure le champ `photo_url` dans la table `souls`
- Gestion de la suppression des photos lors de l'édition des âmes

## [1.7.18] - Refactorisation de la Gestion des Utilisateurs

### Changed
- Suppression des onglets dans la page de gestion des utilisateurs
- Remplacement par des filtres déroulants pour le rôle et le statut
- Amélioration de l'interface utilisateur avec une vue unifiée et des filtres plus accessibles
- Simplification de la navigation dans la gestion des utilisateurs

## [1.7.17] - Ajout des Filtres de Statut

### Added
- Ajout de filtres de statut pour la gestion des âmes (Actives/Inactives/Toutes)
- Ajout de filtres de statut pour la gestion des serviteurs (Actifs/Inactifs/Tous)
- Ajout de filtres de statut pour la gestion des utilisateurs (Actifs/Inactifs/Tous)
- Amélioration de la visibilité et de la gestion des entités inactives

### Changed
- Par défaut, seules les entités actives sont affichées dans toutes les listes
- Possibilité de voir les entités inactives en sélectionnant le filtre approprié
- Interface utilisateur améliorée avec des sections de filtres dédiées

## [1.7.16] - Ajout de la Gestion du Statut pour les Âmes et Serviteurs

### Added
- Ajout de la possibilité d'activer/désactiver les âmes depuis leur formulaire d'édition
- Ajout de la possibilité d'activer/désactiver les serviteurs depuis leur formulaire d'édition
- Amélioration de la gestion des entités inactives dans l'application

### Changed
- Les bergers ne peuvent pas modifier le statut des âmes (restriction de permission)
- Les entités inactives n'apparaissent plus dans les listes principales
- Amélioration de l'interface utilisateur avec des messages explicatifs

## [1.7.15] - Ajout du Modal d'Anniversaire

### Added
- Ajout d'un modal pour l'ajout d'anniversaires depuis la page de liste
- Refactorisation du formulaire d'anniversaire en composant réutilisable
- Amélioration de l'expérience utilisateur avec un modal au lieu d'une navigation vers une nouvelle page

### Changed
- Le bouton "Ajouter un anniversaire" ouvre maintenant un modal au lieu de rediriger vers une nouvelle page
- La page publique `/anniversaires/ajouter` reste accessible pour les membres de l'assemblée

## [1.7.14] - Page de Collecte d'Anniversaires Publique

### Changed
- La page de collecte des dates d'anniversaire (/anniversaires/ajouter) est maintenant accessible publiquement
- Suppression de l'authentification requise pour permettre aux membres de l'assemblée de soumettre leurs dates d'anniversaire
- Amélioration de l'accessibilité pour la collecte de données des membres

## [1.7.13] - Réorganisation du Menu Super Admin

### Changed
- Réorganisation complète du menu de navigation pour le Super Admin en 5 groupes logiques
- **Gestion des Personnes** : Utilisateurs, Âmes, Serviteurs, Familles de service, Âmes indécises
- **Suivi & Interactions** : Interactions, Rappels, Présences, Historique des présences, Progression spirituelle
- **Contenu & Communication** : Gestion audio, Replay des enseignements, Gestion SMS, Modèles SMS
- **Outils & Configuration** : Carte des âmes, Anniversaires, Départements, Paramètres
- Amélioration de l'organisation logique des fonctionnalités pour une navigation plus intuitive

## [1.7.12] - Modification des Statistiques ADN

### Changed
- Modification de la carte "Nouvelles âmes (24h)" en "Nouvelles âmes (Mois)" dans le tableau de bord ADN
- La statistique affiche maintenant les âmes ajoutées au cours des 30 derniers jours au lieu des dernières 24 heures
- Amélioration de la pertinence des données pour le suivi mensuel des nouvelles âmes

## [1.7.11] - Suppression du Menu Export de Données pour les ADN

### Changed
- Suppression du sous-menu "Export de Données" pour le rôle ADN
- La fonctionnalité d'exportation reste accessible directement depuis la page "Gestion des Âmes"
- Simplification de la navigation pour éviter la redondance et la confusion

## [1.7.10] - Amélioration de la Navigation pour les ADN

### Changed
- Réorganisation des menus pour le rôle ADN (Amis des Nouveaux)
- Renommage du groupe "Gestion" en "Gestion des Âmes & Suivi" pour plus de clarté
- Ajout du menu "Âmes indécises" dans le groupe principal pour un accès direct
- Création d'un nouveau groupe "Ressources & Rapports" contenant Replay Audio et Export de Données
- Amélioration de l'organisation des menus selon les tâches principales des ADN

## [1.7.9] - Ajout du Menu Tableau de Bord

### Added
- Ajout d'un menu "Tableau de bord" permanent dans la navigation pour tous les utilisateurs
- Permet aux utilisateurs de retourner facilement au tableau de bord depuis n'importe quelle page
- Amélioration de l'expérience utilisateur avec un accès rapide au tableau de bord

## [1.7.8] - Amélioration de la Continuité Audio et Fluidité de Navigation

### Changed
- Correction du problème de gestion de l'audio lors des interactions utilisateur
- Préservation de la lecture audio lors de la navigation entre les enseignements
- Amélioration de l'expérience utilisateur avec un système de lecture ininterrompue
- Optimisation des performances et réduction de la consommation de ressources
- Interface utilisateur plus réactive pendant la lecture

## [1.7.7] - Amélioration de la Continuité Audio

### Changed
- Correction du problème d'interruption de la lecture audio lors du changement de piste
- Maintien de l'état de lecture (lecture/pause) lors de la navigation entre les audios
- Amélioration de la fluidité de l'expérience utilisateur lors de l'écoute séquentielle

## [1.7.6] - Visualisation Audio Avancée

### Changed
- Amélioration de la visualisation d'onde audio avec une représentation dynamique des fréquences
- Ajout d'effets visuels réactifs qui varient en fonction du contenu audio
- Optimisation des performances de l'analyseur de fréquences audio

## [1.7.5] - Ajout de la Visualisation d'Onde Audio

### Added
- Ajout d'une visualisation de forme d'onde pour le lecteur audio
- Amélioration de l'expérience utilisateur avec un retour visuel de la progression
- Optimisation des performances de rendu avec Canvas API

## [1.7.4] - Simplification du Lecteur Audio

### Changed
- Remplacement de wavesurfer.js par un lecteur audio natif plus performant
- Simplification de l'interface du lecteur audio
- Amélioration des performances de chargement et de lecture des fichiers audio

## [1.7.3] - Ajout de la Fonctionnalité de Changement de Mot de Passe par l'Utilisateur

### Added
- Ajout d'un bouton "Changer mon mot de passe" dans le profil utilisateur
- Implémentation d'une interface permettant aux utilisateurs de modifier leur propre mot de passe
- Intégration avec Firebase Cloud Functions pour la gestion sécurisée des mots de passe

## [1.7.2] - Amélioration de l'Interface de Localisation

### Changed
- Refonte de l'interface de sélection de localisation avec deux méthodes distinctes
- Ajout d'un bouton "Obtenir ma position actuelle" pour la géolocalisation
- Amélioration de l'extraction de coordonnées depuis les liens Google Maps
- Interface plus intuitive avec affichage clair de la source des coordonnées

## [1.7.1] - Ajout de la Réinitialisation de Mot de Passe par les Administrateurs

### Added
- Ajout de la fonctionnalité permettant aux administrateurs de réinitialiser les mots de passe des utilisateurs
- Intégration avec Firebase Cloud Functions pour la gestion sécurisée des mots de passe
- Interface utilisateur intuitive pour la réinitialisation des mots de passe

## [1.7.0] - Ajout de la Gestion des Serviteurs et Responsables de Département

### Added
- Ajout de la gestion des serviteurs
- Ajout de la gestion des responsables de département
- Possibilité d'assigner des serviteurs à des départements
- Possibilité de désigner un serviteur comme responsable de département

# Changelog

## [1.7.0] - Ajout de la Gestion des Serviteurs et Responsables de Département

### Added
- Ajout de la gestion des serviteurs
- Ajout de la gestion des responsables de département
- Possibilité d'assigner des serviteurs à des départements
- Possibilité de désigner un serviteur comme responsable de département

## [1.6.24] - Correction du badge "Nouveau" pour les âmes récentes

### Fixed
- Correction définitive du problème d'affichage du badge "Nouveau" pour les âmes récemment ajoutées
- Simplification de la fonction isWithinLast7Days pour une meilleure fiabilité
- Suppression des vérifications redondantes qui empêchaient l'affichage du badge

## [1.6.23] - Correction définitive du badge "Nouveau"

### Fixed
- Implémentation d'une solution définitive pour l'affichage du badge "Nouveau"
- Simplification de la logique de vérification des dates
- Suppression des logs de débogage superflus

## [1.6.22] - Correction robuste de l'affichage du badge "Nouveau"

### Fixed
- Implémentation d'une solution robuste pour l'affichage du badge "Nouveau"
- Amélioration de la vérification des dates de création des âmes
- Optimisation de la logique conditionnelle pour garantir l'affichage correct du badge

## [1.6.20] - Correction de l'affichage du badge "Nouveau"

### Fixed
- Correction d'un problème où le badge "Nouveau" ne s'affichait pas correctement pour les âmes récemment ajoutées
- Ajout d'une vérification plus stricte de l'existence de la date de création avant d'appliquer la logique du badge

## [1.6.19] - Correction de l'affichage du badge "Nouveau"

### Fixed
- Correction d'un problème où le badge "Nouveau" ne s'affichait pas correctement pour les âmes récemment ajoutées
- Ajout d'une vérification de l'existence de la date de création avant d'appliquer la logique du badge
- Amélioration de la structure du code pour une meilleure lisibilité

## [1.6.18] - Correction de l'affichage du badge "Nouveau"

### Fixed
- Correction d'un problème où le badge "Nouveau" ne s'affichait pas pour les nouvelles âmes
- Ajout de la logique conditionnelle pour afficher le badge en fonction de la date de création

## [1.6.17] - Mise en évidence des Nouvelles Âmes

### Added
- Ajout d'un badge "Nouveau" pour les âmes ajoutées dans les 7 derniers jours
- Amélioration de la visibilité des nouvelles âmes pour faciliter leur identification par les bergers

## [1.6.16] - Suppression du bouton d'export PDF

### Changed
- Suppression du bouton d'export PDF dans la gestion des âmes
- Simplification de l'interface utilisateur

## [1.6.15] - Amélioration du Partage Audio avec Sélection Automatique

### Added
- Ajout de la sélection automatique de l'audio partagé lorsqu'un utilisateur clique sur un lien partagé
- Inclusion de l'identifiant de l'audio dans l'URL de partage pour une expérience utilisateur améliorée

### Changed
- Optimisation du processus de partage pour une meilleure expérience utilisateur
- Amélioration de la gestion des paramètres d'URL pour la sélection d'audio

## [1.6.14] - Amélioration du Partage Audio Direct

### Changed
- Amélioration du partage des audios individuels avec lien direct
- Partage du lien direct vers le fichier audio dans le presse-papier
- Optimisation de l'expérience utilisateur lors du partage d'audio

## [1.6.13] - Amélioration du Partage Audio

### Changed
- Amélioration du partage des audios individuels
- Inclusion de la description de l'audio dans le message de partage
- Partage direct du lien vers le fichier audio plutôt que vers la page

## [1.6.12] - Amélioration du Partage Audio

### Changed
- Amélioration du partage des audios individuels
- Inclusion de la description de l'audio dans le message de partage
- Partage direct du lien vers le fichier audio plutôt que vers la page

## [1.6.1] - Mise à jour de l'Icône Twitter vers X

### Changed
- Remplacement de l'ancien logo Twitter par le nouveau logo X dans la fenêtre de partage
- Mise à jour du style et du texte pour refléter le changement de marque
- Amélioration de l'expérience utilisateur avec des icônes à jour

## [1.6.0] - Ajout du Footer sur la Page Replay Audio

### Added
- Ajout d'un pied de page sur la page Replay Audio
- Amélioration de la cohérence de l'interface utilisateur
- Accès facilité aux mentions légales et à la politique de confidentialité

## [1.5.9] - Amélioration du Carrousel des Audios à la Une

### Changed
- Ajout d'un effet de défilement en boucle infinie pour les audios à la une
- Amélioration de la transition entre le dernier et le premier élément du carrousel
- Optimisation de l'expérience utilisateur avec un défilement continu sans interruption

## [1.5.8] - Amélioration de l'Interface des Audios à la Une

### Changed
- Suppression de la barre de défilement dans la section des audios à la une
- Amélioration de l'esthétique visuelle du carrousel
- Optimisation de l'expérience utilisateur pour la navigation dans les contenus mis en avant

## [1.5.7] - Défilement Automatique des Audios à la Une

### Changed
- Ajout du défilement automatique pour les audios à la une lorsqu'il y en a plus de deux
- Amélioration de l'expérience utilisateur avec un carrousel automatique
- Ajout d'indicateurs de navigation pour le carrousel

## [1.5.6] - Amélioration de l'Affichage des Audios à la Une

### Changed
- Les audios à la une s'affichent maintenant dans un format de défilement horizontal lorsqu'il y en a plus de deux
- Amélioration de l'expérience utilisateur pour la navigation dans les contenus mis en avant
- Optimisation de l'affichage sur tous les types d'écrans

## [1.4.2] - Amélioration de la description de la fonctionnalité Replay Audio

### Changed
- Mise à jour de la description de la fonctionnalité Replay Audio pour mieux refléter son objectif
- Clarification que la fonctionnalité permet d'écouter tous les moments forts de la cellule (adoration, louange, prédication, sainte cène, etc.)

## [1.5.4] - Amélioration de la Description du Replay Audio

### Changed
- Mise à jour de la description dans le modal d'information de la page Replay Audio
- Clarification que la fonctionnalité permet d'écouter tous les moments forts de la cellule
- Amélioration du texte pour mieux refléter la diversité des contenus audio disponibles

## [1.5.3] - Amélioration de l'Interface Mobile

### Changed
- Amélioration de l'interface du sélecteur de date pour une meilleure expérience sur mobile
- Optimisation de la mise en page pour les petits écrans
- Ajout d'étiquettes pour les champs de date sur mobile

## [1.5.2] - Amélioration de l'Interface Mobile

### Changed
- Réorganisation de la page Replay Audio pour une meilleure expérience sur mobile
- Affichage des sections "À la une" et "Catégories" avant la liste des audios sur mobile
- Amélioration de la navigation et de l'accessibilité sur les appareils mobiles

## [1.5.0] - Amélioration de la Page Replay Audio

### Added
- Ajout d'un bouton de partage sur la page Replay Audio
- Possibilité de partager la page via les réseaux sociaux (Facebook, Twitter, WhatsApp)
- Ajout d'un bouton d'information sur la page

### Changed
- Refonte complète de l'interface utilisateur de la page Replay Audio
- Amélioration de l'expérience utilisateur avec des animations et transitions
- Affichage des détails de l'enseignement sélectionné dans la barre latérale

## [1.4.9] - Ajout du menu Replay Audio

### Added
- Ajout du menu "Replay Audio" dans la navigation pour tous les utilisateurs
- Accès direct à la page de lecture audio depuis le menu principal
- Amélioration de l'accessibilité aux enseignements audio

## [1.4.8] - Amélioration de l'Affichage des Audios

### Changed
- Amélioration de l'affichage des informations des fichiers audio dans la liste
- Ajout d'icônes pour une meilleure lisibilité des métadonnées (orateur, date, durée, thème)
- Mise en évidence des audios "à la une" avec un badge spécifique

## [1.4.7] - Simplification des Paramètres

### Changed
- Suppression de l'onglet "Base de données" dans les paramètres du super admin
- Simplification de l'interface des paramètres

## [1.4.6] - Correction de l'Initialisation Firebase

### Fixed
- Correction d'une erreur de configuration Firebase où deux options incompatibles étaient utilisées ensemble
- Suppression de l'option experimentalForceLongPolling qui entrait en conflit avec experimentalAutoDetectLongPolling
- Amélioration de la stabilité de la connexion à Firebase

## [1.4.5] - Correction de la Mise à Jour du Profil

### Fixed
- Correction d'un problème où la mise à jour du profil échouait si l'utilisateur n'existait pas dans la base de données
- Ajout d'une vérification de l'existence de l'utilisateur avant la mise à jour
- Amélioration des messages d'erreur pour fournir des informations plus précises

## [1.4.4] - Correction de la Suppression des Photos de Profil

### Fixed
- Correction du problème de suppression des photos de profil lors de la mise à jour des utilisateurs
- Amélioration de la détection des chemins de fichiers dans le stockage
- Optimisation de la gestion des photos de profil dans les formulaires d'édition

## [1.4.3] - Standardisation du Stockage

### Changed
- Utilisation exclusive du bucket "public_storage" pour toutes les ressources
- Suppression des références aux anciens buckets de stockage
- Amélioration de la gestion des chemins de fichiers pour la suppression

## [1.4.2] - Correction du Stockage

### Changed
- Utilisation d'un seul bucket de stockage pour toutes les ressources
- Correction du problème de suppression des photos de profil
- Amélioration de la gestion des fichiers dans le stockage

## [1.5.2] - Correction de la Suppression des Photos de Profil

### Fixed
- Correction d'un problème où les photos de profil étaient supprimées lors de la mise à jour des informations utilisateur
- Amélioration de la gestion des photos de profil dans le composant EditUserModal
- Optimisation du processus de téléchargement et de suppression des photos

## [1.5.2] - Correction de la Suppression des Photos de Profil

### Fixed
- Correction d'un problème où les photos de profil étaient supprimées lors de la mise à jour des informations utilisateur
- Amélioration de la gestion des photos de profil dans le composant EditUserModal
- Optimisation du processus de téléchargement et de suppression des photos

## [1.5.1] - Correction de la Mise à Jour des Rôles

### Fixed
- Correction d'un problème où la mise à jour du rôle d'un utilisateur ne mettait pas à jour le champ `role` principal
- Synchronisation du champ `role` avec le rôle principal dans l'objet `roles`
- Amélioration de la cohérence des données utilisateur

## [1.5.0] - Correction de la Mise à Jour des Rôles

### Fixed
- Correction d'un problème où la mise à jour du rôle d'un utilisateur ne fonctionnait pas correctement
- Amélioration de la gestion des utilisateurs entre les collections users et admins
- Mise à jour des requêtes pour prendre en compte la nouvelle structure de données

## [1.4.9] - Migration des Administrateurs vers Users

### Changed
- Modification du code pour considérer que tous les administrateurs (sauf super admin) sont dans la collection 'users'
- Mise à jour des requêtes pour récupérer les administrateurs depuis la collection 'users'
- Amélioration de la gestion des utilisateurs entre les collections

## [1.4.8] - Migration des Administrateurs

### Added
- Ajout d'une fonctionnalité de migration des administrateurs de la collection 'admins' vers 'users'
- Ajout d'un onglet "Base de données" dans les paramètres pour les super administrateurs
- Conservation des super administrateurs dans la collection 'admins'

## [1.4.7] - Correction de bugs

### Fixed
- Correction d'un problème d'affichage des photos de profil après mise à jour
- Amélioration du cache-busting pour les images de profil

## [1.4.6] - Correction de bugs

### Fixed
- Correction d'une erreur lors de la mise à jour d'un utilisateur sans modification de la photo

## [1.4.5] - Correction de bugs

### Fixed
- Correction d'une erreur où le hook useEffect n'était pas importé dans le composant LocationField

## [1.4.4] - Correction de bugs

### Fixed
- Correction d'un problème d'initialisation du champ "Lieu d'habitation" dans le formulaire d'édition des utilisateurs
- Amélioration de la gestion de la géolocalisation dans les formulaires

## [1.4.3] - Correction de bugs

### Fixed
- Correction d'une erreur lors de la mise à jour des utilisateurs
- Amélioration de la gestion des utilisateurs entre les collections users et admins

## [1.4.2] - Consolidation de la Gestion des Utilisateurs

### Changed
- Déplacement des administrateurs de la section "Paramètres" vers "Gestion des Utilisateurs"
- Ajout d'un onglet "Administrateurs" dans la section "Gestion des Utilisateurs"
- Simplification de l'interface pour une meilleure expérience utilisateur

## [1.4.1] - Simplification de l'Interface

### Changed
- Suppression des menus dédiés pour la gestion des bergers et ADN
- Consolidation de la gestion des utilisateurs dans un seul menu avec onglets
- Amélioration de la navigation pour une expérience utilisateur plus intuitive

## [1.4.1] - Simplification de l'Interface

### Changed
- Suppression des menus dédiés pour la gestion des bergers et ADN
- Consolidation de la gestion des utilisateurs dans un seul menu avec onglets
- Amélioration de la navigation pour une expérience utilisateur plus intuitive

## [1.4.0] - Ajout du rôle Pasteur

### Added
- Ajout du rôle "Pasteur" avec les mêmes permissions que l'administrateur
- Mise à jour de l'interface pour afficher et gérer le nouveau rôle
- Adaptation des composants pour prendre en charge le rôle Pasteur

## [1.3.9] - Amélioration de l'affichage du crédit SMS

### Changed
- Affichage simultané du crédit API brut et de l'équivalent en nombre de SMS
- Ajout d'une note explicative sur le ratio de conversion (13 crédits = 100 SMS)

## [1.3.8] - Correction du calcul du crédit SMS

### Fixed
- Correction de la formule de conversion du crédit SMS (13 crédits = 100 SMS)
- Mise à jour de l'affichage pour correspondre exactement à la valeur du tableau de bord du fournisseur

## [1.3.7] - Correction de l'affichage du crédit SMS

### Fixed
- Correction de l'affichage du crédit SMS pour correspondre exactement à la valeur affichée dans le tableau de bord du fournisseur
- Mise à jour de la formule de conversion (13 crédits = 100 SMS)

## [1.3.6] - Correction du menu SMS pour les bergers

### Fixed
- Correction de l'affichage du menu SMS pour les bergers
- Amélioration de la gestion des permissions pour l'accès aux fonctionnalités SMS

## [1.3.5] - Envoi de SMS aux âmes indécises

### Added
- Ajout de la fonctionnalité d'envoi de SMS en masse aux âmes indécises
- Interface dédiée pour sélectionner et envoyer des messages aux âmes indécises
- Intégration dans le menu de navigation pour les administrateurs et ADN

## [1.3.4] - Conversion du Crédit SMS

### Changed
- Mise à jour de l'affichage du crédit SMS pour montrer le nombre approximatif de SMS disponibles (13 crédits = 100 SMS)

## [1.3.3] - Affichage du crédit SMS restant

### Added
- Ajout de la possibilité de consulter le crédit SMS restant

### Fixed
- Correction d'une erreur où le crédit SMS ne pouvait pas être chargé en raison d'une réponse API inattendue

## [1.3.2] - Amélioration des SMS

### Changed
- Limitation des messages SMS à 125 caractères pour permettre l'ajout automatique de la signature
- Ajout automatique du prénom et du numéro de téléphone de l'expéditeur à la fin de chaque SMS
- Mise à jour des interfaces d'envoi de SMS pour refléter cette nouvelle limitation

## [1.3.0] - Réorganisation de l'Interface

### Changed
- Réorganisation du menu de navigation administrateur en 3 groupes maximum
- Amélioration de l'organisation des éléments de menu pour une meilleure expérience utilisateur

## [1.2.9] - Ajout du champ Thème pour les Audios

### Added
- Ajout du champ "Thème" pour les enseignements audio
- Affichage du thème dans la liste des audios et les détails

## [1.2.8] - Ajout de la Lecture Audio

### Added
- Ajout de la page de lecture audio publique (/replay)
- Streaming des enseignements audio depuis le stockage cloud
- Interface d'administration pour la gestion des fichiers audio
- Lecteur audio avec visualisation de la forme d'onde
- Filtres par catégorie, orateur et date

## [1.2.7] - Amélioration de l'Envoi de SMS

### Changed
- Ajout de la sélection du modèle de SMS lors de la création d'une âme
- Filtrage des modèles de SMS par catégorie "Suivi"
- Amélioration de la gestion des erreurs lors de l'envoi de SMS

## [1.2.6] - Améliorations de l'Interface

### Added
- Ajout de la prévisualisation des photos de profil dans la liste des utilisateurs
- Amélioration de la gestion des photos de profil avec suppression automatique dans le stockage

## [1.2.5] - Amélioration des Interactions

### Changed
- Renommage de l'interaction "message" en "SMS"
- Ajout d'un nouveau type d'interaction "Message" pour les messages WhatsApp et autres
- Clarification des boutons d'action :
  - "Envoyer le message" pour les interactions de type SMS
  - "Enregistrer l'interaction" pour les autres types (appel, visite, message)

## [1.2.4] - Ajout des Anniversaires

### Added
- Ajout de la gestion des anniversaires
- Formulaire de collecte des dates d'anniversaire
- Liste des anniversaires avec filtres et statistiques
- Prévention des doublons de numéros de téléphone

## [1.2.3] - Améliorations de la Géolocalisation et des Présences

### Added
- Ajout de la géolocalisation pour les bergers
- Ajout du surnom pour les bergers
- Affichage des bergers sur la carte avec un marqueur distinct
- Historique des présences avec filtres avancés

### Changed
- Renommage du menu "Carte des âmes" en "Géolocalisation"
- Amélioration de l'affichage des marqueurs sur la carte
- Optimisation des performances de chargement des données

## [1.2.2] - Mise à jour du SenderID

### Changed
- Mise à jour du SenderID pour l'envoi des SMS (VHDJIBI3)

## [1.2.2] - Amélioration des Communications

### Added
- Envoi de SMS aux âmes indécises par les admins et ADN
- Intégration des envois SMS dans le rapport des interactions des bergers
- Gestion des catégories pour les modèles de SMS
- Affichage du nombre d'âmes indécises dans les tableaux de bord

## [1.2.1] - Correction des SMS et Intégration des Interactions

### Added
- Intégration des SMS dans les interactions individuelles des âmes
- Menu SMS dédié pour l'envoi en masse aux âmes assignées
- Ajout des messages SMS dans l'historique des interactions
- Préfixe "Envoi du message suivant:" dans les notes d'interaction pour les SMS

### Changed
- Clarification de l'utilisation des SMS :
  - Menu SMS : envoi en masse aux âmes assignées
  - Interactions : envoi individuel lors du suivi d'une âme

### Fixed
- Correction du remplacement des variables [nom] et [surnom] dans les SMS
- Correction de l'affichage des variables dans les interactions


All notable changes to this project will be documented in this file.
## [1.2.0] - Communication & Security Update

### Added
- Système de Communication
  - Envoi de SMS aux âmes
  - Modèles de messages prédéfinis
  - Historique des communications
- Sécurité et Confidentialité améliorée
  - Gestion des permissions granulaire
  - Protection des données personnelles
  - Politique de confidentialité
  - Mentions légales

## [1.1.0] - Spiritual & Administrative Features

### Added
- Suivi du parcours spirituel
  - Progression spirituelle des âmes
  - Participation aux formations (Académie VDH, École PDV)
  - Implication dans les départements
  - Appartenance aux familles de service
- Géolocalisation des âmes sur une carte
- Export des données en Excel et PDF
- Suivi des interactions avec les âmes
- Système de rappels pour les suivis
- Gestion des Présences
  - Enregistrement des présences aux cultes
  - Statistiques de fréquentation
  - Rapports de présence
- Gestion des Départements
  - Création et gestion des départements
  - Organisation des familles de service
  - Attribution des responsabilités
- Fonctionnalités Administratives
  - Sauvegarde et restauration des données
  - Gestion des paramètres système
  - Journaux d'activité

## [1.0.0] - Initial Release

### Added
- Gestion des Utilisateurs
  - Différents rôles : Super Admin, Admin, Berger(e)s, ADN
  - Système d'authentification sécurisé
  - Gestion des profils utilisateurs
  - Gestion des permissions selon les rôles
- Gestion des Âmes (fonctionnalités de base)
  - Ajout et modification des informations des âmes
  - Assignation des bergers
- Gestion des Bergers
  - Attribution des âmes aux bergers
  - Statistiques de performance
- Statistiques et Rapports
  - Tableaux de bord personnalisés selon les rôles
  - Statistiques de croissance
  - Rapports d'activité
  - Export des données