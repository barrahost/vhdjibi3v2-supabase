import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { EvangelizedSoul } from '../types/evangelized.types';
import { AlertTriangle, CheckCircle2, Megaphone } from 'lucide-react';
import ImportToSoulModal from '../components/evangelizedSouls/ImportToSoulModal';
import { formatDate } from '../utils/dateUtils';
import toast from 'react-hot-toast';

interface SignalRow {
  soul: EvangelizedSoul;
  evangelistName: string;
  reconciled: boolean;
}

export default function EvangelizedSignals() {
  const [rows, setRows] = useState<SignalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiving, setReceiving] = useState<EvangelizedSoul | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('evangelized_souls')
        .select('*')
        .eq('church_id', getChurchId())
        .eq('service_attendance', 'came')
        .order('updated_at', { ascending: false });
      if (error) throw error;

      const souls = (data ?? []).map((row: any) => ({
        id: row.id,
        fullName: row.full_name,
        nickname: row.nickname,
        gender: row.gender,
        phone: row.phone,
        location: row.location,
        evangelizationDate: row.evangelization_date ? new Date(row.evangelization_date) : new Date(),
        evangelistId: row.evangelist_id,
        status: row.status,
        photoURL: row.photo_url,
        importedToSoulId: row.imported_to_soul_id,
        importedAt: row.imported_at ? new Date(row.imported_at) : null,
        serviceAttendance: row.service_attendance,
        updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
      } as EvangelizedSoul));

      const evangelistIds = [...new Set(souls.map((s: EvangelizedSoul) => s.evangelistId).filter(Boolean))];
      const names: Record<string, string> = {};
      if (evangelistIds.length > 0) {
        const { data: users } = await supabase.from('users').select('id, full_name').eq('church_id', getChurchId()).in('id', evangelistIds);
        (users ?? []).forEach((u: any) => { names[u.id] = u.full_name || u.fullName || ''; });
      }

      const built: SignalRow[] = souls.map((soul: EvangelizedSoul) => ({
        soul,
        evangelistName: names[soul.evangelistId] || 'Évangéliste inconnu',
        reconciled: !!soul.importedToSoulId,
      }));
      built.sort((a, b) => Number(a.reconciled) - Number(b.reconciled));

      setRows(built);
    } catch (error) {
      console.error('Error loading evangelized signals:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const discordances = rows.filter((r) => !r.reconciled);
  const reconciled = rows.filter((r) => r.reconciled);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-brand-700" /> Signalements des évangélistes
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Contacts que les évangélistes ont marqués "venu(e) au culte" — à recouper avec les réceptions ADN
          </p>
        </div>
        {discordances.length > 0 && (
          <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full whitespace-nowrap">
            {discordances.length} à vérifier
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-sm text-gray-400">
          Aucun signalement pour le moment.
        </div>
      ) : (
        <div className="space-y-6">
          {discordances.length > 0 && (
            <div className="bg-white border border-amber-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-amber-100 bg-amber-50 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-semibold text-amber-900">À vérifier — pas encore reçu(e) par l'ADN</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {discordances.map(({ soul, evangelistName }) => (
                  <div key={soul.id} className="px-4 py-3 flex items-center gap-3 flex-wrap">
                    <div className="flex-1 min-w-[160px]">
                      <p className="text-sm font-semibold text-gray-900">{soul.fullName}</p>
                      <p className="text-xs text-gray-500">
                        Signalé par {evangelistName} · {soul.location} · {soul.phone || '—'}
                      </p>
                    </div>
                    <button
                      onClick={() => setReceiving(soul)}
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-700 text-white hover:bg-brand-800 transition-colors"
                    >
                      Recevoir dans l'église
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reconciled.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <h2 className="text-sm font-semibold text-gray-700">Réconciliés</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {reconciled.map(({ soul, evangelistName }) => (
                  <div key={soul.id} className="px-4 py-3 flex items-center gap-3 flex-wrap opacity-70">
                    <div className="flex-1 min-w-[160px]">
                      <p className="text-sm font-medium text-gray-700">{soul.fullName}</p>
                      <p className="text-xs text-gray-400">
                        Signalé par {evangelistName}{soul.importedAt ? ` · reçu le ${formatDate(soul.importedAt)}` : ''}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Reçu(e)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {receiving && (
        <ImportToSoulModal
          soul={receiving}
          isOpen={!!receiving}
          onClose={() => setReceiving(null)}
          onImported={() => { setReceiving(null); load(); }}
        />
      )}
    </div>
  );
}
