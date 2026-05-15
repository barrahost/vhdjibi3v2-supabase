import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Search, Save } from 'lucide-react';
import { MenuAssignment } from '../users/MenuAssignment';
import { isShepherdUser, isInternUser } from '../../utils/roleHelpers';
import toast from 'react-hot-toast';

export default function UserMenuManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedMenus, setSelectedMenus] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Charger tous les utilisateurs actifs puis filtrer côté client
        // pour inclure les bergers/stagiaires multi-casquettes
        const usersQuery = query(
          collection(db, 'users'),
          where('status', '==', 'active')
        );
        
        const snapshot = await getDocs(usersQuery);
        const usersData = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            additionalMenus: doc.data().additionalMenus || []
          }))
          .filter((u: any) => isShepherdUser(u));
        
        setUsers(usersData);
        setFilteredUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Erreur lors du chargement des utilisateurs');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search term
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const handleUserSelect = (user: any) => {
    setSelectedUser(user);
    setSelectedMenus(user.additionalMenus || []);
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    
    try {
      setSaving(true);
      
      // Update the user document
      const userRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userRef, {
        additionalMenus: selectedMenus,
        updatedAt: new Date()
      });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, additionalMenus: selectedMenus }
          : user
      ));
      
      toast.success('Menus mis à jour avec succès');
    } catch (error) {
      console.error('Error updating user menus:', error);
      toast.error('Erreur lors de la mise à jour des menus');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Chargement des utilisateurs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-[#00665C] mb-4">Gestion des Menus Utilisateurs</h2>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">À propos de cette fonctionnalité</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Cette page vous permet d'attribuer des menus additionnels aux bergers et stagiaires.</p>
                <p className="mt-1">Les menus additionnels s'ajoutent aux menus existants de l'utilisateur sans les remplacer.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User selection */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3">Sélectionner un utilisateur</h3>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
              />
            </div>
            
            <div className="border border-gray-200 rounded-md overflow-hidden max-h-96 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Aucun utilisateur trouvé
                </div>
              ) : (
                <div className="divide-y">
                  {filteredUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                        selectedUser?.id === user.id ? 'bg-[#00665C]/10' : ''
                      }`}
                    >
                      <div className="font-medium text-gray-900">{user.fullName}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {isInternUser(user) ? 'Stagiaire' : 'Berger(e)'}
                        {user.additionalMenus?.length > 0 && ` • ${user.additionalMenus.length} menu(s) additionnel(s)`}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Menu assignment */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3">Menus additionnels</h3>
            
            {selectedUser ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <div className="font-medium text-gray-900">{selectedUser.fullName}</div>
                  <div className="text-sm text-gray-500">{selectedUser.email}</div>
                </div>
                
                <MenuAssignment
                  selectedMenus={selectedMenus}
                  onChange={setSelectedMenus}
                />
                
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00665C] disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Enregistrement...' : 'Enregistrer les menus'}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 border border-gray-200 rounded-md bg-gray-50">
                <p className="text-gray-500">Sélectionnez un utilisateur pour gérer ses menus</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}