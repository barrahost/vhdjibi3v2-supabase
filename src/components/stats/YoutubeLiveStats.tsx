import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Download, ExternalLink, RefreshCw, Youtube } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../constants/roles';
import {
  getYoutubeStatus,
  listYoutubeLives,
  syncYoutube,
  youtubeAuthUrl,
  youtubeRedirectUri,
  type YoutubeLive,
  type YoutubeStatus,
} from '../../services/youtubeStats.service';

type Range = '3m' | '6m' | '12m' | 'all';
const RANGE_LABELS: Record<Range, string> = { '3m': '3 derniers mois', '6m': '6 derniers mois', '12m': '12 derniers mois', all: 'Tout' };
const RANGE_DAYS: Record<Range, number | null> = { '3m': 91, '6m': 182, '12m': 365, all: null };

const fmtDate = (d: Date) => d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const fmtShort = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const fmtDateTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—');
const fmtNum = (v: number | null | undefined) => (v === null || v === undefined ? '—' : Math.round(v).toLocaleString('fr-FR'));
function fmtDuration(sec: number | null | undefined) {
  if (sec === null || sec === undefined) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.round(sec % 60);
  return h ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min ${String(s).padStart(2, '0')}`;
}
/** Les directs sont à Abidjan (UTC) : dimanche au sens UTC. */
const isSunday = (d: Date) => d.getUTCDay() === 0;
const average = (values: (number | null)[]) => {
  const list = values.filter((v): v is number => v !== null && !Number.isNaN(v));
  return list.length ? list.reduce((a, b) => a + b, 0) / list.length : null;
};

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4" data-testid="yt-kpi">
      <p className="text-xs sm:text-sm text-gray-500">{label}</p>
      <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function exportLives(lives: YoutubeLive[]) {
  const ws = XLSX.utils.json_to_sheet(
    lives.map((l) => ({
      Date: l.startedAt.toLocaleDateString('fr-FR'),
      'Heure de début': l.startedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }),
      Titre: l.title,
      'Durée du direct': fmtDuration(l.durationSeconds),
      Vues: l.views,
      'Vues en direct': l.liveViews ?? '',
      'Vues en rediffusion': l.replayViews ?? '',
      'Pic de spectateurs simultanés': l.peakConcurrent ?? '',
      'Spectateurs simultanés (moyenne)': l.avgConcurrent ?? '',
      'Durée moyenne de visionnage': fmtDuration(l.avgViewDurationSec),
      'Heures regardées': l.minutesWatched !== null ? Math.round(l.minutesWatched / 6) / 10 : '',
      "J'aime": l.likes ?? '',
      Commentaires: l.comments ?? '',
      'Abonnés gagnés': l.subscribersGained ?? '',
      Lien: `https://youtu.be/${l.videoId}`,
    })),
  );
  ws['!cols'] = [12, 10, 50, 14, 8, 12, 14, 14, 14, 16, 12, 8, 12, 12, 30].map((wch) => ({ wch }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Directs YouTube');
  XLSX.writeFile(wb, `directs-youtube-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/** Statistiques des directs YouTube des cultes, lues depuis Supabase (synchronisées par la fonction youtube-stats). */
export default function YoutubeLiveStats() {
  const { hasPermission } = usePermissions();
  const canConnect = hasPermission(PERMISSIONS.MANAGE_SETTINGS) || hasPermission(PERMISSIONS.MANAGE_USERS);
  const [status, setStatus] = useState<YoutubeStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [lives, setLives] = useState<YoutubeLive[] | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [range, setRange] = useState<Range>('6m');
  const [sundaysOnly, setSundaysOnly] = useState(true);

  const loadLives = useCallback(async () => {
    try {
      setLives(await listYoutubeLives());
    } catch (e) {
      console.error('Directs YouTube :', e);
      setLives([]);
    }
  }, []);

  useEffect(() => {
    getYoutubeStatus()
      .then(setStatus)
      .catch((e) => setStatusError(e.message));
    loadLives();
  }, [loadLives]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncYoutube(true);
      setStatus(result);
      if (result.sync?.skipped) toast('Déjà à jour (dernière actualisation il y a moins de 2 minutes)');
      else if (result.sync?.ok === false) toast.error(`Actualisation impossible : ${result.sync.error}`);
      else toast.success(`Chiffres actualisés (${result.sync?.updated ?? 0} direct(s) mis à jour)`);
      await loadLives();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  const filtered = useMemo(() => {
    if (!lives) return [];
    const days = RANGE_DAYS[range];
    const from = days ? Date.now() - days * 86_400_000 : 0;
    return lives.filter((l) => l.startedAt.getTime() >= from && (!sundaysOnly || isSunday(l.startedAt)));
  }, [lives, range, sundaysOnly]);

  const chartData = useMemo(
    () =>
      [...filtered].reverse().map((l) => ({
        label: fmtShort(l.startedAt),
        direct: l.liveViews ?? (l.replayViews === null ? l.views : 0),
        rediffusion: l.replayViews ?? 0,
        pic: l.peakConcurrent,
      })),
    [filtered],
  );

  const kpis = useMemo(() => {
    const best = filtered.reduce<YoutubeLive | null>((b, l) => (!b || l.views > b.views ? l : b), null);
    return {
      count: filtered.length,
      totalViews: filtered.reduce((n, l) => n + l.views, 0),
      avgViews: average(filtered.map((l) => l.views)),
      avgPeak: average(filtered.map((l) => l.peakConcurrent)),
      avgWatch: average(filtered.map((l) => l.avgViewDurationSec)),
      subscribers: filtered.reduce((n, l) => n + (l.subscribersGained ?? 0), 0),
      best,
    };
  }, [filtered]);

  const connectBlock = () => {
    if (statusError) {
      return (
        <p className="text-sm text-amber-800">
          Le service YouTube ne répond pas ({statusError}). La fonction <code>youtube-stats</code> est-elle déployée dans Supabase ?
        </p>
      );
    }
    if (!status) return <p className="text-sm text-gray-500">Vérification de la connexion…</p>;
    if (!status.configured) {
      return (
        <p className="text-sm text-amber-800">
          Les identifiants Google (YOUTUBE_CLIENT_ID et YOUTUBE_CLIENT_SECRET) ne sont pas encore définis dans les secrets Supabase.
        </p>
      );
    }
    if (!status.connected) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-700">
            Aucune chaîne n'est encore reliée. Connectez-vous avec le compte Google de l'église (celui qui gère la chaîne YouTube).
          </p>
          {canConnect ? (
            <a
              href={youtubeAuthUrl(status.clientId!)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700"
            >
              <Youtube className="w-4 h-4" />
              Relier la chaîne YouTube
            </a>
          ) : (
            <p className="text-xs text-gray-500">Un administrateur doit relier la chaîne.</p>
          )}
          <p className="text-[11px] text-gray-400">Adresse de retour à déclarer dans Google Cloud : {youtubeRedirectUri()}</p>
        </div>
      );
    }
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="text-sm">
          <span className="font-medium text-gray-900">{status.channelTitle}</span>
          <span className="text-gray-500"> · actualisé le {fmtDateTime(status.lastSyncAt)}</span>
        </div>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Actualisation…' : 'Actualiser'}
        </button>
        {status.lastError && (
          <p className="w-full text-xs text-red-700 flex items-start gap-1">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            Dernière actualisation en échec : {status.lastError}
            {canConnect && status.clientId && (
              <a href={youtubeAuthUrl(status.clientId)} className="underline ml-1">
                Reconnecter
              </a>
            )}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6" data-testid="youtube-stats">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4 flex items-start gap-3">
        <Youtube className="w-6 h-6 text-red-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">{connectBlock()}</div>
      </div>

      {lives && lives.length > 0 && (
        <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-wrap items-center gap-2">
            {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border ${
                  range === r ? 'bg-[#00665C] text-white border-[#00665C]' : 'bg-white text-gray-700 border-gray-200 hover:border-[#00665C]'
                }`}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
            <label className="flex items-center gap-2 text-sm text-gray-700 ml-1">
              <input type="checkbox" checked={sundaysOnly} onChange={(e) => setSundaysOnly(e.target.checked)} className="rounded text-[#00665C]" />
              Dimanches seulement
            </label>
            <button
              type="button"
              onClick={() => exportLives(filtered)}
              disabled={!filtered.length}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#00665C] bg-white border border-[#00665C] rounded-md hover:bg-[#00665C]/10 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi label="Directs" value={String(kpis.count)} sub={`${fmtNum(kpis.totalViews)} vues au total`} />
            <Kpi label="Vues par direct (moyenne)" value={fmtNum(kpis.avgViews)} sub="direct + rediffusion" />
            <Kpi label="Pic de spectateurs simultanés" value={fmtNum(kpis.avgPeak)} sub="en moyenne par direct" />
            <Kpi label="Durée moyenne de visionnage" value={fmtDuration(kpis.avgWatch)} sub={`${fmtNum(kpis.subscribers)} abonné(s) gagné(s)`} />
          </div>

          {filtered.length > 0 ? (
            <>
              <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Vues par direct et pic de spectateurs simultanés</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="direct" name="Vues en direct" stackId="v" fill="#00665C" />
                      <Bar dataKey="rediffusion" name="Vues en rediffusion" stackId="v" fill="#99C7C2" />
                      <Line dataKey="pic" name="Pic simultané" stroke="#DC2626" strokeWidth={2} dot={{ r: 2 }} connectNulls />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-3 sm:px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-700">Détail des directs ({filtered.length})</h3>
                  {kpis.best && (
                    <span className="text-xs text-gray-500">
                      Meilleur : {fmtShort(kpis.best.startedAt)} ({fmtNum(kpis.best.views)} vues)
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="yt-table">
                    <thead className="bg-gray-50 text-xs text-gray-500">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Direct</th>
                        <th className="px-3 py-2 text-right font-medium">Vues</th>
                        <th className="px-3 py-2 text-right font-medium">Pic simult.</th>
                        <th className="px-3 py-2 text-right font-medium hidden sm:table-cell">Visionnage moy.</th>
                        <th className="px-3 py-2 text-right font-medium hidden md:table-cell">Durée</th>
                        <th className="px-3 py-2 text-right font-medium hidden md:table-cell">J'aime</th>
                        <th className="px-3 py-2 text-right font-medium hidden lg:table-cell">Abonnés</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filtered.map((l) => (
                        <tr key={l.videoId}>
                          <td className="px-3 py-2 max-w-[220px] sm:max-w-none">
                            <a
                              href={`https://youtu.be/${l.videoId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-gray-900 hover:text-[#00665C] inline-flex items-center gap-1"
                            >
                              <span className="truncate">{fmtDate(l.startedAt)}</span>
                              <ExternalLink className="w-3 h-3 flex-shrink-0 text-gray-400" />
                            </a>
                            <p className="text-xs text-gray-500 truncate">{l.title}</p>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span className="font-medium">{fmtNum(l.views)}</span>
                            {l.liveViews !== null && (
                              <p className="text-[11px] text-gray-400 whitespace-nowrap">
                                {fmtNum(l.liveViews)} direct · {fmtNum(l.replayViews)} rediff.
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">{fmtNum(l.peakConcurrent)}</td>
                          <td className="px-3 py-2 text-right hidden sm:table-cell">{fmtDuration(l.avgViewDurationSec)}</td>
                          <td className="px-3 py-2 text-right hidden md:table-cell">{fmtDuration(l.durationSeconds)}</td>
                          <td className="px-3 py-2 text-right hidden md:table-cell">{fmtNum(l.likes)}</td>
                          <td className="px-3 py-2 text-right hidden lg:table-cell">{fmtNum(l.subscribersGained)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : (
            <p className="text-center text-sm text-gray-500 py-6">Aucun direct sur cette période.</p>
          )}
          <p className="text-xs text-gray-400">
            YouTube publie ses statistiques détaillées avec 1 à 3 jours de retard : les chiffres du dernier dimanche se complètent en début de semaine.
            Actualisation automatique chaque nuit et le dimanche à 15 h.
          </p>
        </>
      )}
      {lives && lives.length === 0 && status?.connected && (
        <p className="text-center text-sm text-gray-500 py-6">Aucun direct terminé trouvé sur la chaîne pour l'instant. Cliquez sur « Actualiser ».</p>
      )}
    </div>
  );
}
