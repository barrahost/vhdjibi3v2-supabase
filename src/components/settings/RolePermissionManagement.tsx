import React, { useState } from 'react';
import { Shield, Users, UserCheck, Key, Star, User } from 'lucide-react';
import { ROLES, ROLE_PERMISSIONS, PERMISSIONS } from '../../constants/roles';

interface RoleInfo {
  role: string;
  displayName: string;
  description: string;
  icon: React.FC<any>;
  color: string;
  bgColor: string;
}

const ROLE_INFO: Record<string, RoleInfo> = {
  [ROLES.SUPER_ADMIN]: {
    role: ROLES.SUPER_ADMIN,
    displayName: 'Super Administrateur',
    description: 'Accès total au système avec toutes les permissions',
    icon: Star,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  [ROLES.ADMIN]: {
    role: ROLES.ADMIN,
    displayName: 'Administrateur',
    description: 'Gestion complète des utilisateurs, âmes et données',
    icon: Shield,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  [ROLES.SHEPHERD]: {
    role: ROLES.SHEPHERD,
    displayName: 'Berger(e)',
    description: 'Suivi des âmes assignées et gestion des interactions',
    icon: UserCheck,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  [ROLES.ADN]: {
    role: ROLES.ADN,
    displayName: 'ADN (Ami Des Nouveaux)',
    description: 'Accueil et gestion des nouvelles âmes',
    icon: User,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50'
  }
};

const PERMISSION_LABELS: Record<string, string> = {
  [PERMISSIONS.MANAGE_USERS]: 'Gestion des utilisateurs',
  [PERMISSIONS.EDIT_USERS]: 'Modification des utilisateurs',
  [PERMISSIONS.DELETE_USERS]: 'Suppression des utilisateurs',
  [PERMISSIONS.MANAGE_SOULS]: 'Gestion des âmes',
  [PERMISSIONS.MANAGE_SHEPHERDS]: 'Gestion des bergers',
  [PERMISSIONS.MANAGE_DEPARTMENTS]: 'Gestion des départements',
  [PERMISSIONS.MANAGE_FAMILIES]: 'Gestion des familles de service',
  [PERMISSIONS.MANAGE_SERVANTS]: 'Gestion des serviteurs',
  [PERMISSIONS.VIEW_STATS]: 'Visualisation des statistiques',
  [PERMISSIONS.EXPORT_DATA]: 'Export des données',
  [PERMISSIONS.MANAGE_SETTINGS]: 'Gestion des paramètres',
  [PERMISSIONS.MANAGE_BACKUP]: 'Sauvegarde et restauration',
  [PERMISSIONS.MANAGE_PROFILE]: 'Gestion du profil',
  [PERMISSIONS.MANAGE_INTERACTIONS]: 'Gestion des interactions',
  [PERMISSIONS.MANAGE_ATTENDANCES]: 'Gestion des présences',
  [PERMISSIONS.MANAGE_SMS]: 'Envoi de SMS',
  [PERMISSIONS.MANAGE_AUDIO]: 'Gestion des audios',
  [PERMISSIONS.MANAGE_SMS_TEMPLATES]: 'Gestion des modèles SMS',
  [PERMISSIONS.MANAGE_USER_MENUS]: 'Gestion des menus utilisateurs',
  [PERMISSIONS.MANAGE_ANNOUNCEMENTS]: 'Gestion des annonces',
  [PERMISSIONS.MANAGE_ROLES_PERMISSIONS]: 'Gestion des rôles et permissions',
  [PERMISSIONS.ALL]: 'Toutes les permissions'
};

export default function RolePermissionManagement() {
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  const toggleRole = (role: string) => {
    setExpandedRole(expandedRole === role ? null : role);
  };

  const getPermissionsByRole = (role: string): string[] => {
    const permissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS];
    return Array.isArray(permissions) ? permissions : [];
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center space-x-2 mb-6">
          <Shield className="w-6 h-6 text-[#00665C]" />
          <h2 className="text-xl font-semibold text-[#00665C]">
            Gestion des Rôles et Permissions
          </h2>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-800">À propos des rôles et permissions</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Cette page présente un aperçu en lecture seule des rôles définis dans le système et de leurs permissions associées.</p>
                <p className="mt-1">Les rôles et permissions sont configurés dans le code de l'application et ne peuvent pas être modifiés via cette interface.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {Object.values(ROLE_INFO).map((roleInfo) => {
            const permissions = getPermissionsByRole(roleInfo.role);
            const Icon = roleInfo.icon;
            const isExpanded = expandedRole === roleInfo.role;

            return (
              <div key={roleInfo.role} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleRole(roleInfo.role)}
                  className={`w-full p-4 ${roleInfo.bgColor} hover:opacity-80 transition-colors text-left`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-white ${roleInfo.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {roleInfo.displayName}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {roleInfo.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-500">
                        {permissions.includes(PERMISSIONS.ALL) ? 'Toutes les permissions' : `${permissions.length} permission(s)`}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 bg-white border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Permissions associées :</h4>
                    {permissions.includes(PERMISSIONS.ALL) ? (
                      <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <Star className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-purple-800">
                          Accès total - Toutes les permissions du système
                        </span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {permissions.map((permission: string) => (
                          <div
                            key={permission}
                            className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg"
                          >
                            <div className="w-2 h-2 bg-[#00665C] rounded-full"></div>
                            <span className="text-sm text-gray-700">
                              {PERMISSION_LABELS[permission] || permission}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Statistiques des rôles</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-[#00665C]">4</div>
              <div className="text-gray-600">Rôles total</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-[#00665C]">
                {Object.keys(PERMISSIONS).length - 1}
              </div>
              <div className="text-gray-600">Permissions définies</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-[#00665C]">1</div>
              <div className="text-gray-600">Rôle avec accès total</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-[#00665C]">3</div>
              <div className="text-gray-600">Rôles opérationnels</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}