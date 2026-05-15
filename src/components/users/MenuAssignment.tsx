import { useState } from 'react';
import { PERMISSIONS } from '../../constants/roles';

interface MenuAssignmentProps {
  selectedMenus: string[];
  onChange: (menus: string[]) => void;
}

interface MenuOption {
  id: string;
  label: string;
  permission: string;
  description: string;
}

export function MenuAssignment({ selectedMenus, onChange }: MenuAssignmentProps) {
  // Define available menu options
  const menuOptions: MenuOption[] = [
    {
      id: 'MANAGE_SOULS',
      label: 'Gestion des Âmes',
      permission: PERMISSIONS.MANAGE_SOULS,
      description: 'Permet d\'ajouter et de gérer les âmes'
    },
    {
      id: 'MANAGE_USERS',
      label: 'Gestion des Utilisateurs',
      permission: PERMISSIONS.MANAGE_USERS,
      description: 'Permet de gérer les utilisateurs du système'
    },
    {
      id: 'MANAGE_AUDIO',
      label: 'Gestion des Audios',
      permission: PERMISSIONS.MANAGE_AUDIO,
      description: 'Permet de gérer les audios de cultes'
    },
    {
      id: 'MANAGE_DEPARTMENTS',
      label: 'Gestion des Départements',
      permission: PERMISSIONS.MANAGE_DEPARTMENTS,
      description: 'Permet de gérer les départements'
    },
    {
      id: 'MANAGE_FAMILIES',
      label: 'Gestion des Familles de Service',
      permission: PERMISSIONS.MANAGE_FAMILIES,
      description: 'Permet de gérer les familles de service'
    },
    {
      id: 'VIEW_STATS',
      label: 'Statistiques',
      permission: PERMISSIONS.VIEW_STATS,
      description: 'Permet de voir les statistiques'
    },
    {
      id: 'EXPORT_DATA',
      label: 'Export de Données',
      permission: PERMISSIONS.EXPORT_DATA,
      description: 'Permet d\'exporter les données'
    },
    {
      id: 'MANAGE_SETTINGS',
      label: 'Paramètres',
      permission: PERMISSIONS.MANAGE_SETTINGS,
      description: 'Permet d\'accéder aux paramètres du système'
    },
    {
      id: 'MANAGE_BACKUP',
      label: 'Sauvegarde et Restauration',
      permission: PERMISSIONS.MANAGE_BACKUP,
      description: 'Permet de gérer les sauvegardes et restaurations'
    },
    {
      id: 'MANAGE_ROLES_PERMISSIONS',
      label: 'Gestion des Rôles et Permissions',
      permission: PERMISSIONS.MANAGE_ROLES_PERMISSIONS,
      description: 'Permet de visualiser les rôles et permissions du système'
    },
    {
      id: 'MANAGE_SMS_TEMPLATES',
      label: 'Modèles SMS',
      permission: PERMISSIONS.MANAGE_SMS_TEMPLATES,
      description: 'Permet de gérer les modèles de SMS'
    },
    {
      id: 'VIEW_BIRTHDAYS',
      label: 'Anniversaires',
      permission: PERMISSIONS.MANAGE_BIRTHDAYS,
      description: 'Permet de consulter et gérer les anniversaires (ajout, suppression)'
    }
  ];

  const toggleMenu = (permission: string) => {
    if (selectedMenus.includes(permission)) {
      onChange(selectedMenus.filter(p => p !== permission));
    } else {
      onChange([...selectedMenus, permission]);
    }
  };

  return (
    <div className="space-y-3 border border-gray-200 rounded-md p-3">
      {menuOptions.map(menu => (
        <div key={menu.id} className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id={`menu-${menu.id}`}
              type="checkbox"
              checked={selectedMenus.includes(menu.permission)}
              onChange={() => toggleMenu(menu.permission)}
              className="h-4 w-4 text-[#00665C] border-gray-300 rounded focus:ring-[#00665C]"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor={`menu-${menu.id}`} className="font-medium text-gray-700">
              {menu.label}
            </label>
            <p className="text-gray-500">{menu.description}</p>
          </div>
        </div>
      ))}
      
      {menuOptions.length === 0 && (
        <p className="text-sm text-gray-500 py-2">Aucun menu additionnel disponible</p>
      )}
    </div>
  );
}