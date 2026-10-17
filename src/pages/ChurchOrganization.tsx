import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { getProfileDepartmentIds } from '../types/businessProfile.types';
import { Church, Network, UsersRound, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Organigramme vivant de l'église : Pasteur → Pasteurs Assistants → départements
 * supervisés avec leurs responsables et effectifs. Entièrement généré depuis les
 * profils métier — aucune saisie dédiée, toujours à jour.
 */

interface DeptNode {
  id: string;
  name: string;
  leaderName: string | null;
  servantCount: number;
}

interface AssistantNode {
  id: string;
  name: string;
  departments: DeptNode[];
}

export default function ChurchOrganization() {
  const [loading, setLoading] = useState(true);
  const [pastorName, setPastorName] = useState<string | null>(null);
  const [assistants, setAssistants] = useState<AssistantNode[]>([]);
  const [unassigned, setUnassigned] = useState<DeptNode[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const churchId = getChurchId();
        const [usersRes, deptsRes, servantsRes] = await Promise.all([
          supabase.from('users')
            .select('id, full_name, roles, business_profiles')
            .eq('church_id', churchId).eq('status', 'active'),
          supabase.from('departments')
            .select('id, name').eq('church_id', churchId).eq('status', 'active').order('name'),
          supabase.from('servants')
            .select('department_ids').eq('church_id', churchId).eq('status', 'active'),
        ]);
        if (cancelled) return;

        const users = usersRes.data || [];
        const departments = deptsRes.data || [];

        // Effectif B.O.S.S par département
        const servantCount = new Map<string, number>();
        (servantsRes.data || []).forEach((s: any) => {
          (s.department_ids || []).forEach((id: string) => {
            servantCount.set(id, (servantCount.get(id) || 0) + 1);
          });
        });

        // Responsable par département (profil department_leader)
        const leaderByDept = new Map<string, string>();
        users.forEach((u: any) => {
          const dl = (u.business_profiles || []).find((p: any) => p?.type === 'department_leader');
          if (dl) {
            getProfileDepartmentIds(dl).forEach((id) => {
              if (!leaderByDept.has(id)) leaderByDept.set(id, u.full_name);
            });
          }
        });

        const toNode = (d: any): DeptNode => ({
          id: d.id,
          name: d.name,
          leaderName: leaderByDept.get(d.id) || null,
          servantCount: servantCount.get(d.id) || 0,
        });

        // Pasteur (profil pasteur ou rôle hérité)
        const pastor = users.find((u: any) =>
          (u.business_profiles || []).some((p: any) => p?.type === 'pasteur') ||
          u.roles?.primary === 'pasteur'
        );
        setPastorName(pastor?.full_name || null);

        // Pasteurs Assistants et leurs portefeuilles
        const supervisedIds = new Set<string>();
        const assistantNodes: AssistantNode[] = users
          .map((u: any) => {
            const pa = (u.business_profiles || []).find((p: any) => p?.type === 'pasteur_assistant');
            if (!pa) return null;
            const deptIds = getProfileDepartmentIds(pa);
            deptIds.forEach((id) => supervisedIds.add(id));
            return {
              id: u.id,
              name: u.full_name,
              departments: departments.filter((d: any) => deptIds.includes(d.id)).map(toNode),
            };
          })
          .filter((a: AssistantNode | null): a is AssistantNode => a !== null)
          .sort((a: AssistantNode, b: AssistantNode) => a.name.localeCompare(b.name, 'fr'));
        setAssistants(assistantNodes);

        // Départements hors portefeuilles (rattachés directement au Pasteur)
        setUnassigned(departments.filter((d: any) => !supervisedIds.has(d.id)).map(toNode));
      } catch (e) {
        console.error('Error loading organization:', e);
        toast.error("Erreur lors du chargement de l'organisation");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement de l'organisation...</div>
      </div>
    );
  }

  const DeptCard = ({ dept }: { dept: DeptNode }) => (
    <div className="bg-white rounded-lg border border-gray-100 px-3 py-2">
      <p className="text-sm font-semibold text-gray-900 leading-tight">{dept.name}</p>
      <div className="flex items-center justify-between gap-2 mt-1">
        {dept.leaderName ? (
          <p className="text-xs text-gray-600 truncate">{dept.leaderName}</p>
        ) : (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Sans responsable
          </p>
        )}
        <span className="flex-shrink-0 inline-flex items-center gap-1 text-[11px] text-gray-400">
          <UsersRound className="w-3 h-3" /> {dept.servantCount}
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Network className="w-6 h-6 text-[#00665C]" /> Organisation de l'Église
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Structure vivante — générée automatiquement depuis les profils et responsabilités configurés.
        </p>
      </div>

      {/* Pasteur */}
      <div className="flex flex-col items-center">
        <div className="bg-[#00665C] text-white rounded-2xl px-8 py-4 shadow-md text-center">
          <Church className="w-6 h-6 mx-auto mb-1 text-[#F2B636]" />
          <p className="text-xs uppercase tracking-wider text-white/70">Pasteur</p>
          <p className="font-bold">{pastorName || 'Non défini'}</p>
        </div>
        {assistants.length > 0 && <div className="w-px h-6 bg-gray-300" />}
      </div>

      {/* Assistants et leurs départements */}
      {assistants.length === 0 ? (
        <p className="text-center text-sm text-gray-400">
          Aucun Pasteur Assistant configuré — attribue le profil dans les fiches utilisateur.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {assistants.map((a) => (
            <div key={a.id} className="space-y-2">
              <div className="bg-[#00665C]/90 text-white rounded-xl px-4 py-3 text-center shadow-sm">
                <p className="font-semibold text-sm">{a.name}</p>
                <p className="text-[11px] text-white/70 mt-0.5">
                  {a.departments.length} département{a.departments.length > 1 ? 's' : ''}
                </p>
              </div>
              <div className="space-y-1.5 pl-3 border-l-2 border-[#00665C]/20">
                {a.departments.map((d) => <DeptCard key={d.id} dept={d} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Départements rattachés directement au Pasteur */}
      {unassigned.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Rattachés directement au Pasteur
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5">
            {unassigned.map((d) => <DeptCard key={d.id} dept={d} />)}
          </div>
        </div>
      )}
    </div>
  );
}
