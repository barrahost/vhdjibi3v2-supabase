import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { StatCard } from './stats/StatCard';
import InteractionModal from '../interactions/InteractionModal';
import {
  Megaphone,
  Clock,
  CheckCircle2,
  TrendingUp,
  Phone,
  Plus,
  FileSpreadsheet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { EvangelizedSoul } from '../../types/evangelized.types';

interface InteractionLite {
  id: string;
  soulId: string;
  date: Date;
}

export default function EvangelistDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [evangelistId, setEvangelistId] = useState<string | null>(null);
  const [allSouls, setAllSouls] = useState<EvangelizedSoul[]>([]);
  const [interactions, setInteractions] = useState<InteractionLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [interactingSoul, setInteractingSoul] = useState<EvangelizedSoul | null>(null);

  // 1) Identifier l'évangéliste connecté
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        const usersQuery = query(
          collection(db, 'users'),
          where('uid', '==', user.uid),
          where('status', '==', 'active')
        );
        const snap = await getDocs(usersQuery);
        if (snap.empty) {
          if (!cancelled) {
            toast.error('Utilisateur non trouvé');
            setLoading(false);
          }
          return;
        }
        const data: any = snap.docs[0].data();
        const id = snap.docs[0].id;
        const hasProfile =
          data.role === 'evangelist' ||
          (Array.isArray(data.businessProfiles) &&
            data.businessProfiles.some(
              (p: any) => p?.type === 'evangelist' && p?.isActive !== false
            ));
        if (!hasProfile) {
          if (!cancelled) {
            toast.error("Vous devez avoir un profil Évangéliste pour accéder à ce tableau de bord");
            setLoading(false);
          }
          return;
        }
        if (!cancelled) setEvangelistId(id);
      } catch (e) {
        console.error('Error loading evangelist identity:', e);
        if (!cancelled) {
          toast.error('Erreur lors du chargement');
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  // 2) Écoute temps réel : toutes les âmes (importées + actives) + interactions
  useEffect(() => {
    if (!evangelistId) return;

    const soulsQuery = query(
      collection(db, 'evangelized_souls'),
      where('evangelistId', '==', evangelistId)
    );
    const interactionsQuery = query(
      collection(db, 'interactions'),
      where('shepherdId', '==', evangelistId)
    );

    const soulsUnsub = onSnapshot(
      soulsQuery,
      (snap) => {
        const data = snap.docs.map((d) => {
          const v: any = d.data();
          return {
            id: d.id,
            ...v,
            evangelizationDate: v.evangelizationDate?.toDate?.() ?? v.evangelizationDate,
            createdAt: v.createdAt?.toDate?.() ?? v.createdAt,
            updatedAt: v.updatedAt?.toDate?.() ?? v.updatedAt,
            importedAt: v.importedAt?.toDate?.() ?? v.importedAt,
          } as EvangelizedSoul;
        });
        setAllSouls(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to evangelized souls:', err);
        toast.error('Erreur de synchronisation');
        setLoading(false);
      }
    );

    const interUnsub = onSnapshot(
      interactionsQuery,
      (snap) => {
        const data = snap.docs.map((d) => {
          const v: any = d.data();
          return {
            id: d.id,
            soulId: v.soulId,
            date: v.date?.toDate ? v.date.toDate() : new Date(v.date),
          } as InteractionLite;
        });
        setInteractions(data);
      },
      (err) => console.error('Error listening to interactions:', err)
    );

    return () => {
      soulsUnsub();
      interUnsub();
    };
  }, [evangelistId]);

  const activeSouls = useMemo(
    () => allSouls.filter((s) => s.status === 'active' && !s.importedToSoulId),
    [allSouls]
  );

  const stats = useMemo(() => {
    const attentionThreshold = new Date();
    attentionThreshold.setDate(attentionThreshold.getDate() - 7);

    const imported = allSouls.filter(
      (s) => s.status === 'imported' || !!s.importedToSoulId
    );

    const needingAttention = activeSouls.filter((soul) => {
      const soulInter = interactions.filter((i) => i.soulId === soul.id);
      if (soulInter.length === 0) return true;
      const last = new Date(Math.max(...soulInter.map((i) => i.date.getTime())));
      return last < attentionThreshold;
    });

    const conversionRate =
      allSouls.length > 0 ? Math.round((imported.length / allSouls.length) * 100) : 0;

    return {
      total: allSouls.length,
      active: activeSouls.length,
      imported: imported.length,
      conversionRate,
      needingAttention: needingAttention.length,
    };
  }, [allSouls, activeSouls, interactions]);

  const soulsWithLastContact = useMemo(() => {
    return activeSouls
      .map((soul) => {
        const soulInter = interactions.filter((i) => i.soulId === soul.id);
        const lastContact =
          soulInter.length > 0
            ? new Date(Math.max(...soulInter.map((i) => i.date.getTime())))
            : null;
        const daysSince = lastContact
          ? Math.floor((Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
          : null;
        return { ...soul, lastContact, daysSince };
      })
      .sort((a, b) => {
        if (a.daysSince === null && b.daysSince === null) return 0;
        if (a.daysSince === null) return -1;
        if (b.daysSince === null) return 1;
        return b.daysSince - a.daysSince;
      });
  }, [activeSouls, interactions]);

  const getContactBadge = (daysSince: number | null) => {
    if (daysSince === null)
      return { label: 'Jamais contacté(e)', color: 'bg-red-100 text-red-700' };
    if (daysSince === 0) return { label: "Aujourd'hui", color: 'bg-green-100 text-green-700' };
    if (daysSince < 7) return { label: `Il y a ${daysSince}j`, color: 'bg-green-100 text-green-700' };
    if (daysSince <= 14)
      return { label: `Il y a ${daysSince}j`, color: 'bg-amber-100 text-amber-700' };
    return { label: `Il y a ${daysSince}j`, color: 'bg-red-100 text-red-700' };
  };

  const monthlyActivity = useMemo(() => {
    const months: { label: string; count: number; isCurrent: boolean }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('fr-FR', { month: 'short' });
      const count = allSouls.filter((s) => {
        if (!s.evangelizationDate) return false;
        const sd = new Date(s.evangelizationDate);
        return sd.getFullYear() === d.getFullYear() && sd.getMonth() === d.getMonth();
      }).length;
      months.push({ label, count, isCurrent: i === 0 });
    }
    return months;
  }, [allSouls]);

  const funnel = useMemo(() => {
    const neverContacted = activeSouls.filter(
      (s) => !interactions.some((i) => i.soulId === s.id)
    ).length;
    const contacted = stats.active - neverContacted;
    return { imported: stats.imported, contacted, neverContacted };
  }, [activeSouls, interactions, stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  const maxMonthly = Math.max(...monthlyActivity.map((m) => m.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900">Mon tableau de bord</h1>
        <button
          onClick={() => navigate('/ames-evangelisees')}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une âme évangélisée
        </button>
      </div>

      {/* 4 KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total évangélisées"
          value={stats.total}
          icon={Megaphone}
          trend={`${stats.total}`}
          trendLabel="âmes enregistrées"
        />
        <StatCard
          title="À suivre"
          value={stats.active}
          icon={Clock}
          trend={`${stats.active}`}
          trendLabel="pas encore converties"
          iconClassName="text-amber-500"
        />
        <StatCard
          title="Converties"
          value={stats.imported}
          icon={CheckCircle2}
          trend={`${stats.imported}`}
          trendLabel="venues au culte"
          iconClassName="text-green-600"
        />
        <StatCard
          title="Taux de conversion"
          value={stats.conversionRate}
          icon={TrendingUp}
          trend={`${stats.conversionRate}%`}
          trendLabel="évangélisées → église"
          iconClassName="text-[#00665C]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liste de relance */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#00665C]">Âmes à relancer</h2>
            <span className="text-xs text-red-600 font-medium">
              {stats.needingAttention} urgentes
            </span>
          </div>
          <div className="divide-y max-h-[400px] overflow-y-auto">
            {soulsWithLastContact.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                Toutes vos âmes ont été contactées récemment
              </div>
            ) : (
              soulsWithLastContact.map((soul) => {
                const badge = getContactBadge(soul.daysSince);
                const initials = soul.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();
                return (
                  <div key={soul.id} className="p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#E1F5EE] text-[#0F6E56] flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {soul.fullName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {soul.phone || '—'} · {soul.location}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                    <button
                      onClick={() => setInteractingSoul(soul)}
                      className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-[#00665C] text-white rounded-md hover:bg-[#00665C]/90"
                    >
                      <Phone className="w-3 h-3" />
                      <span className="hidden sm:inline">Contacter</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Colonne droite */}
        <div className="space-y-4">
          {/* Activité mensuelle */}
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Activité des 6 derniers mois
            </h3>
            <div className="flex items-end gap-2 h-24">
              {monthlyActivity.map((m, i) => {
                const heightPct = Math.max(Math.round((m.count / maxMonthly) * 100), 4);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-[10px] text-gray-600 font-medium">{m.count}</div>
                    <div
                      className="w-full rounded-t transition-all"
                      style={{
                        height: `${heightPct}%`,
                        background: m.isCurrent ? '#00665C' : '#9FE1CB',
                      }}
                    />
                    <span className="text-[10px] text-gray-400 capitalize">{m.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Entonnoir */}
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Entonnoir de suivi</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#1D9E75]" />
                <span className="flex-1 text-sm text-gray-700">Converties (venues au culte)</span>
                <span className="text-sm font-semibold text-[#0F6E56]">{funnel.imported}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#EF9F27]" />
                <span className="flex-1 text-sm text-gray-700">Contactées, à relancer</span>
                <span className="text-sm font-semibold text-amber-600">{funnel.contacted}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                <span className="flex-1 text-sm text-gray-700">Jamais contactées</span>
                <span className="text-sm font-semibold text-gray-500">{funnel.neverContacted}</span>
              </div>
            </div>
          </div>

          {/* Lien rapide import Excel */}
          <div className="bg-[#E1F5EE] rounded-lg border border-[#9FE1CB] p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#0F6E56]">Importer des âmes évangélisées</p>
              <p className="text-xs text-[#1D9E75]">
                Ajoutez plusieurs âmes évangélisées depuis un fichier Excel
              </p>
            </div>
            <button
              onClick={() => navigate('/ames-evangelisees')}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#00665C] text-white rounded-md hover:bg-[#00665C]/90"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Importer
            </button>
          </div>
        </div>
      </div>

      {interactingSoul && evangelistId && (
        <InteractionModal
          isOpen={!!interactingSoul}
          onClose={() => setInteractingSoul(null)}
          soulId={interactingSoul.id}
          shepherdId={evangelistId}
          soulName={interactingSoul.fullName}
          sourceCollection="evangelized_souls"
        />
      )}
    </div>
  );
}
