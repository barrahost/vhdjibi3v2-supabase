import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AcademieService } from '../services/academie.service';
import type { AcademieClass, AcademieSession, AcademieProgress } from '../types/academie.types';
import { ProgressBar } from '../components/academie/ProgressBar';
import { generateAcademieCertificate } from '../utils/academieCertificate';
import { GraduationCap, ArrowRight, Award } from 'lucide-react';

interface ClassCard {
  cls: AcademieClass;
  sessions: AcademieSession[];
  completedIds: Set<string>;
  nextSessionId: string | null;
}

export default function AcademieHub() {
  const { user } = useAuth();
  const userId = user?.id || (user as any)?.uid;
  const [cards, setCards] = useState<ClassCard[]>([]);
  const [loading, setLoading] = useState(true);

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

        const built: ClassCard[] = [];
        for (const cls of myClasses) {
          const sessions = (await AcademieService.getPublishedSessionsByClass(cls.id)).sort((a, b) => a.weekNumber - b.weekNumber);
          const progress = await AcademieService.getProgressByUserAndSessions(userId, sessions.map(s => s.id));
          const completedIds = new Set(progress.filter(p => p.status === 'completed').map(p => p.sessionId));
          const nextSession = sessions.find(s => !completedIds.has(s.id));
          built.push({ cls, sessions, completedIds, nextSessionId: nextSession?.id || null });
        }
        setCards(built);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) return <div className="text-center py-12 text-gray-500">Chargement...</div>;

  if (cards.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
        <GraduationCap className="w-8 h-8 text-amber-600 mx-auto mb-2" />
        <h2 className="text-lg font-semibold text-amber-900">Aucune inscription à l'Académie</h2>
        <p className="text-sm text-amber-800 mt-1">Contactez un administrateur pour vous inscrire à une classe.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-700 to-brand-900 px-5 py-5">
        <h1 className="text-xl font-bold text-white flex items-center gap-2"><GraduationCap className="w-6 h-6" /> Académie VH AGC</h1>
        <p className="text-sm text-white/70 mt-1">Retrouvez vos classes, votre progression et vos cours à suivre.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map(({ cls, sessions, completedIds, nextSessionId }) => {
          const total = sessions.length;
          const completed = completedIds.size;
          const isDone = total > 0 && completed === total;
          const nextSession = sessions.find(s => s.id === nextSessionId);

          return (
            <div key={cls.id} className="bg-white border rounded-xl overflow-hidden flex flex-col">
              <div className="p-4 flex-1">
                <h2 className="font-semibold text-gray-900">{cls.name}</h2>
                {cls.description && <p className="text-xs text-gray-500 mt-0.5">{cls.description}</p>}
                <div className="mt-3">
                  <ProgressBar completed={completed} total={total} />
                </div>
                {nextSession && !isDone && (
                  <p className="mt-2 text-xs text-gray-500">
                    À suivre : <span className="font-medium text-gray-700">Semaine {nextSession.weekNumber} — {nextSession.theme}</span>
                  </p>
                )}
                {isDone && (
                  <p className="mt-2 text-xs text-green-700 font-medium flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> Classe terminée — félicitations !
                  </p>
                )}
              </div>
              <div className="border-t px-4 py-3 flex items-center gap-2">
                <Link
                  to={`/academie/classe/${cls.id}${nextSessionId ? `/seance/${nextSessionId}` : ''}`}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-700 text-white text-sm font-medium rounded-md hover:bg-brand-800"
                >
                  {completed === 0 ? 'Commencer' : isDone ? 'Revoir' : 'Continuer'} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to={`/academie/classe/${cls.id}`}
                  className="px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-md hover:bg-gray-50"
                >
                  Programme
                </Link>
                {isDone && (
                  <button
                    type="button"
                    onClick={() => generateAcademieCertificate(user?.fullName || 'Étudiant(e)', cls.name)}
                    title="Télécharger mon certificat"
                    className="px-3 py-2 border border-amber-200 text-amber-700 text-sm rounded-md hover:bg-amber-50"
                  >
                    <Award className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
