# Changelog

## [Version 1.0.2] - 2025-01-27

### Added
- Ajout de la sélection multiple des utilisateurs sur la page de gestion des utilisateurs
- Ajout de la fonctionnalité d'assignation de rôle en masse pour les utilisateurs sélectionnés
- Interface intuitive avec cases à cocher pour sélectionner individuellement ou en groupe
- Modal dédié pour l'assignation en masse avec confirmation et validation

## [Version 1.0.1] - 2025-01-27

### Added
- Ajout de deux nouvelles catégories d'âmes dans les statistiques générales pour une vue complète :
  - "Âmes non assignées décidées (actives)" : Âmes qui ne sont ni assignées ni indécises, avec statut actif
  - "Âmes non assignées décidées (inactives)" : Âmes qui ne sont ni assignées ni indécises, avec statut inactif
- Ces nouvelles catégories permettent d'expliquer la totalité des âmes enregistrées et de résoudre les discrepances dans les calculs

## [Version 1.0.0] - 2025-01-27

### Fixed
- Résolu l'erreur "RecentActivity is not defined" dans le composant GeneralStats

### Added
- Ajout d'onglets pour organiser le tableau de bord administrateur en sections distinctes

## [1.7.21] - Amélioration du Style des Cartes de Statistiques

### Changed
- Ajout d'une bande de couleur sur le côté gauche des cartes de statistiques
- Amélioration de l'identité visuelle avec un style inspiré des meilleures pratiques de design
- Application cohérente du style sur toutes les cartes de statistiques du tableau de bord

## [1.7.20] - Amélioration du Tableau de Bord Administrateur

### Added
- Ajout d'onglets pour organiser les différentes sections du tableau de bord administrateur
- Regroupement des statistiques générales et des activités récentes dans un même onglet
- Amélioration de l'organisation visuelle avec des sections dédiées pour la progression spirituelle, la rétention et les interactions
- Ajout d'un graphique de répartition par genre pour visualiser la distribution des âmes

### Changed
- Réorganisation du tableau de bord en 4 onglets : "Général & Activité", "Progression Spirituelle", "Rétention", "Interactions"
- Amélioration de l'expérience utilisateur avec une navigation plus claire entre les différentes métriques

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

## [1.6.21] - Correction de l'affichage du badge "Nouveau"

### Fixed
- Correction d'un problème où le badge "Nouveau" ne s'affichait pas correctement pour les âmes récemment ajoutées
- Ajout de logs de débogage pour identifier les problèmes potentiels avec les dates
- Simplification de la condition de vérification de la date de création

## [1.6.20] - Correction de l'affichage du badge "Nouveau"

### Fixed
- Correction d'un problème où le badge "Nouveau" ne s'affichait pas correctement pour les âmes récemment ajoutées
- Ajout de logs de débogage pour identifier les problèmes potentiels avec les dates
- Simplification de la condition de vérification de la date de création

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

## [1.6.11] - Correction de la Visibilité du Lecteur Audio

### Fixed
- Correction d'un problème où le lecteur audio ne s'affichait pas lors de la sélection d'un audio
- Amélioration du rendu du composant AudioPlayer avec l'ajout d'une clé unique

## [1.6.10] - Amélioration du Partage Audio

### Added
- Ajout de la fonctionnalité de partage pour les audios individuels
- Possibilité de partager un audio spécifique avec son titre, orateur et thème
- Support du partage natif sur les appareils mobiles

## [1.6.9] - Mise à jour du Ratio de Crédit SMS

### Changed
- Mise à jour du ratio de conversion des crédits SMS Brevo
- Modification de l'affichage du crédit restant pour refléter le nouveau ratio (638 crédits = 100 SMS)

## [1.6.8] - Amélioration du Suivi des Écoutes Audio

### Changed
- Modification du système de comptage des écoutes audio
- Les écoutes sont maintenant comptabilisées lorsque l'utilisateur clique sur le bouton de lecture
- Amélioration de la précision des statistiques d'écoute

## [1.6.7] - Amélioration de l'Interface Mobile pour les Audios

### Changed
- Refonte complète des cartes audio pour une meilleure expérience sur mobile
- Réorganisation des éléments pour une lisibilité optimale sur petits écrans
- Ajout d'un design responsive avec mise en page adaptative

## [1.6.6] - Mise à jour du Message de Partage

### Changed
- Modification du message de partage pour la page Replay Audio
- Utilisation d'un message plus générique pour refléter la diversité des contenus audio

## [1.6.5] - Correction de l'erreur RoleService non défini

### Fixed
- Correction d'une erreur où RoleService n'était pas défini dans AuthContext

## [1.6.4] - Correction de l'Authentification

### Fixed
- Correction d'un problème d'authentification lors de la connexion
- Amélioration de la gestion des mots de passe par défaut
- Optimisation du processus de vérification des identifiants

## [1.6.3] - Consolidation de la Gestion des Utilisateurs

### Changed
- Suppression des formulaires spécifiques ADNForm et ShepherdForm
- Suppression des pages dédiées ADNManagement et ShepherdManagement
- Consolidation de toute la gestion des utilisateurs dans un seul composant UserManagement
- Simplification de l'architecture de l'application

## [1.6.2] - Fixed Firebase Auth Error

### Fixed
- Removed Firebase Authentication dependency from user creation forms
- Modified ADNForm and ShepherdForm to create users directly in Firestore
- Added informative messages about default passwords for new users

## [1.5.5] - Amélioration de l'Affichage des Audios à la Une

### Added
- Ajout d'une section dédiée "À la une" pour les audios mis en avant
- Affichage visuel distinctif avec badge étoile pour les audios à la une
- Mise en page optimisée pour mettre en valeur les contenus importants

### Fixed
- Correction d'un problème empêchant le téléchargement direct des fichiers audio
- Ajout de la fonction manquante formatDateForFileName

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

## [1.5.1] - Correction du Sélecteur de Date

### Fixed
- Correction du problème de z-index du sélecteur de date sur la page Replay Audio
- Remplacement du composant react-datepicker par un composant personnalisé
- Amélioration de l'interface utilisateur du sélecteur de date

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

## [1.4.2] - Correction du Stockage

### Changed
- Utilisation d'un seul bucket de stockage pour toutes les ressources
- Correction du problème de suppression des photos de profil
- Amélioration de la gestion des fichiers dans le stockage

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