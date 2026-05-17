import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import GeneralSettings from '../components/settings/GeneralSettings';
import UserMenuManagement from '../components/settings/UserMenuManagement';
import RolePermissionManagement from '../components/settings/RolePermissionManagement';
import SMSConfigSettings from '../components/settings/SMSConfigSettings';

type Tab = 'general' | 'sms' | 'roles-permissions' | 'user-menus';

const TABS: { id: Tab; label: string }[] = [
  { id: 'general',           label: 'Général' },
  { id: 'sms',               label: 'Configuration SMS' },
  { id: 'roles-permissions', label: 'Rôles et Permissions' },
  { id: 'user-menus',        label: 'Menus Utilisateurs' },
];

export default function Settings() {
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('general');

  if (userRole !== 'super_admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Accès réservé au super administrateur.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-1">Configuration générale de l'application</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#00665C] text-[#00665C]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu */}
      <div>
        {activeTab === 'general'           && <GeneralSettings />}
        {activeTab === 'sms'               && <SMSConfigSettings />}
        {activeTab === 'roles-permissions' && <RolePermissionManagement />}
        {activeTab === 'user-menus'        && <UserMenuManagement />}
      </div>
    </div>
  );
}
