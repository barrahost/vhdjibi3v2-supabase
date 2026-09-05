import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AcademieService } from '../services/academie.service';
import type { AcademieClass, AcademieSession, AcademieResource, AcademieAssignment } from '../types/academie.types';
import { resourceUrl } from '../types/academie.types';
import { GraduationCap, PlayCircle, Download, FileText, Link as LinkIcon, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';

export default function AcademieStudent() {
  const { user } = useAuth();
  const userId = user?.id || (user as any)?.uid;
  const [classes, setClasses] = useState<AcademieClass[]>([]);
  const [sessions, setSessions] = useState<AcademieSession[]>([]);
  const [resources, setResources] = useState<AcademieResource[]>([]);
  const [assignments, setAssignments] = useState<AcademieAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        setLoading(true);
        const [enrollments, allClasses] = await Promise.all([
          AcademieService.getEnrollmentsByUser(userId),
          AcademieService.getClasses(),
        ]);
        const classIds = enrollments.map(e => e.classId);
        const myClasses = allClasses.filter(c => classIds.includes(c.id));
        setClasses(myClasses);

        const sessionsPerClass = await Promise.all(myClasses.map(c => AcademieService.getPublishedSessionsByClass(c.id)));
        const allSessions = sessionsPerClass.flat();
        setSessions(allSessions);

        const sessionIds = allSessions.map(s => s.id);
        const [res, asg] = await Promise.all([
          AcademieService.getResourcesBySessions(sessionIds),
          AcademieService.getAssignmentsBySessions(sessionIds),
        ]);
        setResources(res);
        setAssignments(asg.filter(a => a.isPublished));
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) return <div className="text-center py-12 text-gray-500">Chargement...</div>;

  if (classes.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
        <GraduationCap className="w-8 h-8 text-amber-600 mx-auto mb-2" />
        <h2 className="text-lg font-semibold text-amber-900">Aucune inscription à l'Académie</h2>
        <p className="text-sm text-amber-800 mt-1">Contactez un administrateur pour vous inscrire à une classe.</p>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      {classes.map(cls => {
        const classSessions = sessions
          .filter(s => s.classId === cls.id)
          .sort((a, b) => a.weekNumber - b.weekNumber);

        return (
          <div key={cls.id} className="bg-white border rounded-lg overflow-hidden">
            <div className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-700 to-brand-900 px-5 py-4">
              <h1 className="text-xl font-bold text-white">{cls.name}</h1>
              {cls.description && <p className="text-sm text-white/70 mt-0.5">{cls.description}</p>}
            </div>

            <div className="divide-y">
              {classSessions.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">Aucun cours publié pour l'instant.</div>
              ) : (
                classSessions.map(session => {
                  const sessionResources = resources.filter(r => r.sessionId === session.id);
                  const sessionAssignments = assignments.filter(a => a.sessionId === session.id);
                  const status = !session.sessionDate ? 'disponible' : session.sessionDate > today ? 'à venir' : 'disponible';
                  const isOpen = openSessionId === session.id;

                  return (
                    <div key={session.id}>
                      <button
                        type="button"
                        onClick={() => setOpenSessionId(isOpen ? null : session.id)}
                        className="w-full flex items-center justify-between gap-3 px-5 py-3 hover:bg-gray-50 text-left"
                      >
                        <div className="min-w-0">
                          <div className="text-xs text-gray-400">Semaine {session.weekNumber}{session.section ? ` · Section ${session.section}` : ''}</div>
                          <div className="font-medium text-gray-900 truncate">{session.theme}</div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status === 'à venir' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                            {status}
                          </span>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-4 space-y-3 bg-gray-50/50">
                          {session.objectives && (
                            <p className="text-sm text-gray-600 whitespace-pre-line">{session.objectives}</p>
                          )}

                          {sessionResources.length > 0 && (
                            <div className="space-y-1.5">
                              {sessionResources.map(r => (
                                <div key={r.id} className="flex items-center gap-2 bg-white border rounded-md px-3 py-2">
                                  {r.type === 'video' && <PlayCircle className="w-4 h-4 text-brand-700 flex-shrink-0" />}
                                  {r.type === 'audio' && <PlayCircle className="w-4 h-4 text-brand-700 flex-shrink-0" />}
                                  {r.type === 'pdf' && <FileText className="w-4 h-4 text-brand-700 flex-shrink-0" />}
                                  {r.type === 'link' && <LinkIcon className="w-4 h-4 text-brand-700 flex-shrink-0" />}
                                  <span className="text-sm text-gray-800 flex-1 truncate">{r.title}</span>
                                  {r.type === 'audio' ? (
                                    <audio controls src={resourceUrl(r)} className="h-8 max-w-[180px]" />
                                  ) : null}
                                  <a
                                    href={resourceUrl(r)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download={r.type !== 'link'}
                                    className="flex-shrink-0 p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
                                    title={r.type === 'link' ? 'Ouvrir' : 'Télécharger'}
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}

                          {sessionAssignments.length > 0 && (
                            <div className="space-y-1.5">
                              {sessionAssignments.map(a => (
                                <div key={a.id} className="flex items-start gap-2 bg-white border border-amber-200 rounded-md px-3 py-2">
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

                          {sessionResources.length === 0 && sessionAssignments.length === 0 && !session.objectives && (
                            <p className="text-sm text-gray-400 italic">Aucune ressource pour l'instant.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
