import { useEffect, useMemo, useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, ArrowDown, ArrowUp, Download, Minus, Phone, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import {
  FORGOTTEN_AFTER_DAYS,
  INTERACTION_TYPE_LABELS,
  INTERACTION_TYPES,
  PERIOD_LABELS,
  computeInteractionStats,
  periodFor,
  previousPeriod,
  trend,
  type InteractionType,
  type PeriodPreset,
  type ShepherdRow,
  type StatsFilters,
} from '../../lib/interactionStats';
import { loadInteractionStatsData, type InteractionStatsData, type StatsScope } from '../../services/interactionStats.service';
import { exportInteractionStats } from '../../utils/export/interactionStats';
import { telHref } from '../../utils/phoneValidation';

export const TYPE_COLORS: Record<InteractionType, string> = {
  call: '#00665C',
  visit: '#F59E0B',
  message: '#3B82F6',
  sms: '#8B5CF6',
};

const PRESETS: PeriodPreset[] = ['week', 'month', '3months', 'year', 'custom'];
const YEAR_MS = 365 * 86_400_000;
const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const formatDate = (d: Date | null) => (d ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const formatPct = (v: number | null) => (v === null ? '—' : `${Math.round(v * 100)} %`);
const formatNumber = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ','));

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  const value = trend(current, previous);
  if (value === null) return <span className="text-xs text-gray-400">nouveau</span>;
  const Icon = value > 0 ? ArrowUp : value < 0 ? ArrowDown : Minus;
  const color = value > 0 ? 'text-emerald-600' : value < 0 ? 'text-red-600' : 'text-gray-500';
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${color}`}>
      <Icon className="w-3 h-3" />
      {value > 0 ? '+' : ''}
      {value} %
    </span>
  );
}

function KpiCard(props: { label: string; value: string; sub?: string; current?: number; previous?: number; previousLabel?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4" data-testid="kpi">
      <p className="text-xs sm:text-sm text-gray-500">{props.label}</p>
      <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{props.value}</p>
      {props.sub && <p className="text-xs text-gray-500">{props.sub}</p>}
      {props.current !== undefined && props.previous !== undefined && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <TrendBadge current={props.current} previous={props.previous} />
          <span className="text-[11px] text-gray-400">vs {props.previousLabel}</span>
        </div>
      )}
    </div>
  );
}

type SortKey = 'name' | 'soulsFollowed' | 'interactions' | 'coverage' | 'lastContact';

const SORT_LABELS: { key: SortKey; label: string; className?: string }[] = [
  { key: 'name', label: 'Berger(e)' },
  { key: 'soulsFollowed', label: 'Âmes', className: 'text-right' },
  { key: 'interactions', label: 'Interactions', className: 'text-right' },
  { key: 'coverage', label: 'Couverture', className: 'text-right' },
  { key: 'lastContact', label: 'Dernier contact', className: 'text-right hidden sm:table-cell' },
];

function sortRows(rows: ShepherdRow[], key: SortKey, asc: boolean) {
  const value = (r: ShepherdRow): number | string => {
    switch (key) {
      case 'name':
        return r.shepherd.fullName.toLocaleLowerCase('fr');
      case 'soulsFollowed':
        return r.soulsFollowed;
      case 'interactions':
        return r.interactions;
      case 'coverage':
        return r.coverage ?? -1;
      case 'lastContact':
        return r.lastContact?.getTime() ?? 0;
    }
  };
  return [...rows].sort((a, b) => {
    const va = value(a);
    const vb = value(b);
    const cmp = typeof va === 'string' ? va.localeCompare(vb as string, 'fr') : (va as number) - (vb as number);
    return asc ? cmp : -cmp;
  });
}

interface Props {
  scope: StatsScope;
}

/** Statistiques des interactions : église (admin, pasteur), famille (responsable) ou berger. */
export default function InteractionStatsDashboard({ scope }: Props) {
  const { user } = useAuth();
  const userKeys = useMemo(() => [user?.id, user?.uid].filter(Boolean) as string[], [user?.id, user?.uid]);

  const [preset, setPreset] = useState<PeriodPreset>('month');
  const [custom, setCustom] = useState(() => {
    const now = new Date();
    return { from: isoDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)), to: isoDay(now) };
  });
  const [filters, setFilters] = useState<StatsFilters>({ shepherdId: null, familyId: null, type: null });
  const [data, setData] = useState<InteractionStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({ key: 'interactions', asc: false });
  const [showAllForgotten, setShowAllForgotten] = useState(false);

  const now = useMemo(() => new Date(), [reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const period = useMemo(() => periodFor(preset, now, custom), [preset, now, custom]);
  const previous = useMemo(() => previousPeriod(period), [period]);
  // Au moins 12 mois d'historique (dernier contact des âmes), plus la période de comparaison
  const requiredSince = useMemo(() => new Date(Math.min(previous.from.getTime(), now.getTime() - YEAR_MS)), [previous, now]);
  const needsLoad = !data || requiredSince < data.loadedFrom;

  const loadedReloadKey = useRef(-1);
  useEffect(() => {
    if (!needsLoad && loadedReloadKey.current === reloadKey) return;
    loadedReloadKey.current = reloadKey;
    if (scope !== 'church' && !userKeys.length) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadInteractionStatsData(scope, userKeys, requiredSince)
      .then((d) => !cancelled && setData(d))
      .catch((e) => {
        console.error('Statistiques des interactions :', e);
        if (!cancelled) setError(e?.message || 'Chargement impossible');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, userKeys.join(','), needsLoad, reloadKey]);

  const stats = useMemo(
    () => (data ? computeInteractionStats({ ...data, period, filters, now }) : null),
    [data, period, filters, now],
  );
  const shepherdRows = useMemo(() => (stats ? sortRows(stats.shepherds, sort.key, sort.asc) : []), [stats, sort]);

  const previousLabel = preset === 'custom' ? 'période précédente' : { week: 'sem. préc.', month: 'mois préc.', '3months': '3 mois préc.', year: 'année préc.' }[preset];
  const showShepherdFilter = scope !== 'shepherd' && (data?.shepherds.length ?? 0) > 1;
  const showFamilyFilter = scope !== 'shepherd' && (data?.families.length ?? 0) > 1;

  const handleExport = () => {
    if (!stats) return;
    try {
      exportInteractionStats({ period, shepherds: shepherdRows, forgotten: stats.forgotten, families: stats.families });
      toast.success('Export Excel téléchargé');
    } catch (e) {
      console.error(e);
      toast.error("L'export a échoué");
    }
  };

  if (error && !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 flex items-center justify-between gap-3">
        <span>Impossible de charger les statistiques : {error}</span>
        <button onClick={() => setReloadKey((k) => k + 1)} className="px-3 py-1.5 rounded-md bg-white border border-red-300 text-red-700 font-medium">
          Réessayer
        </button>
      </div>
    );
  }

  const forgottenShown = stats ? (showAllForgotten ? stats.forgotten : stats.forgotten.slice(0, 15)) : [];
  const typeTotal = stats ? INTERACTION_TYPES.reduce((n, t) => n + stats.byType[t], 0) : 0;

  return (
    <div className="space-y-4 sm:space-y-6" data-testid="interaction-stats">
      {/* Période et filtres */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPreset(p)}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-colors ${
                preset === p ? 'bg-[#00665C] text-white border-[#00665C]' : 'bg-white text-gray-700 border-gray-200 hover:border-[#00665C]'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <label className="flex items-center gap-1.5">
              Du
              <input
                type="date"
                value={custom.from}
                max={custom.to}
                onChange={(e) => e.target.value && setCustom((c) => ({ ...c, from: e.target.value }))}
                className="border border-gray-300 rounded-md px-2 py-1"
              />
            </label>
            <label className="flex items-center gap-1.5">
              au
              <input
                type="date"
                value={custom.to}
                min={custom.from}
                max={isoDay(now)}
                onChange={(e) => e.target.value && setCustom((c) => ({ ...c, to: e.target.value }))}
                className="border border-gray-300 rounded-md px-2 py-1"
              />
            </label>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {showShepherdFilter && (
            <select
              aria-label="Berger"
              value={filters.shepherdId ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, shepherdId: e.target.value || null }))}
              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm max-w-[220px]"
            >
              <option value="">Tous les bergers</option>
              {[...(data?.shepherds ?? [])]
                .sort((a, b) => a.fullName.localeCompare(b.fullName, 'fr'))
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName}
                  </option>
                ))}
            </select>
          )}
          {showFamilyFilter && (
            <select
              aria-label="Famille"
              value={filters.familyId ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, familyId: e.target.value || null }))}
              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm max-w-[200px]"
            >
              <option value="">Toutes les familles</option>
              {data?.families.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          )}
          <select
            aria-label="Type"
            value={filters.type ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, type: (e.target.value || null) as InteractionType | null }))}
            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
          >
            <option value="">Tous les types</option>
            {INTERACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {INTERACTION_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              disabled={loading}
              title="Actualiser"
              className="p-2 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={!stats}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#00665C] bg-white border border-[#00665C] rounded-md hover:bg-[#00665C]/10 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>
      </div>

      {!stats ? (
        <div className="text-center py-12 text-gray-500">Chargement des statistiques…</div>
      ) : (
        <>
          {/* Indicateurs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="Interactions"
              value={String(stats.kpis.total)}
              current={stats.kpis.total}
              previous={stats.kpis.previousTotal}
              previousLabel={previousLabel}
            />
            <KpiCard
              label="Âmes contactées"
              value={`${stats.kpis.soulsContacted} / ${stats.kpis.soulsFollowed}`}
              sub={`couverture ${formatPct(stats.kpis.soulsFollowed ? stats.kpis.soulsContacted / stats.kpis.soulsFollowed : null)}`}
              current={stats.kpis.soulsContacted}
              previous={stats.kpis.previousSoulsContacted}
              previousLabel={previousLabel}
            />
            {scope === 'shepherd' ? (
              <KpiCard
                label={`Sans contact depuis ${FORGOTTEN_AFTER_DAYS} j`}
                value={String(stats.forgotten.length)}
                sub="âmes à rappeler"
              />
            ) : (
              <KpiCard
                label="Bergers actifs"
                value={`${stats.kpis.activeShepherds} / ${stats.kpis.shepherdsCount}`}
                sub="au moins une interaction"
                current={stats.kpis.activeShepherds}
                previous={stats.kpis.previousActiveShepherds}
                previousLabel={previousLabel}
              />
            )}
            <KpiCard
              label={scope === 'shepherd' ? 'Interactions par âme' : 'Moyenne par berger'}
              value={formatNumber(
                scope === 'shepherd'
                  ? stats.kpis.soulsFollowed
                    ? stats.kpis.total / stats.kpis.soulsFollowed
                    : 0
                  : stats.kpis.averagePerShepherd,
              )}
              current={stats.kpis.averagePerShepherd}
              previous={stats.kpis.previousAveragePerShepherd}
              previousLabel={previousLabel}
            />
          </div>

          {/* Évolution et répartition */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <section className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Évolution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.series} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {INTERACTION_TYPES.filter((t) => !filters.type || filters.type === t).map((t) => (
                      <Bar key={t} dataKey={t} name={INTERACTION_TYPE_LABELS[t]} stackId="a" fill={TYPE_COLORS[t]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Par type</h3>
              <div className="space-y-3">
                {INTERACTION_TYPES.map((t) => {
                  const count = stats.byType[t];
                  const share = typeTotal ? count / typeTotal : 0;
                  return (
                    <div key={t}>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">{INTERACTION_TYPE_LABELS[t]}</span>
                        <span className="font-medium text-gray-900">
                          {count} <span className="text-xs text-gray-400">({Math.round(share * 100)} %)</span>
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded mt-1">
                        <div className="h-2 rounded" style={{ width: `${share * 100}%`, background: TYPE_COLORS[t] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Classement des bergers */}
          {scope !== 'shepherd' && (
            <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-3 sm:px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-700">Bergers ({shepherdRows.length})</h3>
                <span className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded px-2 py-0.5">
                  en orange : aucune interaction sur la période
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="shepherd-ranking">
                  <thead className="bg-gray-50 text-xs text-gray-500">
                    <tr>
                      {SORT_LABELS.map((c) => (
                        <th key={c.key} className={`px-3 py-2 font-medium ${c.className ?? 'text-left'}`}>
                          <button
                            type="button"
                            onClick={() => setSort((s) => ({ key: c.key, asc: s.key === c.key ? !s.asc : c.key === 'name' }))}
                            className="inline-flex items-center gap-0.5 hover:text-gray-800"
                          >
                            {c.label}
                            {sort.key === c.key && (sort.asc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {shepherdRows.map((r) => {
                      const inactive = r.interactions === 0;
                      return (
                        <tr key={r.shepherd.id} className={inactive ? 'bg-orange-50' : ''} data-inactive={inactive || undefined}>
                          <td className={`px-3 py-2 ${inactive ? 'text-orange-800 font-medium' : 'text-gray-900'}`}>{r.shepherd.fullName}</td>
                          <td className="px-3 py-2 text-right">{r.soulsFollowed}</td>
                          <td className={`px-3 py-2 text-right font-medium ${inactive ? 'text-orange-700' : ''}`}>{r.interactions}</td>
                          <td className="px-3 py-2 text-right">{formatPct(r.coverage)}</td>
                          <td className="px-3 py-2 text-right text-gray-500 hidden sm:table-cell">{formatDate(r.lastContact)}</td>
                        </tr>
                      );
                    })}
                    {!shepherdRows.length && (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                          Aucun berger dans ce périmètre.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Âmes oubliées */}
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden" data-testid="forgotten-souls">
            <div className="px-3 sm:px-4 py-3 border-b flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-gray-700">
                Âmes sans contact depuis {FORGOTTEN_AFTER_DAYS} jours ou plus ({stats.forgotten.length})
              </h3>
            </div>
            {stats.forgotten.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-emerald-700">Toutes les âmes ont été contactées ces {FORGOTTEN_AFTER_DAYS} derniers jours.</p>
            ) : (
              <>
                <ul className="divide-y">
                  {forgottenShown.map((f) => {
                    const href = telHref(f.soul.phone);
                    return (
                      <li key={f.soul.id} className="px-3 sm:px-4 py-2.5 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{f.soul.fullName}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {scope !== 'shepherd' && <>Berger : {f.shepherdName}</>}
                            {scope === 'church' && f.familyName && <> · {f.familyName}</>}
                            {scope !== 'shepherd' && ' · '}
                            {f.lastContact ? (
                              <span className={f.daysSince! >= 60 ? 'text-red-600' : 'text-amber-700'}>
                                dernier contact {formatDate(f.lastContact)} ({f.daysSince} j)
                              </span>
                            ) : (
                              <span className="text-red-600">aucun contact sur 12 mois</span>
                            )}
                          </p>
                        </div>
                        {href ? (
                          <a
                            href={href}
                            className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#00665C] text-white text-xs font-medium"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Appeler
                          </a>
                        ) : (
                          <span className="flex-shrink-0 text-xs text-gray-400">pas de numéro</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {stats.forgotten.length > 15 && (
                  <button
                    type="button"
                    onClick={() => setShowAllForgotten((v) => !v)}
                    className="w-full py-2.5 text-sm font-medium text-[#00665C] border-t hover:bg-gray-50"
                  >
                    {showAllForgotten ? 'Réduire la liste' : `Voir les ${stats.forgotten.length} âmes`}
                  </button>
                )}
              </>
            )}
          </section>

          {/* Familles */}
          {scope !== 'shepherd' && stats.families.length > 0 && (
            <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-3 sm:px-4 py-3 border-b">
                <h3 className="text-sm font-semibold text-gray-700">Par famille</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="family-table">
                  <thead className="bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Famille</th>
                      <th className="px-3 py-2 text-right font-medium">Âmes</th>
                      <th className="px-3 py-2 text-right font-medium">Interactions</th>
                      <th className="px-3 py-2 text-right font-medium">Couverture</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[...stats.families]
                      .sort((a, b) => (b.coverage ?? 0) - (a.coverage ?? 0))
                      .map((r) => (
                        <tr key={r.family.id}>
                          <td className="px-3 py-2 text-gray-900">{r.family.name}</td>
                          <td className="px-3 py-2 text-right">{r.soulsFollowed}</td>
                          <td className="px-3 py-2 text-right">{r.interactions}</td>
                          <td className="px-3 py-2 text-right">
                            <span className={r.coverage !== null && r.coverage < 0.5 ? 'text-orange-700 font-medium' : ''}>{formatPct(r.coverage)}</span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
