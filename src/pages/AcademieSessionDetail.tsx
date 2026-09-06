import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AcademieService } from '../services/academie.service';
import type { AcademieClass, AcademieSession, AcademieResource, AcademieAssignment } from '../types/academie.types';
import { resourceUrl } from '../types/academie.types';
import { generateAcademieCertificate } from '../utils/academieCertificate';
import toast from 'react-hot-toast';
import {
  ArrowLeft, ArrowRight, PlayCircle, Download, FileText, Link as LinkIcon,
  ClipboardList, CheckCircle2, Circle, Award,
} from 'lucide-react';

export default function AcademieSessionDetail() {
  const { classId, sessionId } = useParams<{ classId: string; sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || (user as any)?.uid;

  const [cls, setCls] = useState<AcademieClass | null>(null);
  const [sessions, setSessions] = useState<AcademieSession[]>([]);
  const [resources, setResources] = useState<AcademieResource[]>([]);
  const [assignments, setAssignments] = useState<AcademieAssignment[]>([]);
  const [allCompletedIds, setAllCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!classId || !sessionId || !userId) return;
    setLoading(true);
    const [classes, allSessions, res, asg, progress] = await Promise.all([
      AcademieService.getClasses(),
      AcademieService.getPublishedSessionsByClass(classId),
      AcademieService.getResourcesBySession(sessionId),
      AcademieService.getAssignmentsBySession(sessionId),
      AcademieService.getProgressByUser(userId),
    ]);
    setCls(classes.find(c => c.id === classId) || null);
    setSessions(allSessions.sort((a, b) => a.weekNumber - b.weekNumber));
    setResources(res);
    setAssignments(asg.filter(a => a.isPublished));
    const completedSet = new Set(progress.filter(p => p.status === 'completed').map(p => p.sessionId));
    setAllCompletedIds(completedSet);
    setLoading(false);
  };

  useEffect(() => { load(); }, [classId, sessionId, userId]);

  if (loading) return <div className="text-center py-12 text-gray-500">Chargement...</div>;

  const session = sessions.find(s => s.id === sessionId);
  if (!cls || !session) return <div className="text-center py-12 text-gray-500">Séance introuvable ou pas encore publiée.</div>;

  const idx = sessions.findIndex(s => s.id === sessionId);
  const prevSession = idx > 0 ? sessions[idx - 1] : null;
  const nextSession = idx < sessions.length - 1 ? sessions[idx + 1] : null;

  const isCompleted = allCompletedIds.has(sessionId!);

  const toggleCompleted = async () => {
    if (!userId || !sessionId) return;
    try {
      setSaving(true);
      if (isCompleted) {
        await AcademieService.unmarkSessionCompleted(userId, sessionId);
        setAllCompletedIds(prev => { const s = new Set(prev); s.delete(sessionId); return s; });
      } else {
        await AcademieService.markSessionCompleted(userId, sessionId);
        setAllCompletedIds(prev => new Set(prev).add(sessionId));
        toast.success('Séance marquée comme terminée !');
      }
    } catch {
      toast.error('Erreur');
    } finally {
      setSaving(false);
    }
  };

  const isClassNowComplete = sessions.length > 0 && sessions.every(s => allCompletedIds.has(s.id));

  return (
    <div className="space-y-4 max-w-3xl">
      <Link to={`/academie/classe/${classId}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> {cls.name} — Programme
      </Link>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-700 to-brand-900 px-5 py-4">
          <p className="text-xs text-white/70">Semaine {session.weekNumber}{session.section ? ` · Section ${session.section}` : ''}</p>
          <h1 className="text-xl font-bold text-white mt-0.5">{session.theme}</h1>
        </div>

        <div className="p-5 space-y-4">
          {session.objectives && (
            <p className="text-sm text-gray-600 whitespace-pre-line">{session.objectives}</p>
          )}

          {resources.length > 0 ? (
            <div className="space-y-2">
              {resources.map(r => (
                <div key={r.id} className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2.5">
                  {r.type === 'pdf' ? <FileText className="w-4 h-4 text-brand-700 flex-shrink-0" /> :
                   r.type === 'link' ? <LinkIcon className="w-4 h-4 text-brand-700 flex-shrink-0" /> :
                   <PlayCircle className="w-4 h-4 text-brand-700 flex-shrink-0" />}
                  <span className="text-sm text-gray-800 flex-1 truncate">{r.title}</span>
                  {r.type === 'audio' && <audio controls src={resourceUrl(r)} className="h-8 max-w-[200px]" />}
                  {r.type === 'video' && (
                    <a href={resourceUrl(r)} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-700 underline">Regarder</a>
                  )}
                  <a
                    href={resourceUrl(r)} target="_blank" rel="noopener noreferrer" download={r.type !== 'link'}
                    className="flex-shrink-0 p-1.5 rounded-md text-gray-500 hover:bg-gray-200"
                    title={r.type === 'link' ? 'Ouvrir' : 'Télécharger'}
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Aucune ressource ajoutée pour l'instant.</p>
          )}

          {assignments.length > 0 && (
            <div className="space-y-2">
              {assignments.map(a => (
                <div key={a.id} className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                  <ClipboardList className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.title}</p>
                    {a.description && <p className="text-xs text-gray-500 mt-0.5">{a.description}</p>}
                    {a.dueDate && <p className="text-xs text-amber-700 mt-0.5">À rendre pour le {new Date(a.dueDate).toLocaleDateString('fr-FR')}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={toggleCompleted}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm ${
              isCompleted ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-brand-700 text-white hover:bg-brand-800'
            } disabled:opacity-50`}
          >
            {isCompleted ? <><CheckCircle2 className="w-5 h-5" /> Séance terminée</> : <><Circle className="w-5 h-5" /> Marquer comme terminé</>}
          </button>

          {isClassNowComplete && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between gap-3">
              <p className="text-sm text-amber-800">🎉 Vous avez terminé toute la classe !</p>
              <button
                type="button"
                onClick={() => generateAcademieCertificate(user?.fullName || 'Étudiant(e)', cls.name)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-md hover:bg-amber-700 flex-shrink-0"
              >
                <Award className="w-3.5 h-3.5" /> Mon certificat
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        {prevSession ? (
          <button type="button" onClick={() => navigate(`/academie/classe/${classId}/seance/${prevSession.id}`)} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border rounded-md hover:bg-gray-50">
            <ArrowLeft className="w-4 h-4" /> Précédent
          </button>
        ) : <div />}
        {nextSession ? (
          <button type="button" onClick={() => navigate(`/academie/classe/${classId}/seance/${nextSession.id}`)} className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-brand-700 rounded-md hover:bg-brand-800">
            Suivant <ArrowRight className="w-4 h-4" />
          </button>
        ) : <div />}
      </div>
    </div>
  );
}
