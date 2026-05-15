import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import type { Announcement, AnnouncementLog } from '../../types/announcement.types';
import { Megaphone, History, Save, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import toast from 'react-hot-toast';

const MAX_CONTENT_LENGTH = 500;

export default function AnnouncementManagement() {
  const { user, userRole } = useAuth();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [logs, setLogs] = useState<AnnouncementLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole !== 'super_admin') {
      toast.error('Accès non autorisé');
      return;
    }
    
    const loadInitialData = async () => {
      try {
        // Vérifier si une annonce existe déjà
        const announcementsRef = collection(db, 'announcements');
        const defaultDoc = doc(announcementsRef, 'default');
        try {
          const snapshot = await getDoc(defaultDoc);
          
          if (!snapshot.exists()) {
          // Créer l'annonce par défaut si elle n'existe pas
          const defaultAnnouncement = {
            id: 'default',
            title: 'Annonce par défaut',
            content: 'Bienvenue sur CHAD3',
            isActive: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: user?.uid || 'system',
            updatedBy: user?.uid || 'system'
          };

          await setDoc(defaultDoc, defaultAnnouncement);
          setAnnouncement(defaultAnnouncement);
          setEditedContent(defaultAnnouncement.content);
          } else {
          const data = snapshot.data() as Announcement;
          setAnnouncement({ ...data, id: snapshot.id });
          setEditedContent(data.content || '');
          }
        } catch (error) {
          console.error('Error loading announcement:', error);
          // Créer l'annonce par défaut en cas d'erreur
          const defaultAnnouncement = {
            id: 'default',
            title: 'Annonce par défaut',
            content: 'Bienvenue sur CHAD3',
            isActive: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: user?.uid || 'system',
            updatedBy: user?.uid || 'system'
          };

          await setDoc(defaultDoc, defaultAnnouncement);
          setAnnouncement(defaultAnnouncement);
          setEditedContent(defaultAnnouncement.content);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading announcement:', error);
        toast.error('Erreur lors du chargement de l\'annonce');
        setLoading(false);
      }
    };

    loadInitialData();

    // Charger les logs
    const unsubscribeLogs = onSnapshot(
      query(collection(db, 'announcementLogs'), orderBy('timestamp', 'desc')),
      (snapshot) => {
        setLogs(snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AnnouncementLog[]);
      }
    );

    return () => {
      unsubscribeLogs();
    };
  }, [userRole]);

  const handleToggle = async () => {
    if (!announcement || !user) return;

    const docRef = doc(db, 'announcements', 'default');

    try {
      const newStatus = !announcement.isActive;

      // Mettre à jour le statut de l'annonce
      await updateDoc(docRef, {
        isActive: newStatus,
        updatedAt: new Date(),
        updatedBy: user.uid
      });

      // Mettre à jour l'état local
      setAnnouncement(prev => prev ? {
        ...prev,
        isActive: newStatus,
        updatedAt: new Date(),
        updatedBy: user.uid
      } : null);

      // Créer un log
      const logData = {
        announcementId: announcement.id,
        action: 'toggle',
        previousStatus: announcement.isActive,
        newStatus,
        timestamp: new Date(),
        userId: user.uid,
        userFullName: (await getDoc(doc(db, 'admins', user.uid))).data()?.fullName || 'Unknown'
      };

      await addDoc(collection(db, 'announcementLogs'), logData);

      toast.success(`Annonce ${newStatus ? 'activée' : 'désactivée'}`);
    } catch (error) {
      console.error('Error toggling announcement:', error);
      toast.error('Erreur lors de la modification du statut');
    }
  };

  const handleSave = async () => {
    if (!announcement || !user) return;

    const docRef = doc(db, 'announcements', 'default');

    try {
      if (editedContent.length > MAX_CONTENT_LENGTH) {
        toast.error(`Le contenu ne doit pas dépasser ${MAX_CONTENT_LENGTH} caractères`);
        return;
      }

      const previousContent = announcement.content;

      // Mettre à jour le contenu de l'annonce
      await updateDoc(docRef, {
        content: editedContent.trim(),
        updatedAt: new Date(),
        updatedBy: user.uid
      });

      // Mettre à jour l'état local
      setAnnouncement(prev => prev ? {
        ...prev,
        content: editedContent.trim(),
        updatedAt: new Date(),
        updatedBy: user.uid
      } : null);

      // Créer un log
      const logData = {
        announcementId: announcement.id,
        action: 'update',
        previousContent,
        newContent: editedContent.trim(),
        timestamp: new Date(),
        userId: user.uid,
        userFullName: (await getDoc(doc(db, 'admins', user.uid))).data()?.fullName || 'Unknown'
      };

      await addDoc(collection(db, 'announcementLogs'), logData);

      setIsEditing(false);
      toast.success('Annonce mise à jour avec succès');
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (userRole !== 'super_admin') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Megaphone className="w-5 h-5 text-[#00665C]" />
            <h2 className="text-lg font-semibold text-[#00665C]">
              Gestion des Annonces
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowLogs(true)}
              className="flex items-center px-3 py-1.5 text-sm text-[#00665C] hover:bg-[#00665C]/10 rounded-md"
            >
              <History className="w-4 h-4 mr-1.5" />
              Historique
            </button>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={announcement?.isActive}
                  onChange={handleToggle}
                />
                <div className={`block w-14 h-8 rounded-full transition-colors ${
                  announcement?.isActive ? 'bg-[#00665C]' : 'bg-gray-300'
                }`} />
                <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform transform ${
                  announcement?.isActive ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {announcement?.isActive ? 'Activée' : 'Désactivée'}
              </span>
            </label>
          </div>
        </div>

        <div className="space-y-4">
          {isEditing ? (
            <>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={6}
                maxLength={MAX_CONTENT_LENGTH}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
                placeholder="Contenu de l'annonce..."
              />
              <div className="flex justify-between items-center">
                <span className={`text-sm ${
                  editedContent.length > MAX_CONTENT_LENGTH 
                    ? 'text-red-500' 
                    : 'text-gray-500'
                }`}>
                  {editedContent.length}/{MAX_CONTENT_LENGTH} caractères
                </span>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setEditedContent(announcement?.content ?? '');
                      setIsEditing(false);
                    }}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <X className="w-4 h-4 mr-1.5" />
                    Annuler
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center px-3 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md"
                  >
                    <Save className="w-4 h-4 mr-1.5" />
                    Enregistrer
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="relative">
              <div className="p-4 bg-gray-50 rounded-lg border">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {announcement?.content || 'Aucun contenu'}
                </p>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="absolute top-2 right-2 p-1.5 text-gray-500 hover:text-[#00665C] hover:bg-white rounded-md"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal d'historique */}
      <Modal
        isOpen={showLogs}
        onClose={() => setShowLogs(false)}
        title="Historique des modifications"
      >
        <div className="p-6">
          <div className="space-y-4">
            {logs.length === 0 ? (
              <p className="text-center text-gray-500">
                Aucune modification enregistrée
              </p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="border-b pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-medium text-gray-900">
                        {log.userFullName}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      log.action === 'create'
                        ? 'bg-green-100 text-green-800'
                        : log.action === 'update'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {log.action === 'create'
                        ? 'Création'
                        : log.action === 'update'
                        ? 'Modification'
                        : 'Changement de statut'}
                    </span>
                  </div>
                  {log.action === 'update' && (
                    <div className="mt-2 text-sm">
                      <div className="bg-red-50 p-2 rounded mb-2">
                        <p className="text-red-700">- {log.previousContent}</p>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <p className="text-green-700">+ {log.newContent}</p>
                      </div>
                    </div>
                  )}
                  {log.action === 'toggle' && (
                    <p className="text-sm text-gray-600">
                      Statut changé de{' '}
                      <span className={log.previousStatus ? 'text-green-600' : 'text-red-600'}>
                        {log.previousStatus ? 'actif' : 'inactif'}
                      </span>
                      {' '}à{' '}
                      <span className={log.newStatus ? 'text-green-600' : 'text-red-600'}>
                        {log.newStatus ? 'actif' : 'inactif'}
                      </span>
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}