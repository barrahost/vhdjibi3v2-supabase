import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import BatchAttendanceForm from '../components/attendance/BatchAttendanceForm';
import AttendanceList from '../components/attendance/AttendanceList';
import AttendanceStats from '../components/attendance/AttendanceStats';
import { useAuth } from '../contexts/AuthContext';
import { AttendanceService, type AttendanceUser, type PointableSoul } from '../services/attendance.service';
import { dayKey } from '../lib/attendance';

export default function AttendanceManagement() {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');
  const [user, setUser] = useState<AttendanceUser | null>(null);
  const [souls, setSouls] = useState<PointableSoul[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'failed' | 'no_user' | 'denied'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [day, setDay] = useState(() => dayKey(new Date()));
  // Change à chaque enregistrement : l'historique et les statistiques se rechargent.
  const [version, setVersion] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    (async () => {
      try {
        const current = await AttendanceService.currentUser();
        if (cancelled) return;
        if (!current) return setState('no_user');
        if (!current.canTake) return setState('denied');
        const list = await AttendanceService.souls(current);
        if (cancelled) return;
        setUser(current);
        setSouls(list);
        setState('ready');
      } catch (error) {
        console.error('Error loading attendance data:', error);
        if (!cancelled) setState('failed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authUser?.id, attempt]);

  const onSaved = useCallback(() => setVersion((v) => v + 1), []);
  const editDay = useCallback((target: string) => {
    setDay(target);
    setActiveTab('list');
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const tab = (id: 'list' | 'stats', label: string) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-2.5 py-1.5 text-xs sm:text-sm sm:px-4 sm:py-2 font-medium rounded-md ${
        activeTab === id ? 'bg-[#00665C] text-white' : 'text-gray-700 bg-white border border-gray-300'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Présences aux cultes</h1>
        {state === 'ready' && (
          <div className="flex flex-wrap gap-2">
            {tab('list', 'Pointage')}
            {tab('stats', 'Statistiques')}
          </div>
        )}
      </div>

      {state === 'loading' && <div className="text-center py-8 text-gray-500">Chargement de vos âmes…</div>}

      {state === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800 flex-1">Impossible de charger vos âmes. Vérifiez votre connexion internet puis réessayez.</p>
          <button
            onClick={() => setAttempt((n) => n + 1)}
            className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-[#00665C] rounded-md"
          >
            <RefreshCw className="w-4 h-4" /> Réessayer
          </button>
        </div>
      )}

      {state === 'no_user' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
          Votre session a expiré. Déconnectez-vous puis reconnectez-vous pour pointer les présences.
        </div>
      )}

      {state === 'denied' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
          Le pointage des présences est réservé aux bergers. Si vous suivez des âmes, demandez à l’administration de vous
          ajouter le profil « Berger ».
        </div>
      )}

      {state === 'ready' && user && (activeTab === 'list' ? (
        <div className="space-y-6">
          <div ref={formRef} className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border scroll-mt-20">
            <h2 className="text-lg font-semibold text-[#00665C] mb-4">Pointer les présences</h2>
            <BatchAttendanceForm user={user} souls={souls} day={day} onDayChange={setDay} onSaved={onSaved} version={version} />
          </div>
          <AttendanceList user={user} souls={souls} version={version} onChanged={onSaved} onEditDay={editDay} />
        </div>
      ) : (
        <AttendanceStats user={user} souls={souls} version={version} />
      ))}
    </div>
  );
}
