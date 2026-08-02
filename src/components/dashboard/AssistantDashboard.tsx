import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';
import { useAuth } from '../../contexts/AuthContext';
import { getProfileDepartmentIds } from '../../types/businessProfile.types';
import { DEPARTMENT_TO_REPORT_TYPE, normalizeDeptName } from '../../types/culteReport.types';
import { Eye, UsersRound, HandHelping, FileText, ChevronRight } from 'lucide-react';

/**
 * Tableau de bord Pasteur Assistant (PA/AP) — supervision de son portefeuille :
 * pour chaque département supervisé, l'état des rapports, l'effectif B.O.S.S
 * et les besoins en attente.
 */

interface DeptCard {
  id: string;
  name: string;
  reportType: string | null;
  lastReportDate: string | null;
  servantCount: number;
  pendingNeeds: number;
}

const frDate = (iso: string | null) => (iso ? iso.split('-').reverse().join('/') : null);

export function AssistantDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<DeptCard[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const churchId = getChurchId();
        const paProfile = ((user as any).businessProfiles || []).find((p: any) => p?.type === 'pasteur_assistant');
        const deptIds = getProfileDepartmentIds(paProfile);
        if (deptIds.length === 0) { setCards([]); return; }

        const [deptsRes, servantsRes, reportsRes, needsRes] = await Promise.all([
          supabase.from('departments').select('id, name').eq('church_id', churchId).in('id', deptIds),
          supabase.from('servants').select('department_ids').eq('church_id', churchId).eq('status', 'active'),
          supabase.from('culte_reports').select('department_id, service_date').eq('church_id', churchId)
            .in('department_id', deptIds).order('service_date', { ascending: false }),
          supabase.from('culte_report_needs').select('department_name').eq('church_id', churchId).eq('is_addressed', false),
        ]);
        if (cancelled) return;

        const servantCountByDept = new Map<string, number>();
        (servantsRes.data || []).forEach((s: any) => {
          (s.department_ids || []).forEach((id: string) => {
            servantCountByDept.set(id, (servantCountByDept.get(id) || 0) + 1);
          });
        });

        const lastReportByDept = new Map<string, string>();
        (reportsRes.data || []).forEach((r: any) => {
          if (r.department_id && !lastReportByDept.has(r.department_id)) {
            lastReportByDept.set(r.department_id, r.service_date);
          }
        });

        const needsByName = new Map<string, number>();
        (needsRes.data || []).forEach((n: any) => {
          needsByName.set(n.department_name, (needsByName.get(n.department_name) || 0) + 1);
        });

        setCards(
          (deptsRes.data || [])
            .map((d: any) => ({
              id: d.id,
              name: d.name,
              reportType: DEPARTMENT_TO_REPORT_TYPE[normalizeDeptName(d.name)] || null,
              lastReportDate: lastReportByDept.get(d.id) || null,
              servantCount: servantCountByDept.get(d.id) || 0,
              pendingNeeds: needsByName.get(d.name) || 0,
            }))
            .sort((a: DeptCard, b: DeptCard) => b.pendingNeeds - a.pendingNeeds || a.name.localeCompare(b.name, 'fr'))
        );
      } catch (e) {
        console.error('Error loading assistant dashboard:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  const totalNeeds = cards.reduce((sum, c) => sum + c.pendingNeeds, 0);
  const totalServants = cards.reduce((sum, c) => sum + c.servantCount, 0);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 flex items-center gap-2">
          <Eye className="w-6 h-6 text-[#00665C]" /> Mes départements supervisés
        </h1>
      </div>

      {/* Synthèse */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{cards.length}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">Départements</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{totalServants}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">B.O.S.S</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className={`text-2xl font-bold ${totalNeeds > 0 ? 'text-red-600' : 'text-gray-900'}`}>{totalNeeds}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">Besoins en attente</p>
        </div>
      </div>

      {/* Une carte par département */}
      {cards.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500 text-sm">Aucun département supervisé — demande à un admin de configurer ton profil.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {cards.map(dept => (
            <div key={dept.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-gray-900 truncate">{dept.name}</p>
                {dept.pendingNeeds > 0 && (
                  <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                    <HandHelping className="w-3 h-3" /> {dept.pendingNeeds} besoin{dept.pendingNeeds > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="mt-2.5 flex items-center gap-4 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <UsersRound className="w-3.5 h-3.5 text-gray-400" /> {dept.servantCount} B.O.S.S
                </span>
                {dept.reportType && (
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                    {dept.lastReportDate ? `Dernier rapport : ${frDate(dept.lastReportDate)}` : 'Aucun rapport'}
                  </span>
                )}
              </div>
              {dept.reportType && (
                <button
                  onClick={() => navigate(`/rapports/${dept.reportType}`)}
                  className="mt-2.5 text-xs text-[#00665C] hover:underline flex items-center"
                >
                  Voir les rapports <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {totalNeeds > 0 && (
        <button
          onClick={() => navigate('/besoins-rapports')}
          className="w-full py-3 bg-[#00665C] text-white text-sm font-medium rounded-xl hover:bg-[#00665C]/90 transition-colors"
        >
          Traiter les {totalNeeds} besoin{totalNeeds > 1 ? 's' : ''} en attente
        </button>
      )}
    </div>
  );
}
