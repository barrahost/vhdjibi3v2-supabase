import { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, Shield, Settings, Crown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { BusinessProfileType, BUSINESS_PROFILE_LABELS } from '../../types/businessProfile.types';

export function BusinessProfileSwitcher() {
  const { user, availableRoles, activeRole, switchRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Only show if user has multiple profiles
  if (!availableRoles || availableRoles.length <= 1) {
    return null;
  }

  const getProfileLabel = (profileType: BusinessProfileType): string => {
    return BUSINESS_PROFILE_LABELS[profileType] || profileType;
  };

  const getProfileIcon = (profileType: BusinessProfileType) => {
    switch (profileType) {
      case 'admin':
        return <Crown className="w-4 h-4" />;
      case 'department_leader':
        return <Settings className="w-4 h-4" />;
      case 'adn':
        return <Shield className="w-4 h-4" />;
      case 'shepherd':
        return <User className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const handleProfileSwitch = (profileType: BusinessProfileType) => {
    switchRole(profileType);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#00665C] transition-colors"
      >
        {getProfileIcon(activeRole as BusinessProfileType)}
        <span className="hidden sm:inline font-medium text-gray-700">
          {getProfileLabel(activeRole as BusinessProfileType)}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="py-2">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
              Profils disponibles
            </div>
            {availableRoles.map((profileType) => (
              <button
                key={profileType}
                onClick={() => handleProfileSwitch(profileType as BusinessProfileType)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-sm text-left hover:bg-gray-50 transition-colors ${
                  activeRole === profileType ? 'bg-[#00665C]/5 text-[#00665C] border-r-2 border-[#00665C]' : 'text-gray-700'
                }`}
              >
                {getProfileIcon(profileType as BusinessProfileType)}
                <div>
                  <div className="font-medium">
                    {getProfileLabel(profileType as BusinessProfileType)}
                  </div>
                  {activeRole === profileType && (
                    <div className="text-xs text-[#00665C]">Profil actuel</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}