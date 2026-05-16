import React, { useState, useEffect } from 'react';
import { collection, db, doc, orderBy, query, where } from '../../lib/firebase';
import { ChevronDown, Search } from 'lucide-react';
import { UserType } from '../../types/user.types';
import { validatePhoneNumber } from '../../utils/phoneValidation';
import { supabase } from '../../lib/supabase';


/** Génère les initiales (1 ou 2 lettres) depuis un nom complet */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Palette de couleurs déterministe basée sur le nom */
const AVATAR_COLORS = [
  'bg-[#00665C] text-white',
  'bg-[#F2B636] text-white',
  'bg-blue-500 text-white',
  'bg-purple-500 text-white',
  'bg-pink-500 text-white',
  'bg-indigo-500 text-white',
  'bg-teal-500 text-white',
  'bg-orange-500 text-white',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface User {
  id: string;
  fullName: string;
  phone: string;
  displayPhone: string;
  role: string;
  email: string;
}

interface UserSelectProps {
  value: string;
  onChange: (phone: string, userType: UserType) => void;
}

// Role badges intentionally removed from the login selector for privacy/cleanliness.

const getUserType = (role: string): UserType => {
  switch (role) {
    case 'super_admin':
    case 'admin':
      return 'admin';
    case 'shepherd':
      return 'shepherd';
    case 'adn':
      return 'adn';
    default:
      return null;
  }
};

export default function UserSelect({ value, onChange }: UserSelectProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Charger les utilisateurs réguliers
      const usersQuery = query(collection(db, 'users'), where('status', '==', 'active'),
        orderBy('fullName')
      const { data: usersData } = await usersQuery;
const usersData = usersData.flatMap(doc => {
        const data = doc.data();
        const phoneValidation = validatePhoneNumber(data.phone as string);
        
        if (!phoneValidation.isValid) {
          return []; // Exclure les numéros invalides
        }
        
        return [{
          id: doc.id,
          email: data.email as string,
          fullName: data.fullName as string,
          role: data.role as string,
          phone: phoneValidation.cleanNumber as string, // Utiliser le numéro nettoyé (10 chiffres)
          displayPhone: phoneValidation.formattedNumber as string, // Utiliser le numéro formaté pour l'affichage
        }];
      });

      // Charger les administrateurs
      const adminsQuery = query(collection(db, 'admins'), where('status', '==', 'active'),
        orderBy('fullName')
      const { data: adminsData } = await adminsQuery;
const adminsData = adminsData.flatMap(doc => {
        const data = doc.data();
        const phoneValidation = validatePhoneNumber(data.phone as string);
        
        if (!phoneValidation.isValid) {
          return []; // Exclure les numéros invalides
        }
        
        return [{
          id: doc.id,
          email: data.email as string,
          fullName: data.fullName as string,
          role: data.role as string,
          phone: phoneValidation.cleanNumber as string, // Utiliser le numéro nettoyé (10 chiffres)
          displayPhone: phoneValidation.formattedNumber as string, // Utiliser le numéro formaté pour l'affichage
        }];
      });

      // Déduplication des utilisateurs basée sur le numéro de téléphone
      const userMap = new Map<string, User>();
      
      // Ajouter d'abord les utilisateurs réguliers
      usersData.forEach(user => {
        userMap.set(user.phone, user);
      });
      
      // Ajouter les admins (remplacera les doublons avec priorité aux admins)
      adminsData.forEach(user => {
        userMap.set(user.phone, user);
      });
      
      const allUsers = Array.from(userMap.values()).sort((a, b) => 
        a.fullName.localeCompare(b.fullName)
      );
      
      setUsers(allUsers);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUser = users.find(u => u.phone === value);

  const handleUserSelect = (user: User) => {
    const userType = getUserType(user.role);
    onChange(user.phone, userType);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'Enter' && filteredUsers.length === 1) {
      handleUserSelect(filteredUsers[0]);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-select-container')) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleValueChange = (phone: string) => {
    const user = users.find(u => u.phone === phone);
    if (user) {
      const userType = getUserType(user.role);
      onChange(phone, userType);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="relative user-select-container">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-left focus:outline-none focus:ring-2 focus:ring-[#00665C] focus:border-[#00665C] flex items-center justify-between"
      >
        <div className="flex-1">
          {selectedUser ? (
            <div>
              <div className="font-medium text-gray-900">{selectedUser.fullName}</div>
              <div className="text-sm text-gray-500">{selectedUser.displayPhone}</div>
            </div>
          ) : (
            <span className="text-gray-500">Sélectionner un utilisateur</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#00665C] focus:border-[#00665C]"
                autoFocus
              />
            </div>
          </div>

          {/* User List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="p-3 text-center text-gray-500 text-sm">
                {searchTerm ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur disponible'}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleUserSelect(user)}
                  className="w-full text-left p-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor(user.fullName)}`}>
                      {getInitials(user.fullName)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user.fullName}</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}