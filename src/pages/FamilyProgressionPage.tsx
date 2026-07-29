import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { useAuth } from '../contexts/AuthContext';
import { FamilyLeaderService } from '../services/familyLeader.service';
import { ProgressionTimeline } from '../components/souls/progression/ProgressionTimeline';
import { CustomPagination } from '../components/ui/CustomPagination';
import { StatCard } from '../components/dashboard/stats/StatCard';
import { Search, TrendingUp, Heart, Droplets, BookOpen, Users2, Briefcase, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { Soul } from '../types/database.types';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 5;

export default function FamilyProgressionPage() {
  const { user } = useAuth();
  const [souls, setSouls] = useState<Soul[]>([]);
  const [familyName, setFamilyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSoulId, setExpandedSoulId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      const userId = user?.id || user?.uid;
      if (!userId) return;
      try {
        const fam = await FamilyLeaderService.getFamilyByLeaderId(userId);
        if (!fam) { setLoading(false); return; }
        setFamilyName(fam.name);

        const { data, error } = await supabase
          .from('souls')
          .select('*')
          .eq('church_id', getChurchId())
          .eq('service_family_id', fam.id)
          .eq('status', 'active');

        if (error) throw error;

        setSouls((data || []).map((row: any) => ({
          ...row,
          fullName: row.fullName || row.full_name || '',
          shepherdId: row.shepherdId || row.shepherd_id,
          isUndecided: row.isUndecided ?? row.is_undecided ?? false,
          spiritualProfile: row.spiritualProfile || row.spiritual_profile,
          firstVisitDate: row.first_visit_date ? new Date(row.first_visit_date) : undefined,
        } as Soul)));
      } catch {
        toast.error('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const stats = useMemo(() => {
    const total = souls.length;
    return {
      total,
      bornAgain: souls.filter(s => s.spiritualProfile?.isBornAgain).length,
      baptized: souls.filter(s => s.spiritualProfile?.isBaptized).length,
      academy: souls.filter(s => s.spiritualProfile?.isEnrolledInAcademy).length,
      lifeBearers: souls.filter(s => s.spiritualProfile?.isEnrolledInLifeBearers).length,
      serving: souls.filter(s => (s.spiritualProfile?.departments?.length ?? 0) > 0).length,
    };
  }, [souls]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return souls;
    return souls.filter(s => s.fullName?.toLowerCase().includes(q));
  }, [souls, searchTerm]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loading) return <div className="text-center py-12 text-gray-500">Chargement...</div>;

  if (!familyName) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
        <p className="text-amber-800">Aucune famille assignée. Contactez un administrateur.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Progression — Famille {familyName}</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Total" value={stats.total} icon={Heart} trend="" trendLabel="membres" iconClassName="text-[#00665C]" />
        <StatCard title="Nés de nouveau" value={stats.bornAgain} icon={TrendingUp} trend={stats.total ? `${Math.round(stats.bornAgain / stats.total * 100)}%` : '0%'} trendLabel="" iconClassName="text-green-600" />
        <StatCard title="Baptisés" value={stats.baptized} icon={Droplets} trend={stats.total ? `${Math.round(stats.baptized / stats.total * 100)}%` : '0%'} trendLabel="" iconClassName="text-blue-600" />
        <StatCard title="Académie" value={stats.academy} icon={BookOpen} trend={stats.total ? `${Math.round(stats.academy / stats.total * 100)}%` : '0%'} trendLabel="" iconClassName="text-purple-600" />
        <StatCard title="En service" value={stats.serving} icon={Briefcase} trend={stats.total ? `${Math.round(stats.serving / stats.total * 100)}%` : '0%'} trendLabel="" iconClassName="text-amber-600" />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un membre..."
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-500 bg-white border rounded-lg">
          <Users2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p>{searchTerm ? 'Aucun membre ne correspond.' : 'Aucun membre dans cette famille.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map(soul => (
            <div key={soul.id} className="bg-white border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedSoulId(expandedSoulId === soul.id ? null : soul.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{soul.fullName}</span>
                {expandedSoulId === soul.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {expandedSoulId === soul.id && (
                <div className="px-4 pb-4 border-t">
                  <ProgressionTimeline soul={soul} />
                </div>
              )}
            </div>
          ))}
          {totalPages > 1 && (
            <CustomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filtered.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          )}
        </div>
      )}
    </div>
  );
}
