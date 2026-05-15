import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Modal } from './Modal';

export function ChangelogModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [changelog, setChangelog] = useState<string>('');

  useEffect(() => {
    const fetchChangelog = async () => {
      try {
        const response = await fetch('/src/CHANGELOG.md');
        const text = await response.text();
        setChangelog(text);
      } catch (error) {
        console.error('Error fetching changelog:', error);
        setChangelog('Erreur lors du chargement du changelog');
      }
    };

    if (isOpen) {
      fetchChangelog();
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Notes de mise à jour"
    >
      <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        <div className="prose prose-sm max-w-none">
          <div className="space-y-6">
            <div className="bg-[#00665C]/5 p-4 rounded-lg border border-[#00665C]/10">
              <h3 className="text-lg font-semibold text-[#00665C] mb-2">Dernières mises à jour</h3>
              <p className="text-sm font-medium">Version 1.7.17</p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>Ajout de filtres de statut pour la gestion des âmes (Actives/Inactives/Toutes)</li>
                <li>Ajout de filtres de statut pour la gestion des serviteurs (Actifs/Inactifs/Tous)</li>
                <li>Ajout de filtres de statut pour la gestion des utilisateurs (Actifs/Inactifs/Tous)</li>
                <li>Par défaut, seules les entités actives sont affichées dans toutes les listes</li>
              </ul>
              <p className="text-sm font-medium">Version 1.7.16</p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>Ajout de la possibilité d'activer/désactiver les âmes depuis leur formulaire d'édition</li>
                <li>Ajout de la possibilité d'activer/désactiver les serviteurs depuis leur formulaire d'édition</li>
                <li>Amélioration de la gestion des entités inactives dans l'application</li>
                <li>Les bergers ne peuvent pas modifier le statut des âmes (restriction de permission)</li>
              </ul>
              <p className="text-sm font-medium">Version 1.7.15</p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>Ajout d'un modal pour l'ajout d'anniversaires depuis la page de liste</li>
                <li>Refactorisation du formulaire d'anniversaire en composant réutilisable</li>
                <li>Amélioration de l'expérience utilisateur avec un modal au lieu d'une navigation vers une nouvelle page</li>
              </ul>
              <p className="text-sm font-medium">Version 1.7.14</p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>La page de collecte des dates d'anniversaire (/anniversaires/ajouter) est maintenant accessible publiquement</li>
                <li>Suppression de l'authentification requise pour permettre aux membres de l'assemblée de soumettre leurs dates d'anniversaire</li>
                <li>Amélioration de l'accessibilité pour la collecte de données des membres</li>
              </ul>
              <p className="text-sm font-medium">Version 1.7.13</p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>Réorganisation complète du menu de navigation pour le Super Admin en 5 groupes logiques</li>
                <li>Gestion des Personnes : Utilisateurs, Âmes, Serviteurs, Familles de service, Âmes indécises</li>
                <li>Suivi & Interactions : Interactions, Rappels, Présences, Historique des présences, Progression spirituelle</li>
                <li>Contenu & Communication : Gestion audio, Replay des enseignements, Gestion SMS, Modèles SMS</li>
                <li>Outils & Configuration : Carte des âmes, Anniversaires, Départements, Paramètres</li>
              </ul>
              <p className="text-sm font-medium">Version 1.7.12</p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>Modification de la carte "Nouvelles âmes (24h)" en "Nouvelles âmes (Mois)" dans le tableau de bord ADN</li>
                <li>La statistique affiche maintenant les âmes ajoutées au cours des 30 derniers jours</li>
                <li>Amélioration de la pertinence des données pour le suivi mensuel des nouvelles âmes</li>
              </ul>
              <p className="text-sm font-medium mt-4">Version 1.7.11</p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>Suppression du sous-menu "Export de Données" pour le rôle ADN</li>
                <li>La fonctionnalité d'exportation reste accessible directement depuis la page "Gestion des Âmes"</li>
                <li>Simplification de la navigation pour éviter la redondance et la confusion</li>
              </ul>
              <p className="text-sm font-medium mt-4">Version 1.7.10</p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>Réorganisation des menus pour le rôle ADN (Amis des Nouveaux)</li>
                <li>Renommage du groupe "Gestion" en "Gestion des Âmes & Suivi" pour plus de clarté</li>
                <li>Ajout du menu "Âmes indécises" dans le groupe principal pour un accès direct</li>
                <li>Création d'un nouveau groupe "Ressources & Rapports"</li>
              </ul>
              <p className="text-sm font-medium">Version 1.7.9</p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>Ajout d'un menu "Tableau de bord" permanent dans la navigation pour tous les utilisateurs</li>
                <li>Permet aux utilisateurs de retourner facilement au tableau de bord depuis n'importe quelle page</li>
                <li>Amélioration de l'expérience utilisateur avec un accès rapide au tableau de bord</li>
              </ul>
              <p className="text-sm font-medium mt-4">Version 1.7.8</p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>Correction du problème de gestion de l'audio lors des interactions utilisateur</li>
                <li>Préservation de la lecture audio lors de la navigation entre les enseignements</li>
                <li>Amélioration de l'expérience utilisateur avec un système de lecture ininterrompue</li>
              </ul>
              <p className="text-sm font-medium mt-4">Version 1.7.7</p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>Correction du problème d'interruption de la lecture audio lors du changement de piste</li>
                <li>Maintien de l'état de lecture (lecture/pause) lors de la navigation entre les audios</li>
                <li>Amélioration de la fluidité de l'expérience utilisateur lors de l'écoute séquentielle</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}