import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { AcademieService } from '../services/academie.service';
import { getProfileClassIds } from '../types/businessProfile.types';
import type { AcademieClass, AcademieSession, AcademieResource, AcademieAssignment, AcademieResourceType } from '../types/academie.types';
import { resourceUrl } from '../types/academie.types';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Plus, Trash2, ChevronDown, ChevronUp, FileText, PlayCircle, Link as LinkIcon } from 'lucide-react';

export default function AcademieModerator() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const isAdmin = hasPermission('*');

  const [classes, setClasses] = useState<AcademieClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [sessions, setSessions] = useState<AcademieSession[]>([]);
  const [resources, setResources] = useState<Record<string, AcademieResource[]>>({});
  const [assignments, setAssignments] = useState<Record<string, AcademieAssignment[]>>({});
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [newResource, setNewResource] = useState({ type: 'audio' as AcademieResourceType, title: '', r2Key: '', url: '' });
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', dueDate: '' });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const allClasses = await AcademieService.getClasses();
        let myClassIds: string[] | null = null;
        if (!isAdmin) {
          const moderatorProfile = (user?.businessProfiles as any[])?.find(p => p.type === 'academie_moderator');
          myClassIds = getProfileClassIds(moderatorProfile);
        }
        const visible = myClassIds ? allClasses.filter(c => myClassIds!.includes(c.id)) : allClasses;
        setClasses(visible);
        if (visible.length > 0) setSelectedClassId(visible[0].id);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, isAdmin]);

  const loadSessions = async (classId: string) => {
    if (!classId) return;
    const s = await AcademieService.getSessionsByClass(classId);
    setSessions(s);
    const sessionIds = s.map(x => x.id);
    const [res, asg] = await Promise.all([
      AcademieService.getResourcesBySessions(sessionIds),
      AcademieService.getAssignmentsBySessions(sessionIds),
    ]);
    const resMap: Record<string, AcademieResource[]> = {};
    res.forEach(r => { (resMap[r.sessionId] ||= []).push(r); });
    setResources(resMap);
    const asgMap: Record<string, AcademieAssignment[]> = {};
    asg.forEach(a => { (asgMap[a.sessionId] ||= []).push(a); });
    setAssignments(asgMap);
  };

  useEffect(() => { loadSessions(selectedClassId); }, [selectedClassId]);

  const togglePublish = async (session: AcademieSession) => {
    try {
      await AcademieService.setSessionPublished(session.id, !session.isPublished);
      setSessions(prev => prev.map(s => s.id === session.id ? { ...s, isPublished: !s.isPublished } : s));
      toast.success(!session.isPublished ? 'Séance publiée' : 'Séance masquée');
    } catch {
      toast.error('Erreur');
    }
  };

  const handleAddResource = async (sessionId: string) => {
    if (!newResource.title.trim()) { toast.error('Titre obligatoire'); return; }
    if (newResource.type === 'link' && !newResource.url.trim()) { toast.error('URL obligatoire pour un lien'); return; }
    if (newResource.type !== 'link' && !newResource.r2Key.trim()) { toast.error('Clé R2 obligatoire'); return; }
    try {
      await AcademieService.addResource({
        sessionId, type: newResource.type, title: newResource.title.trim(),
        r2Key: newResource.type !== 'link' ? newResource.r2Key.trim() : undefined,
        url: newResource.type === 'link' ? newResource.url.trim() : undefined,
      });
      toast.success('Ressource ajoutée');
      setNewResource({ type: 'audio', title: '', r2Key: '', url: '' });
      loadSessions(selectedClassId);
    } catch {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleDeleteResource = async (id: string) => {
    try {
      await AcademieService.deleteResource(id);
      loadSessions(selectedClassId);
    } catch {
      toast.error('Erreur');
    }
  };

  const handleAddAssignment = async (sessionId: string) => {
    if (!newAssignment.title.trim()) { toast.error('Titre obligatoire'); return; }
    try {
      await AcademieService.addAssignment({
        sessionId, title: newAssignment.title.trim(),
        description: newAssignment.description.trim() || undefined,
        dueDate: newAssignment.dueDate || undefined,
      });
      toast.success('Devoir ajouté');
      setNewAssignment({ title: '', description: '', dueDate: '' });
      loadSessions(selectedClassId);
    } catch {
      toast.error('Erreur');
    }
  };

  const toggleAssignmentPublish = async (a: AcademieAssignment) => {
    try {
      await AcademieService.setAssignmentPublished(a.id, !a.isPublished);
      loadSessions(selectedClassId);
    } catch {
      toast.error('Erreur');
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Chargement...</div>;

  if (classes.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center text-sm text-amber-800">
        Aucune classe assignée à votre profil de modérateur.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Classe :</label>
        <select
          value={selectedClassId}
          onChange={e => setSelectedClassId(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="bg-white border rounded-lg divide-y">
        {sessions.sort((a, b) => a.weekNumber - b.weekNumber).map(session => {
          const isOpen = openSessionId === session.id;
          const sessionResources = resources[session.id] || [];
          const sessionAssignments = assignments[session.id] || [];
          return (
            <div key={session.id}>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <button type="button" onClick={() => setOpenSessionId(isOpen ? null : session.id)} className="flex-1 min-w-0 text-left flex items-center gap-2">
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                  <div className="min-w-0">
                    <div className="text-xs text-gray-400">Semaine {session.weekNumber}</div>
                    <div className="font-medium text-gray-900 truncate">{session.theme}</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => togglePublish(session)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md flex-shrink-0 ${
                    session.isPublished ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  {session.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {session.isPublished ? 'Publié' : 'Masqué'}
                </button>
              </div>

              {isOpen && (
                <div className="px-4 pb-4 space-y-4 bg-gray-50/50">
                  {/* Ressources existantes */}
                  <div className="space-y-1.5">
                    {sessionResources.map(r => (
                      <div key={r.id} className="flex items-center gap-2 bg-white border rounded-md px-3 py-2">
                        {r.type === 'pdf' ? <FileText className="w-4 h-4 text-brand-700" /> : r.type === 'link' ? <LinkIcon className="w-4 h-4 text-brand-700" /> : <PlayCircle className="w-4 h-4 text-brand-700" />}
                        <span className="text-sm flex-1 truncate">{r.title}</span>
                        <a href={resourceUrl(r)} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-700 underline">voir</a>
                        <button type="button" onClick={() => handleDeleteResource(r.id)} className="p-1 rounded text-red-500 hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Ajouter une ressource */}
                  <div className="bg-white border rounded-md p-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Ajouter une ressource</p>
                    <div className="flex flex-wrap gap-2">
                      <select
                        value={newResource.type}
                        onChange={e => setNewResource(prev => ({ ...prev, type: e.target.value as AcademieResourceType }))}
                        className="px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="audio">Audio</option>
                        <option value="video">Vidéo</option>
                        <option value="pdf">PDF</option>
                        <option value="link">Lien externe</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Titre"
                        value={newResource.title}
                        onChange={e => setNewResource(prev => ({ ...prev, title: e.target.value }))}
                        className="px-2 py-1.5 border border-gray-300 rounded-md text-sm flex-1 min-w-[140px]"
                      />
                      {newResource.type === 'link' ? (
                        <input
                          type="text"
                          placeholder="https://..."
                          value={newResource.url}
                          onChange={e => setNewResource(prev => ({ ...prev, url: e.target.value }))}
                          className="px-2 py-1.5 border border-gray-300 rounded-md text-sm flex-1 min-w-[160px]"
                        />
                      ) : (
                        <input
                          type="text"
                          placeholder="Clé R2 (ex: audio/classe-1/...)"
                          value={newResource.r2Key}
                          onChange={e => setNewResource(prev => ({ ...prev, r2Key: e.target.value }))}
                          className="px-2 py-1.5 border border-gray-300 rounded-md text-sm flex-1 min-w-[220px]"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => handleAddResource(session.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-brand-700 text-white text-sm rounded-md hover:bg-brand-800"
                      >
                        <Plus className="w-3.5 h-3.5" /> Ajouter
                      </button>
                    </div>
                  </div>

                  {/* Devoirs existants */}
                  {sessionAssignments.length > 0 && (
                    <div className="space-y-1.5">
                      {sessionAssignments.map(a => (
                        <div key={a.id} className="flex items-center gap-2 bg-white border border-amber-200 rounded-md px-3 py-2">
                          <span className="text-sm flex-1 truncate">{a.title}</span>
                          <button
                            type="button"
                            onClick={() => toggleAssignmentPublish(a)}
                            className={`text-xs px-2 py-1 rounded font-medium ${a.isPublished ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                          >
                            {a.isPublished ? 'Publié' : 'Masqué'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Ajouter un devoir */}
                  <div className="bg-white border rounded-md p-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Ajouter un devoir</p>
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="text"
                        placeholder="Titre du devoir"
                        value={newAssignment.title}
                        onChange={e => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                        className="px-2 py-1.5 border border-gray-300 rounded-md text-sm flex-1 min-w-[160px]"
                      />
                      <input
                        type="date"
                        value={newAssignment.dueDate}
                        onChange={e => setNewAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
                        className="px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddAssignment(session.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-brand-700 text-white text-sm rounded-md hover:bg-brand-800"
                      >
                        <Plus className="w-3.5 h-3.5" /> Ajouter
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
