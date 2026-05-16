import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { Announcement, AnnouncementLog } from '../../types/announcement.types';
import { Megaphone, History, Save, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

const MAX_CONTENT_LENGTH = 500;

function rowToAnnouncement(row: any): Announcement {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    isActive: row.is_active,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  } as Announcement;
}

function rowToLog(row: any): AnnouncementLog {
  return {
    id: row.id,
    announcementId: row.announcement_id,
    action: row.action,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    previousContent: row.previous_content,
    newContent: row.new_content,
    timestamp: row.timestamp ? new Date(row.timestamp) : new Date(),
    userId: row.user_id,
    userFullName: row.user_full_name,
  } as AnnouncementLog;
}

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
        // Load or create the default announcement
        const { data: existing } = await supabase
          .from('announcements')
          .select('*')
          .eq('id', 'default')
          .single();

        if (existing) {
          const ann = rowToAnnouncement(existing);
          setAnnouncement(ann);
          setEditedContent(ann.content || '');
        } else {
          // Create default announcement
          const defaultAnnouncement = {
            id: 'default',
            title: 'Annonce par défaut',
            content: 'Bienvenue sur CHAD3',
            is_active: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: user?.uid || 'system',
            updated_by: user?.uid || 'system',
          };
          const { error } = await supabase.from('announcements').upsert(defaultAnnouncement, { onConflict: 'id' });
          if (!error) {
            setAnnouncement(rowToAnnouncement(defaultAnnouncement));
            setEditedContent(defaultAnnouncement.content);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading announcement:', error);
        toast.error("Erreur lors du chargement de l'annonce");
        setLoading(false);
      }
    };

    loadInitialData();

    // Real-time logs subscription
    const channel = supabase
      .channel('announcement-logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcement_logs' }, async () => {
        const { data } = await supabase
          .from('announcement_logs')
          .select('*')
          .order('timestamp', { ascending: false });
        setLogs((data ?? []).map(rowToLog));
      })
      .subscribe();

    // Initial load of logs
    supabase
      .from('announcement_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .then(({ data }) => setLogs((data ?? []).map(rowToLog)));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userRole]);

  const getUserFullName = async (): Promise<string> => {
    if (!user?.uid) return 'Unknown';
    const { data } = await supabase
      .from('admins')
      .select('full_name')
      .eq('id', user.uid)
      .single();
    return data?.full_name || 'Unknown';
  };

  const handleToggle = async () => {
    if (!announcement || !user) return;

    try {
      const newStatus = !announcement.isActive;
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('announcements')
        .update({ is_active: newStatus, updated_at: now, updated_by: user.uid })
        .eq('id', 'default');
      if (error) throw error;

      setAnnouncement(prev => prev ? { ...prev, isActive: newStatus, updatedAt: new Date(), updatedBy: user.uid } : null);

      const userFullName = await getUserFullName();
      await supabase.from('announcement_logs').insert({
        id: crypto.randomUUID(),
        announcement_id: announcement.id,
        action: 'toggle',
        previous_status: announcement.isActive,
        new_status: newStatus,
        timestamp: now,
        user_id: user.uid,
        user_full_name: userFullName,
      });

      toast.success(`Annonce ${newStatus ? 'activée' : 'désactivée'}`);
    } catch (error) {
      console.error('Error toggling announcement:', error);
      toast.error('Erreur lors de la modification du statut');
    }
  };

  const handleSave = async () => {
    if (!announcement || !user) return;

    try {
      if (editedContent.length > MAX_CONTENT_LENGTH) {
        toast.error(`Le contenu ne doit pas dépasser ${MAX_CONTENT_LENGTH} caractères`);
        return;
      }

      const previousContent = announcement.content;
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('announcements')
        .update({ content: editedContent.trim(), updated_at: now, updated_by: user.uid })
        .eq('id', 'default');
      if (error) throw error;

      setAnnouncement(prev => prev ? { ...prev, content: editedContent.trim(), updatedAt: new Date(), updatedBy: user.uid } : null);

      const userFullName = await getUserFullName();
      await supabase.from('announcement_logs').insert({
        id: crypto.randomUUID(),
        announcement_id: announcement.id,
        action: 'update',
        previous_content: previousContent,
        new_content: editedContent.trim(),
        timestamp: now,
        user_id: user.uid,
        user_full_name: userFullName,
      });

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
            <h2 className="text-lg font-semibold text-[#00665C]">Gestion des Annonces</h2>
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
                <div className={`block w-14 h-8 rounded-full transition-colors ${announcement?.isActive ? 'bg-[#00665C]' : 'bg-gray-300'}`} />
                <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform transform ${announcement?.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
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
                <span className={`text-sm ${editedContent.length > MAX_CONTENT_LENGTH ? 'text-red-500' : 'text-gray-500'}`}>
                  {editedContent.length}/{MAX_CONTENT_LENGTH} caractères
                </span>
                <div className="flex space-x-3">
                  <button
                    onClick={() => { setEditedContent(announcement?.content ?? ''); setIsEditing(false); }}
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
                <p className="text-gray-700 whitespace-pre-wrap">{announcement?.content || 'Aucun contenu'}</p>
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

      <Modal isOpen={showLogs} onClose={() => setShowLogs(false)} title="Historique des modifications">
        <div className="p-6">
          <div className="space-y-4">
            {logs.length === 0 ? (
              <p className="text-center text-gray-500">Aucune modification enregistrée</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="border-b pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-medium text-gray-900">{log.userFullName}</span>
                      <span className="text-sm text-gray-500 ml-2">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      log.action === 'create' ? 'bg-green-100 text-green-800' :
                      log.action === 'update' ? 'bg-blue-100 text-blue-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {log.action === 'create' ? 'Création' : log.action === 'update' ? 'Modification' : 'Changement de statut'}
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
