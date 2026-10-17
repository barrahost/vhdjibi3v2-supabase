import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AcademieService } from '../services/academie.service';
import type { AcademieClass, AcademieSession } from '../types/academie.types';
import { ProgressBar } from '../components/academie/ProgressBar';
import { CheckCircle2, Circle, Lock, ChevronRight, ArrowLeft } from 'lucide-react';

export default function AcademieCourseTimeline() {
  const { classId } = useParams<{ classId: string }>();
  const { user } = useAuth();
  const userId = user?.id || (user as any)?.uid;

  const [cls, setCls] = useState<AcademieClass | null>(null);
  const [allSessions, setAllSessions] = useState<AcademieSession[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classId || !userId) return;
    (async () => {
      try {
        setLoading(true);
        const [classes, sessions] = await Promise.all([
          AcademieService.getClasses(),
          AcademieService.getSessionsByClass(classId),
        ]);
        setCls(classes.find(c => c.id === classId) || null);
        const sorted = sessions.sort((a, b) => a.weekNumber - b.weekNumber);
        setAllSessions(sorted);
        const published = sorted.filter(s => s.isPublished);
        const progress = await AcademieService.getProgressByUserAndSessions(userId, published.map(s => s.id));
        setCompletedIds(new Set(progress.filter(p => p.status === 'completed').map(p => p.sessionId)));
      } finally {
        setLoading(false);
      }
    })();
  }, [classId, userId]);

  if (loading) return <div className="text-center py-12 text-gray-500">Chargement...</div>;
  if (!cls) return <div className="text-center py-12 text-gray-500">Classe introuvable.</div>;

  const published = allSessions.filter(s => s.isPublished);
  const completed = published.filter(s => completedIds.has(s.id)).length;

  return (
    <div className="space-y-4">
      <Link to="/academie" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Retour à l'Académie
      </Link>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-700 to-brand-900 px-5 py-5">
        <h1 className="text-xl font-bold text-white">{cls.name}</h1>
        {cls.description && <p className="text-sm text-white/70 mt-0.5">{cls.description}</p>}
        <div className="mt-3 max-w-xs">
          <ProgressBar completed={completed} total={published.length} />
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Programme de la classe</h2>
        <div className="space-y-0">
          {allSessions.map((session, idx) => {
            const isDone = completedIds.has(session.id);
            const isLocked = !session.isPublished;
            const isLast = idx === allSessions.length - 1;

            const content = (
              <div className={`flex items-start gap-3 py-3 ${isLocked ? 'opacity-50' : ''}`}>
                <div className="flex flex-col items-center flex-shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : isLocked ? (
                    <Lock className="w-6 h-6 text-gray-300" />
                  ) : (
                    <Circle className="w-6 h-6 text-brand-700" />
                  )}
                  {!isLast && <div className="w-0.5 flex-1 min-h-[24px] bg-gray-100 mt-1" />}
                </div>
                <div className="min-w-0 flex-1 pb-1">
                  <div className="text-xs text-gray-400">
                    Semaine {session.weekNumber}{session.section ? ` · Section ${session.section}` : ''}
                    {session.sessionDate && ` · ${new Date(session.sessionDate).toLocaleDateString('fr-FR')}`}
                  </div>
                  <div className={`font-medium ${isLocked ? 'text-gray-400' : 'text-gray-900'}`}>{session.theme}</div>
                  {isLocked && <div className="text-xs text-amber-600 mt-0.5">Pas encore disponible</div>}
                </div>
                {!isLocked && <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />}
              </div>
            );

            return isLocked ? (
              <div key={session.id}>{content}</div>
            ) : (
              <Link key={session.id} to={`/academie/classe/${classId}/seance/${session.id}`} className="block hover:bg-gray-50 -mx-2 px-2 rounded-lg">
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
