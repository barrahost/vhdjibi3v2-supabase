import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Droplets, Heart, MessageCircle, Phone, RotateCcw, Search, SlidersHorizontal, Sprout, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { useBaptismAccess } from '../hooks/useBaptismAccess';
import { useChurch } from '../contexts/ChurchContext';
import { BaptismService } from '../services/baptism.service';
import {
  CATEGORY_LABELS,
  DEFAULT_FILTERS,
  SORT_LABELS,
  bySpiritual,
  compareNames,
  inScope,
  percent,
  repairIvorianNumber,
  sortRows,
  stageOf,
  summarize,
  type BaptismFilters,
  type BaptismRow,
  type BaptismSort,
  type SoulCategory,
  type YesNoAll,
} from '../lib/baptism';
import { CustomPagination } from '../components/ui/CustomPagination';
import { Modal } from '../components/ui/Modal';
import { ProgressionTimeline } from '../components/souls/progression/ProgressionTimeline';
import { formatDate } from '../utils/dateUtils';
import { telHref, whatsappHref } from '../utils/phoneValidation';

const ITEMS_PER_PAGE = 20;

/** Vues prêtes à l'emploi (lien depuis le tableau de bord : /bapteme?vue=a-baptiser). */
const VIEWS: Record<string, Pick<BaptismFilters, 'baptism' | 'bornAgain'>> = {
  'a-baptiser': { bornAgain: 'yes', baptism: 'no' },
  baptises: { baptism: 'yes', bornAgain: 'all' },
  'nes-de-nouveau': { bornAgain: 'yes', baptism: 'all' },
  'pas-nes-de-nouveau': { bornAgain: 'no', baptism: 'all' },
};

const TONES = {
  teal: 'text-[#00665C] bg-[#00665C]/10',
  rose: 'text-rose-600 bg-rose-50',
  blue: 'text-blue-600 bg-blue-50',
  amber: 'text-amber-600 bg-amber-50',
  gray: 'text-gray-600 bg-gray-100',
} as const;

interface KpiProps {
  label: string;
  /** null : pas encore chargé (on n'affiche pas un faux 0). */
  value: number | null;
  hint: string;
  icon: LucideIcon;
  tone: keyof typeof TONES;
  active: boolean;
  onClick: () => void;
}

/** Compteur cliquable : un clic applique le filtre correspondant à la liste. */
function Kpi({ label, value, hint, icon: Icon, tone, active, onClick }: KpiProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`snap-start flex-shrink-0 w-[9.25rem] xl:w-auto text-left bg-white p-3 rounded-2xl border shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#00665C]/40 ${
        active ? 'border-[#00665C] ring-2 ring-[#00665C]' : 'border-gray-100 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide leading-tight">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 leading-none">{value ?? '–'}</p>
          <p className="text-[11px] sm:text-xs text-gray-600 mt-1 leading-tight">{value === null ? ' ' : hint}</p>
        </div>
        <span className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${TONES[tone]}`}>
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </span>
      </div>
    </button>
  );
}

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return (
    <div role="group" aria-label={label}>
      <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">{label}</p>
      <div className="flex w-full rounded-lg border border-gray-200 bg-gray-50 p-0.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`flex-1 px-2 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
              value === option.value ? 'bg-white text-[#00665C] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** 10/03/25 : la date courte tient à côté de l'intitulé sur un téléphone. */
const shortDate = (date: Date) => new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(date);

/** Oui (avec la date si on l'a) ou non. */
function StepPill({ done, date, compact = false }: { done: boolean; date: Date | null; compact?: boolean }) {
  return done ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 whitespace-nowrap">
      Oui{date && <span className="font-normal text-emerald-600">· {compact ? shortDate(date) : formatDate(date)}</span>}
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 whitespace-nowrap">Non</span>
  );
}

/** Appeler / écrire sur WhatsApp. `large` : boutons plus grands, faciles à toucher (cartes du téléphone). */
function ContactButtons({ phone, name, large = false }: { phone: string; name: string; large?: boolean }) {
  const dialable = repairIvorianNumber(phone);
  const tel = telHref(dialable);
  const whatsapp = whatsappHref(dialable);
  if (!tel && !whatsapp) return <span className="text-xs text-gray-400">—</span>;
  const size = large ? 'w-10 h-10' : 'w-8 h-8';
  const icon = large ? 'w-4 h-4' : 'w-3.5 h-3.5';
  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      {tel && (
        <a
          href={tel}
          aria-label={`Appeler ${name}`}
          title="Appeler"
          className={`inline-flex items-center justify-center ${size} text-[#00665C] border border-[#00665C]/40 rounded-lg hover:bg-[#00665C]/10 transition-colors`}
        >
          <Phone className={icon} />
        </a>
      )}
      {whatsapp && (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`WhatsApp ${name}`}
          title="WhatsApp"
          className={`inline-flex items-center justify-center ${size} text-[#25D366] border border-[#25D366]/40 rounded-lg hover:bg-[#25D366]/10 transition-colors`}
        >
          <MessageCircle className={icon} />
        </a>
      )}
    </div>
  );
}

function Badges({ row }: { row: BaptismRow }) {
  return (
    <>
      {stageOf(row) === 'to_baptize' && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">À baptiser</span>}
      {row.category === 'undecided' && <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">Indécis(e)</span>}
      {row.category === 'servant' && <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-700">B.O.S.S</span>}
    </>
  );
}

const SELECT_CLS = 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-[#00665C] focus:border-[#00665C]';

function BaptismFollowUpContent() {
  const [searchParams] = useSearchParams();
  const preset = VIEWS[searchParams.get('vue') ?? ''];
  const [rows, setRows] = useState<BaptismRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [filters, setFilters] = useState<BaptismFilters>({ ...DEFAULT_FILTERS, ...(preset ?? {}) });
  const [sort, setSort] = useState<BaptismSort>('name');
  const [showMore, setShowMore] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setRows(await BaptismService.fetchSouls());
      setFailed(false);
    } catch (error) {
      console.error('Error loading souls for baptism follow-up:', error);
      if (!silent) toast.error('Erreur lors du chargement des âmes');
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Chargement, puis mise à jour discrète quand une âme de cette église change (un berger complète sa fiche, une âme
  // arrive…). Le rechargement est regroupé (5 s) et attend que l'onglet soit visible : pendant un culte, les
  // inscriptions se suivent sans que la page recharge toutes les âmes à chaque fois.
  const refreshTimer = useRef<number | undefined>(undefined);
  const stale = useRef(false);
  useEffect(() => {
    load();
    const refresh = () => {
      if (document.hidden) {
        stale.current = true;
        return;
      }
      stale.current = false;
      load(true);
    };
    const channel = supabase
      .channel('baptism-followup-souls')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'souls', filter: `church_id=eq.${getChurchId()}` }, () => {
        window.clearTimeout(refreshTimer.current);
        refreshTimer.current = window.setTimeout(refresh, 5000);
      })
      .subscribe();
    const onVisible = () => {
      if (!document.hidden && stale.current) refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(refreshTimer.current);
      document.removeEventListener('visibilitychange', onVisible);
      supabase.removeChannel(channel);
    };
  }, [load]);

  // Un lien du tableau de bord (?vue=…) applique sa vue, même si la page est déjà ouverte
  const view = searchParams.get('vue');
  useEffect(() => {
    const next = VIEWS[view ?? ''];
    if (next) {
      setFilters((prev) => ({ ...prev, ...next }));
      setPage(1);
    }
  }, [view]);

  const patch = (next: Partial<BaptismFilters>) => {
    setFilters((prev) => ({ ...prev, ...next }));
    setPage(1);
  };

  // Le groupe étudié (type, berger, recherche) : les compteurs portent dessus ; puis le parcours (baptême, nouvelle naissance)
  const scope = useMemo(() => inScope(rows, filters), [rows, filters.category, filters.shepherd, filters.search]); // eslint-disable-line react-hooks/exhaustive-deps
  const summary = useMemo(() => summarize(scope), [scope]);
  const visible = useMemo(() => sortRows(bySpiritual(scope, filters), sort), [scope, filters.baptism, filters.bornAgain, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  const shepherds = useMemo(() => {
    const byKey = new Map<string, string>();
    rows.forEach((row) => {
      if (row.shepherdKey && row.shepherdName) byKey.set(row.shepherdKey, row.shepherdName);
    });
    return Array.from(byKey, ([key, name]) => ({ key, name })).sort((a, b) => compareNames(a.name, b.name));
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(visible.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = visible.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const filtersActive = filters.baptism !== 'all' || filters.bornAgain !== 'all' || filters.category !== 'all' || filters.shepherd !== null || filters.search.trim() !== '' || sort !== 'name';
  const moreCount = [filters.category !== 'all', filters.shepherd !== null, sort !== 'name'].filter(Boolean).length;
  const reset = () => {
    setFilters(DEFAULT_FILTERS);
    setSort('name');
    setPage(1);
  };

  const kpis: { id: string; label: string; value: number | null; hint: string; icon: LucideIcon; tone: keyof typeof TONES; set: Pick<BaptismFilters, 'baptism' | 'bornAgain'> }[] = [
    { id: 'all', label: 'Âmes', value: loading ? null : summary.total, hint: 'dans le groupe affiché', icon: Users, tone: 'teal', set: { baptism: 'all', bornAgain: 'all' } },
    { id: 'born-again', label: 'Nés de nouveau', value: loading ? null : summary.bornAgain, hint: percent(summary.bornAgain, summary.total), icon: Heart, tone: 'rose', set: { bornAgain: 'yes', baptism: 'all' } },
    { id: 'baptized', label: 'Baptisés', value: loading ? null : summary.baptized, hint: percent(summary.baptized, summary.total), icon: Droplets, tone: 'blue', set: { baptism: 'yes', bornAgain: 'all' } },
    { id: 'to-baptize', label: 'À baptiser', value: loading ? null : summary.toBaptize, hint: 'nés de nouveau, pas encore baptisés', icon: Droplets, tone: 'amber', set: { bornAgain: 'yes', baptism: 'no' } },
    { id: 'not-born-again', label: 'Pas encore nés de nouveau', value: loading ? null : summary.notBornAgain, hint: percent(summary.notBornAgain, summary.total), icon: Sprout, tone: 'gray', set: { bornAgain: 'no', baptism: 'all' } },
  ];

  const yesNo: { value: YesNoAll; label: string }[] = [
    { value: 'all', label: 'Tous' },
    { value: 'yes', label: 'Oui' },
    { value: 'no', label: 'Non' },
  ];

  const open = (row: BaptismRow) => setSelectedId(row.id);
  const selected = selectedId ? rows.find((row) => row.id === selectedId) ?? null : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Suivi du baptême</h1>
        <p className="mt-1 text-sm text-gray-500">Toutes les âmes de l’église, avec leur nouvelle naissance et leur baptême : de quoi suivre, appeler et agir.</p>
      </div>

      {/* Compteurs : bande défilante sur téléphone, une rangée sur grand écran. Un clic applique le filtre. */}
      <div role="group" aria-label="Compteurs" className="flex gap-3 overflow-x-auto snap-x pb-1 xl:grid xl:grid-cols-5 xl:overflow-visible">
        {kpis.map((kpi) => (
          <Kpi
            key={kpi.id}
            label={kpi.label}
            value={kpi.value}
            hint={kpi.hint}
            icon={kpi.icon}
            tone={kpi.tone}
            active={filters.baptism === kpi.set.baptism && filters.bornAgain === kpi.set.bornAgain}
            onClick={() => patch(kpi.set)}
          />
        ))}
      </div>

      <div className="bg-white rounded-lg border p-3 sm:p-4 space-y-3 sm:space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="search"
            aria-label="Rechercher une âme"
            placeholder="Nom, téléphone, lieu ou berger…"
            value={filters.search}
            onChange={(e) => patch({ search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Segmented label="Baptisé(e)" value={filters.baptism} options={yesNo} onChange={(baptism) => patch({ baptism })} />
          <Segmented label="Né(e) de nouveau" value={filters.bornAgain} options={yesNo} onChange={(bornAgain) => patch({ bornAgain })} />
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            aria-expanded={showMore}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#00665C] hover:underline"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Plus de filtres
            {moreCount > 0 && <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-[#00665C] rounded-full">{moreCount}</span>}
          </button>
          {filtersActive && (
            <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[#00665C]">
              <RotateCcw className="w-4 h-4" />
              Réinitialiser
            </button>
          )}
        </div>

        {showMore && (
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm font-medium text-gray-700">
              Type d’âme
              <select value={filters.category} onChange={(e) => patch({ category: e.target.value as BaptismFilters['category'] })} className={`${SELECT_CLS} mt-1`}>
                <option value="all">Toutes</option>
                {(Object.keys(CATEGORY_LABELS) as SoulCategory[]).map((key) => (
                  <option key={key} value={key}>
                    {CATEGORY_LABELS[key]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Berger(e)
              <select value={filters.shepherd ?? ''} onChange={(e) => patch({ shepherd: e.target.value || null })} className={`${SELECT_CLS} mt-1`}>
                <option value="">Tous les berger(e)s</option>
                <option value="unassigned">Non assigné(e)s</option>
                {shepherds.map((shepherd) => (
                  <option key={shepherd.key} value={shepherd.key}>
                    {shepherd.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Trier par
              <select value={sort} onChange={(e) => { setSort(e.target.value as BaptismSort); setPage(1); }} className={`${SELECT_CLS} mt-1`}>
                {(Object.keys(SORT_LABELS) as BaptismSort[]).map((key) => (
                  <option key={key} value={key}>
                    {SORT_LABELS[key]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500" aria-live="polite">
        {loading ? 'Chargement des âmes…' : failed && rows.length === 0 ? '' : `${visible.length} âme${visible.length > 1 ? 's' : ''} affichée${visible.length > 1 ? 's' : ''} sur ${rows.length}`}
      </p>

      {failed && !loading && rows.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg border">
          <p className="text-gray-600">Les âmes n’ont pas pu être chargées.</p>
          <button type="button" onClick={() => load()} className="mt-3 px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md">
            Réessayer
          </button>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center min-h-[200px] bg-white rounded-lg border">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00665C]" />
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg border">
          <p className="text-gray-500">{rows.length === 0 ? 'Aucune âme enregistrée pour le moment.' : 'Aucune âme ne correspond à ces filtres.'}</p>
        </div>
      ) : (
        <>
          {/* Téléphone et petit écran : une carte par âme */}
          <div className="xl:hidden space-y-3">
            {pageRows.map((row) => (
              <div key={row.id} className="bg-white rounded-lg border shadow-sm overflow-hidden active:bg-gray-50 transition-colors" onClick={() => open(row)}>
                <div className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-brand-700">{row.fullName.charAt(0).toUpperCase() || '?'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-y-1">
                        <button type="button" onClick={() => open(row)} className="text-left min-w-0">
                          <span className="text-sm font-semibold text-gray-900">{row.fullName}</span>
                        </button>
                        <Badges row={row} />
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500 truncate">{[row.phone, row.location, row.firstVisitDate ? `visite ${shortDate(row.firstVisitDate)}` : ''].filter(Boolean).join(' · ') || '—'}</p>
                      <div className="mt-1.5 space-y-1 text-xs text-gray-600">
                        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                          <Heart className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" aria-hidden="true" /> Né(e) de nouveau <StepPill done={row.bornAgain} date={row.bornAgainDate} compact />
                        </p>
                        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                          <Droplets className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" aria-hidden="true" /> Baptisé(e) <StepPill done={row.baptized} date={row.baptismDate} compact />
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-3">
                    <p className="text-xs text-brand-700 truncate min-w-0">Berger(e) : {row.shepherdName || (row.shepherdId ? '—' : 'non assigné(e)')}</p>
                    <ContactButtons phone={row.phone} name={row.fullName} large />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="xl:hidden">
              <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} totalItems={visible.length} itemsPerPage={ITEMS_PER_PAGE} />
            </div>
          )}

          {/* Grand écran : tableau, la nouvelle naissance et le baptême juste après le nom */}
          <div className="hidden xl:block bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-3 py-3">Nom et prénoms</th>
                    <th className="px-3 py-3">Nouvelle naissance</th>
                    <th className="px-3 py-3">Baptême</th>
                    <th className="px-3 py-3">Téléphone</th>
                    <th className="px-3 py-3">Berger(e)</th>
                    <th className="px-3 py-3 hidden 2xl:table-cell">Première visite</th>
                    <th className="px-3 py-3">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pageRows.map((row) => (
                    <tr key={row.id} onClick={() => open(row)} className="cursor-pointer hover:bg-gray-50">
                      <td className="px-3 py-2.5">
                        <div>
                          <button type="button" onClick={() => open(row)} className="text-left font-medium text-gray-900 hover:text-[#00665C]">
                            {row.fullName}
                          </button>
                          {row.nickname && <span className="ml-2 text-gray-500">({row.nickname})</span>}
                          <Badges row={row} />
                        </div>
                        {row.location && <p className="text-xs text-gray-500">{row.location}</p>}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap"><StepPill done={row.bornAgain} date={row.bornAgainDate} /></td>
                      <td className="px-3 py-2.5 whitespace-nowrap"><StepPill done={row.baptized} date={row.baptismDate} /></td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-gray-600">{row.phone || '—'}</td>
                      <td className="px-3 py-2.5 text-gray-900">{row.shepherdName || (row.shepherdId ? '—' : 'Non assigné(e)')}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-gray-600 hidden 2xl:table-cell">{row.firstVisitDate ? formatDate(row.firstVisitDate) : '—'}</td>
                      <td className="px-3 py-2.5"><ContactButtons phone={row.phone} name={row.fullName} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} totalItems={visible.length} itemsPerPage={ITEMS_PER_PAGE} />
            )}
          </div>
        </>
      )}

      {selected && (
        <Modal isOpen onClose={() => setSelectedId(null)} title={selected.fullName}>
          <div className="overflow-y-auto p-6 space-y-5">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {stageOf(selected) === 'to_baptize' && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">À baptiser</span>}
              {selected.category !== 'member' && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{selected.category === 'servant' ? 'B.O.S.S' : 'Indécis(e)'}</span>}
              {selected.nickname && <span className="text-gray-500">({selected.nickname})</span>}
            </div>

            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-xs font-medium text-gray-400 uppercase">Téléphone</dt>
                <dd className="mt-1 flex items-center gap-2 text-gray-900">
                  {selected.phone || '—'}
                  <ContactButtons phone={selected.phone} name={selected.fullName} />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-400 uppercase">Lieu d’habitation</dt>
                <dd className="mt-1 text-gray-900">{selected.location || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-400 uppercase">Berger(e)</dt>
                <dd className="mt-1 flex items-center gap-2 text-gray-900">
                  {selected.shepherdName || (selected.shepherdId ? '—' : 'Non assigné(e)')}
                  {selected.shepherdPhone && <ContactButtons phone={selected.shepherdPhone} name={selected.shepherdName} />}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-400 uppercase">Première visite</dt>
                <dd className="mt-1 text-gray-900">{selected.firstVisitDate ? formatDate(selected.firstVisitDate) : '—'}</dd>
              </div>
            </dl>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Parcours spirituel</h3>
              <ProgressionTimeline spiritualProfile={{ ...selected.profile, isBornAgain: selected.bornAgain, isBaptized: selected.baptized } as any} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/** Suivi du baptême : réservé à la direction et au responsable du département Baptême (et à l'église dont le module « âmes » est actif). */
export default function BaptismFollowUp() {
  const access = useBaptismAccess();
  const { hasModule } = useChurch();
  if (access.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00665C]" />
      </div>
    );
  }
  if (access.failed) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border">
        <p className="text-gray-600">Impossible de vérifier votre accès pour le moment.</p>
        <button type="button" onClick={access.retry} className="mt-3 px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md">
          Réessayer
        </button>
      </div>
    );
  }
  if (!access.canView || !hasModule('souls')) return <Navigate to="/" replace />;
  return <BaptismFollowUpContent />;
}
