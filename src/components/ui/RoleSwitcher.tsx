import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronDown, UserCheck } from 'lucide-react';
import { BaseRole } from '../../types/permission.types';

export function RoleSwitcher() {
  const { availableRoles, activeRole, switchRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Don't show if user has only one role
  if (availableRoles.length <= 1) {
    return null;
  }

  const getRoleLabel = (role: BaseRole) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Administrateur';
      case 'shepherd': return 'Berger(e)';
      case 'adn': return 'ADN';
      case 'department_leader': return 'Responsable Département';
      default: return 'Utilisateur';
    }
  };

  const getRoleIcon = (role: BaseRole) => {
    switch (role) {
      case 'super_admin': return '👑';
      case 'admin': return '⚙️';
      case 'shepherd': return '🐑';
      case 'adn': return '📊';
      case 'department_leader': return '👨‍💼';
      default: return '👤';
    }
  };

  const handleRoleSwitch = (role: BaseRole) => {
    switchRole(role);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
      >
        <UserCheck className="w-4 h-4" />
        <span>{getRoleIcon(activeRole!)} {getRoleLabel(activeRole!)}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Overlay to close dropdown when clicking outside */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
              Changer de rôle
            </div>
            {availableRoles.map((role) => (
              <button
                key={role}
                onClick={() => handleRoleSwitch(role)}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                  role === activeRole ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{getRoleIcon(role)}</span>
                <span className="flex-1">{getRoleLabel(role)}</span>
                {role === activeRole && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}