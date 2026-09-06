import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { AcademieService } from '../services/academie.service';
import { getProfileClassIds } from '../types/businessProfile.types';
import type { AcademieClass, AcademieSession, AcademieResource, AcademieAssignment, AcademieResourceType } from '../types/academie.types';
import { resourceUrl } from '../types/academie.types';
import { AcademieMediaService, classNameToPrefix, friendlyNameFromKey, humanFileSize, sanitizeFileName, readMediaDuration, type AcademieMediaObject } from '../services/academieMedia.service';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Plus, Trash2, ChevronDown, ChevronUp, FileText, PlayCircle, Link as LinkIcon, FolderOpen, UploadCloud, Globe, Loader2, CheckCircle2, Pencil, Save, X, Clock } from 'lucide-react';

/** Devine le type de ressource depuis l'extension d'un nom de fichier. */
function guessTypeFromName(name: string): AcademieResourceType {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'video';
  if (['pdf'].includes(ext)) return 'pdf';
  return 'audio';
}

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

  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', dueDate: '' });

  // Ajout de ressource : 3 modes explicites pour un moderateur non technique
  const [resourceMode, setResourceMode] = useState<'existing' | 'upload' | 'link'>('existing');
  const [resourceTitle, setResourceTitle] = useState('');
  const [existingFiles, setExistingFiles] = useState<AcademieMediaObject[] | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedExistingKey, setSelectedExistingKey] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [linkUrl, setLinkUrl] = useState('');

  const resetResourceForm = () => {
    setResourceTitle(''); setSelectedExistingKey(''); setUploadFile(null); setUploadProgress(null); setLinkUrl('');
  };

  // Edition des informations d'une seance (semaine, section, theme, objectifs, moderateur, date)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ weekNumber: '', section: '', theme: '', objectives: '', moderatorName: '', sessionDate: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  const startEditSession = (s: AcademieSession) => {
    setEditingSessionId(s.id);
    setEditForm({
      weekNumber: String(s.weekNumber), section: s.section || '', theme: s.theme,
      objectives: s.objectives || '', moderatorName: s.moderatorName || '', sessionDate: s.sessionDate || '',
    });
  };

  const saveEditSession = async (sessionId: string) => {
    if (!editForm.theme.trim()) { toast.error('Le thème est obligatoire'); return; }
    const weekNumber = parseInt(editForm.weekNumber, 10);
    if (!Number.isFinite(weekNumber) || weekNumber < 1) { toast.error('Numéro de semaine invalide'); return; }
    try {
      setSavingEdit(true);
      await AcademieService.updateSession(sessionId, {
        weekNumber, section: editForm.section.trim(), theme: editForm.theme.trim(),
        objectives: editForm.objectives.trim(), moderatorName: editForm.moderatorName.trim(),
        sessionDate: editForm.sessionDate,
      });
      toast.success('Informations mises à jour');
      setEditingSessionId(null);
      loadSessions(selectedClassId);
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSavingEdit(false);
    }
  };

  // Nouvelle seance
  const [showNewSession, setShowNewSession] = useState(false);
  const [newSessionForm, setNewSessionForm] = useState({ weekNumber: '', section: '', theme: '', objectives: '', moderatorName: '', sessionDate: '' });

  const handleCreateSession = async () => {
    if (!newSessionForm.theme.trim()) { toast.error('Le thème est obligatoire'); return; }
    const weekNumber = parseInt(newSessionForm.weekNumber, 10);
    if (!Number.isFinite(weekNumber) || weekNumber < 1) { toast.error('Numéro de semaine invalide'); return; }
    try {
      await AcademieService.createSession({
        classId: selectedClassId, weekNumber, section: newSessionForm.section.trim(),
        theme: newSessionForm.theme.trim(), objectives: newSessionForm.objectives.trim(),
        moderatorName: newSessionForm.moderatorName.trim(), sessionDate: newSessionForm.sessionDate,
      });
      toast.success('Séance créée');
      setNewSessionForm({ weekNumber: '', section: '', theme: '', objectives: '', moderatorName: '', sessionDate: '' });
      setShowNewSession(false);
      loadSessions(selectedClassId);
    } catch {
      toast.error('Erreur lors de la création');
    }
  };

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

  useEffect(() => { loadSessions(selectedClassId); setExistingFiles(null); }, [selectedClassId]);

  useEffect(() => {
    if (openSessionId && resourceMode === 'existing' && existingFiles === null) {
      loadExistingFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSessionId, resourceMode, existingFiles]);

  const togglePublish = async (session: AcademieSession) => {
    try {
      await AcademieService.setSessionPublished(session.id, !session.isPublished);
      setSessions(prev => prev.map(s => s.id === session.id ? { ...s, isPublished: !s.isPublished } : s));
      toast.success(!session.isPublished ? 'Séance publiée' : 'Séance masquée');
    } catch {
      toast.error('Erreur');
    }
  };

  const currentClass = classes.find(c => c.id === selectedClassId);

  const loadExistingFiles = async () => {
    if (!currentClass) return;
    try {
      setLoadingFiles(true);
      const files = await AcademieMediaService.listFiles(classNameToPrefix(currentClass.name));
      setExistingFiles(files);
    } catch {
      toast.error('Impossible de charger la liste des fichiers déjà en ligne');
      setExistingFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleAddResource = async (sessionId: string) => {
    if (!resourceTitle.trim()) { toast.error('Donnez un titre à cette ressource'); return; }

    try {
      let publicUrl: string | null = null;
      let mediaType: AcademieResourceType = 'link';

      if (resourceMode === 'link') {
        if (!linkUrl.trim()) { toast.error('Collez le lien (URL) à ajouter'); return; }
        await AcademieService.addResource({ sessionId, type: 'link', title: resourceTitle.trim(), url: linkUrl.trim() });
      } else if (resourceMode === 'existing') {
        if (!selectedExistingKey) { toast.error('Choisissez un fichier dans la liste'); return; }
        mediaType = guessTypeFromName(selectedExistingKey);
        publicUrl = (existingFiles || []).find(f => f.key === selectedExistingKey)?.url || null;
        await AcademieService.addResource({
          sessionId, type: mediaType, title: resourceTitle.trim(), r2Key: selectedExistingKey,
        });
      } else {
        if (!uploadFile) { toast.error('Choisissez un fichier à envoyer depuis votre appareil'); return; }
        const prefix = currentClass ? classNameToPrefix(currentClass.name) : 'audio/divers/';
        const r2Key = `${prefix}${Date.now()}-${sanitizeFileName(uploadFile.name)}`;
        mediaType = guessTypeFromName(uploadFile.name);
        setUploadProgress(0);
        const uploaded = await AcademieMediaService.uploadFile(uploadFile, r2Key, setUploadProgress);
        publicUrl = uploaded.publicUrl;
        await AcademieService.addResource({
          sessionId, type: mediaType, title: resourceTitle.trim(), r2Key,
        });
      }

      // Duree : calculee automatiquement a partir du fichier audio/video, pas saisie a la main
      if (publicUrl && (mediaType === 'audio' || mediaType === 'video')) {
        readMediaDuration(publicUrl, mediaType).then(duration => {
          if (duration) {
            AcademieService.updateSession(sessionId, { duration }).then(() => loadSessions(selectedClassId));
          }
        });
      }

      toast.success('Ressource ajoutée avec succès');
      resetResourceForm();
      setExistingFiles(null);
      loadSessions(selectedClassId);
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de l\'ajout de la ressource');
    } finally {
      setUploadProgress(null);
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
      <div className="flex items-center justify-between gap-3 flex-wrap">
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
        <button
          type="button"
          onClick={() => setShowNewSession(v => !v)}
          className="flex items-center gap-1.5 px-3 py-2 bg-brand-700 text-white text-sm font-medium rounded-md hover:bg-brand-800"
        >
          <Plus className="w-4 h-4" /> Nouvelle séance
        </button>
      </div>

      {showNewSession && (
        <div className="bg-white border-2 border-brand-700/20 rounded-lg p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-900">Créer une nouvelle séance pour {currentClass?.name}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Numéro de semaine *</label>
              <input type="number" min={1} value={newSessionForm.weekNumber} onChange={e => setNewSessionForm(p => ({ ...p, weekNumber: e.target.value }))} className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Section (ex : I, II, Exp., Fin...)</label>
              <input type="text" value={newSessionForm.section} onChange={e => setNewSessionForm(p => ({ ...p, section: e.target.value }))} className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Thème *</label>
              <input type="text" value={newSessionForm.theme} onChange={e => setNewSessionForm(p => ({ ...p, theme: e.target.value }))} className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Objectifs / Contenu</label>
              <textarea rows={2} value={newSessionForm.objectives} onChange={e => setNewSessionForm(p => ({ ...p, objectives: e.target.value }))} className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Modérateur assigné</label>
              <input type="text" value={newSessionForm.moderatorName} onChange={e => setNewSessionForm(p => ({ ...p, moderatorName: e.target.value }))} className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
              <input type="date" value={newSessionForm.sessionDate} onChange={e => setNewSessionForm(p => ({ ...p, sessionDate: e.target.value }))} className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleCreateSession} className="flex items-center gap-1.5 px-4 py-2 bg-brand-700 text-white text-sm font-medium rounded-md hover:bg-brand-800">
              <CheckCircle2 className="w-4 h-4" /> Créer la séance
            </button>
            <button type="button" onClick={() => setShowNewSession(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">Annuler</button>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-lg divide-y">
        {sessions.sort((a, b) => a.weekNumber - b.weekNumber).map(session => {
          const isOpen = openSessionId === session.id;
          const sessionResources = resources[session.id] || [];
          const sessionAssignments = assignments[session.id] || [];
          return (
            <div key={session.id}>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <button type="button" onClick={() => { setOpenSessionId(isOpen ? null : session.id); resetResourceForm(); }} className="flex-1 min-w-0 text-left flex items-center gap-2">
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                  <div className="min-w-0">
                    <div className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                      <span>Semaine {session.weekNumber}{session.section ? ` · Section ${session.section}` : ''}</span>
                      {session.sessionDate && <span>· {new Date(session.sessionDate).toLocaleDateString('fr-FR')}</span>}
                      {session.duration && <span className="inline-flex items-center gap-0.5"><Clock className="w-3 h-3" /> {session.duration}</span>}
                    </div>
                    <div className="font-medium text-gray-900 truncate">{session.theme}</div>
                    {session.moderatorName && <div className="text-xs text-gray-400">Modérateur : {session.moderatorName}</div>}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => startEditSession(session)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md flex-shrink-0 bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                >
                  <Pencil className="w-3.5 h-3.5" /> Modifier
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

              {editingSessionId === session.id && (
                <div className="px-4 pb-4 bg-blue-50/50 border-t border-b border-blue-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Numéro de semaine *</label>
                      <input type="number" min={1} value={editForm.weekNumber} onChange={e => setEditForm(p => ({ ...p, weekNumber: e.target.value }))} className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
                      <input type="text" value={editForm.section} onChange={e => setEditForm(p => ({ ...p, section: e.target.value }))} className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Thème *</label>
                      <input type="text" value={editForm.theme} onChange={e => setEditForm(p => ({ ...p, theme: e.target.value }))} className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Objectifs / Contenu</label>
                      <textarea rows={2} value={editForm.objectives} onChange={e => setEditForm(p => ({ ...p, objectives: e.target.value }))} className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Modérateur assigné</label>
                      <input type="text" value={editForm.moderatorName} onChange={e => setEditForm(p => ({ ...p, moderatorName: e.target.value }))} className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                      <input type="date" value={editForm.sessionDate} onChange={e => setEditForm(p => ({ ...p, sessionDate: e.target.value }))} className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Durée</label>
                      <p className="text-sm text-gray-500 px-2 py-2 bg-gray-100 rounded-md">
                        {session.duration || 'Calculée automatiquement à l\'ajout d\'un audio ou d\'une vidéo'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-3">
                    <button type="button" disabled={savingEdit} onClick={() => saveEditSession(session.id)} className="flex items-center gap-1.5 px-4 py-2 bg-brand-700 text-white text-sm font-medium rounded-md hover:bg-brand-800 disabled:opacity-50">
                      <Save className="w-4 h-4" /> Enregistrer
                    </button>
                    <button type="button" onClick={() => setEditingSessionId(null)} className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md">
                      <X className="w-4 h-4" /> Annuler
                    </button>
                  </div>
                </div>
              )}

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

                  {/* Ajouter une ressource — 3 façons explicites */}
                  <div className="bg-white border-2 border-brand-700/20 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-900">➕ Ajouter un contenu à cette séance</p>

                    {/* Étape 1 : comment voulez-vous ajouter le contenu ? */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1.5">1. Comment voulez-vous ajouter le contenu ?</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => { setResourceMode('existing'); resetResourceForm(); if (!existingFiles) loadExistingFiles(); }}
                          className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg border-2 text-center ${resourceMode === 'existing' ? 'border-brand-700 bg-brand-700/5' : 'border-gray-200 hover:bg-gray-50'}`}
                        >
                          <FolderOpen className={`w-5 h-5 ${resourceMode === 'existing' ? 'text-brand-700' : 'text-gray-400'}`} />
                          <span className="text-xs font-medium text-gray-800">Choisir un fichier déjà en ligne</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setResourceMode('upload'); resetResourceForm(); }}
                          className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg border-2 text-center ${resourceMode === 'upload' ? 'border-brand-700 bg-brand-700/5' : 'border-gray-200 hover:bg-gray-50'}`}
                        >
                          <UploadCloud className={`w-5 h-5 ${resourceMode === 'upload' ? 'text-brand-700' : 'text-gray-400'}`} />
                          <span className="text-xs font-medium text-gray-800">Envoyer un nouveau fichier</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setResourceMode('link'); resetResourceForm(); }}
                          className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg border-2 text-center ${resourceMode === 'link' ? 'border-brand-700 bg-brand-700/5' : 'border-gray-200 hover:bg-gray-50'}`}
                        >
                          <Globe className={`w-5 h-5 ${resourceMode === 'link' ? 'text-brand-700' : 'text-gray-400'}`} />
                          <span className="text-xs font-medium text-gray-800">Coller un lien (YouTube, Drive...)</span>
                        </button>
                      </div>
                    </div>

                    {/* Étape 2 : selon le mode choisi */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1.5">2. {
                        resourceMode === 'existing' ? 'Choisissez le fichier dans la liste' :
                        resourceMode === 'upload' ? 'Sélectionnez le fichier sur votre appareil' :
                        'Collez le lien'
                      }</p>

                      {resourceMode === 'existing' && (
                        <div>
                          {loadingFiles ? (
                            <p className="text-xs text-gray-400 flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Chargement des fichiers déjà en ligne...</p>
                          ) : existingFiles && existingFiles.length === 0 ? (
                            <p className="text-xs text-amber-600">Aucun fichier trouvé pour {currentClass?.name}. Utilisez plutôt "Envoyer un nouveau fichier".</p>
                          ) : (
                            <select
                              value={selectedExistingKey}
                              onChange={e => setSelectedExistingKey(e.target.value)}
                              className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm"
                            >
                              <option value="">-- Sélectionner un fichier --</option>
                              {(existingFiles || []).map(f => (
                                <option key={f.key} value={f.key}>
                                  {friendlyNameFromKey(f.key)} ({humanFileSize(f.size)})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}

                      {resourceMode === 'upload' && (
                        <div className="space-y-1.5">
                          <input
                            type="file"
                            accept="audio/*,video/*,application/pdf"
                            onChange={e => setUploadFile(e.target.files?.[0] || null)}
                            className="w-full text-sm text-gray-600 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-brand-700 file:text-white file:text-sm hover:file:bg-brand-800"
                          />
                          <p className="text-xs text-gray-400">Formats acceptés : audio (MP3, M4A, WAV), vidéo (MP4, MOV), PDF.</p>
                          {uploadProgress !== null && (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-100 rounded overflow-hidden">
                                <div className="h-full bg-brand-700 transition-all" style={{ width: `${uploadProgress}%` }} />
                              </div>
                              <span className="text-xs text-gray-500 tabular-nums w-10 text-right">{uploadProgress}%</span>
                            </div>
                          )}
                        </div>
                      )}

                      {resourceMode === 'link' && (
                        <input
                          type="text"
                          placeholder="https://..."
                          value={linkUrl}
                          onChange={e => setLinkUrl(e.target.value)}
                          className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      )}
                    </div>

                    {/* Étape 3 : titre + validation */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1.5">3. Donnez un titre à afficher aux étudiants</p>
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="text"
                          placeholder="Ex : La Croix — partie 1"
                          value={resourceTitle}
                          onChange={e => setResourceTitle(e.target.value)}
                          className="px-2 py-2 border border-gray-300 rounded-md text-sm flex-1 min-w-[160px]"
                        />
                        <button
                          type="button"
                          disabled={uploadProgress !== null}
                          onClick={() => handleAddResource(session.id)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-brand-700 text-white text-sm font-medium rounded-md hover:bg-brand-800 disabled:opacity-50"
                        >
                          {uploadProgress !== null ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours...</> : <><CheckCircle2 className="w-4 h-4" /> Valider et ajouter</>}
                        </button>
                      </div>
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
