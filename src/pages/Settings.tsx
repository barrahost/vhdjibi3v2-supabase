import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UserMenuManagement from '../components/settings/UserMenuManagement';
import RolePermissionManagement from '../components/settings/RolePermissionManagement';

export default function Settings() {
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'user-menus' | 'roles-permissions'>('roles-permissions');
  const isSuperAdmin = userRole === 'super_admin';

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Accès réservé au super administrateur.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('roles-permissions')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'roles-permissions'
                ? 'bg-[#00665C] text-white'
                : 'text-gray-700 bg-white border border-gray-300'
            }`}
          >
            Rôles et Permissions
          </button>
          <button
            onClick={() => setActiveTab('user-menus')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'user-menus'
                ? 'bg-[#00665C] text-white'
                : 'text-gray-700 bg-white border border-gray-300'
            }`}
          >
            Menus Utilisateurs
          </button>
        </div>
      </div>

      {activeTab === 'roles-permissions' && <RolePermissionManagement />}
      {activeTab === 'user-menus' && <UserMenuManagement />}
    </div>
  );
}
