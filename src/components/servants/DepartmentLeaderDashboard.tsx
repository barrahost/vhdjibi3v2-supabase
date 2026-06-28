import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { Servant } from '../../types/servant.types';
import { ServantParticipationRate } from '../../types/departmentActivity.types';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Users, UserCheck, UserPlus, Crown, Download, Plus, TrendingUp, CalendarDays } from 'lucide-react';
import { ImportServantsModal } from './ImportServantsModal';
import { DepartmentActivityModal } from '../departments/DepartmentActivityModal';
import { DepartmentActivityService } from '../../services/departmentActivity.service';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';

interface Department {
  id: string;
  name: string;
  description?: string;
}

function participationBadge(rate: number, total: number) {
  if (total === 0) return { cls: 'bg-gray-100 text-gray-500', label: 'Aucune activité' };
  const pct = Math.round(rate * 100);
  if (rate >= 0.75) return { cls: 'bg-green-100 text-green-700', label: `${pct}%` };
  if (rate >= 0.5) return { cls: 'bg-yellow-100 text-yellow-700', label: `${pct}%` };
  return { cls: 'bg-red-100 text-red-700', label: `${pct}%` };
}

export default function DepartmentLeaderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [servants, setServants] = useState<Servant[]>([]);
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalServants: 0,
    activeServants: 0,
    promotedFromSouls: 0,
    shepherds: 0
  });
  const [showImportModal, setShowImportModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [participationRates, setParticipationRates] = useState<ServantParticipationRate[]>([]);

  const canManageDepartmentServants = hasPermission('MANAGE_DEPARTMENT_SERVANTS');

  // Récupérer le département de l'utilisateur via business profiles
  useEffect(() => {
    if (!user?.businessProfiles) {
      setLoading(false);
      return;
    }

    const loadDepartment = async () => {
      try {
        const deptLeaderProfile = user.businessProfiles.find(
          (p: any) => p.type === 'department_leader' && p.departmentId
        );
        if (!deptLeaderProfile?.departmentId) {
          setLoading(false);
          return;
        }
        const { data: deptRows } = await supabase
          .from('departments')
          .select('id, name, description')
          .eq('church_id', getChurchId())
          .eq('id', deptLeaderProfile.departmentId)
          .limit(1);
        if (deptRows && deptRows.length > 0) {
          const d = deptRows[0];
          setDepartment({ id: d.id, name: d.name, description: d.description });
        }
      } catch (error) {
        console.error('Erreur lors du chargement du département:', error);
      }
      setLoading(false);
    };

    loadDepartment();
  }, [user?.businessProfiles]);

  const loadParticipationRates = useCallback(async (deptId: string, servantIds: string[]) => {
    try {
      const rates = await DepartmentActivityService.getParticipationRates(deptId, servantIds);
      setParticipationRates(rates);
    } catch (e) {
      console.error('Erreur taux de participation:', e);
    }
  }, []);

  // Récupérer les serviteurs du département
  useEffect(() => {
    if (!department?.id) return;

    const loadServants = async () => {
      const { data } = await (supabase
        .from('servants')
        .select('*')
        .eq('church_id', getChurchId()) as any)
        .contains('department_ids', [department.id])
        .eq('status', 'active');

      const servantsData = (data ?? []).map((r: any) => ({
        id: r.id,
        fullName: r.full_name || '',
        nickname: r.nickname || '',
        gender: r.gender,
        phone: r.phone || '',
        email: r.email || '',
        departmentIds: r.department_ids || [],
        isHead: r.is_head || false,
        isShepherd: r.is_shepherd || false,
        originalSoulId: r.original_soul_id || null,
        status: r.status || 'active',
        createdAt: r.created_at ? new Date(r.created_at) : new Date(),
        updatedAt: r.updated_at ? new Date(r.updated_at) : new Date(),
        promotionDate: r.promotion_date ? new Date(r.promotion_date) : undefined
      } as Servant));

      setServants(servantsData);
      setStats({
        totalServants: servantsData.length,
        activeServants: servantsData.filter((s: any) => s.status === 'active').length,
        promotedFromSouls: servantsData.filter((s: any) => s.originalSoulId).length,
        shepherds: servantsData.filter((s: any) => s.isShepherd).length
      });

      await loadParticipationRates(department.id, servantsData.map((s: Servant) => s.id));
    };

    loadServants();

    const channel = supabase
      .channel('dept_servants_activities_' + department.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'servants' }, () => loadServants())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'department_activities' }, () => {
        loadParticipationRates(department.id, servants.map((s) => s.id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'department_activity_participations' }, () => {
        loadParticipationRates(department.id, servants.map((s) => s.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [department?.id, loadParticipationRates]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Chargement du tableau de bord...</div>
      </div>
    );
  }

  if (!department) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Crown className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Accès responsable de département
          </h3>
          <p className="text-muted-foreground">
            Vous devez être désigné comme responsable d'un département pour accéder à ce tableau de bord.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!canManageDepartmentServants) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-destructive">
            Vous n'avez pas la permission de gérer les serviteurs de département.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Serviteurs triés par taux de participation croissant (les moins actifs en tête)
  const rateMap = new Map(participationRates.map((r) => [r.servantId, r]));
  const servantsWithRates = servants.map((s) => ({
    servant: s,
    rate: rateMap.get(s.id) ?? { servantId: s.id, totalActivities: 0, presentCount: 0, rate: 0 },
  }));
  const sortedByParticipation = [...servantsWithRates].sort((a, b) => a.rate.rate - b.rate.rate);

  const totalActivities = participationRates[0]?.totalActivities ?? 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-[#00665C]/10 to-[#00665C]/5 p-4 sm:p-6 rounded-xl border border-[#00665C]/10">
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">
          {department.name}
        </h1>
        <p className="text-sm text-gray-500">
          {department.description || 'Tableau de bord responsable de département'}
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Users className="h-6 w-6 sm:h-7 sm:w-7 text-[#00665C] flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-none">{stats.totalServants}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 leading-tight">Serviteurs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <UserCheck className="h-6 w-6 sm:h-7 sm:w-7 text-green-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-none">{stats.activeServants}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 leading-tight">Actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <CalendarDays className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-none">{totalActivities}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 leading-tight">Activités</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Crown className="h-6 w-6 sm:h-7 sm:w-7 text-purple-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-none">{stats.shepherds}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 leading-tight">Bergers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suivi participation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#00665C]" />
              <span className="text-sm sm:text-base">Suivi participation</span>
            </div>
            <Button
              onClick={() => setShowActivityModal(true)}
              size="sm"
              className="h-8 px-3 text-xs bg-[#00665C] hover:bg-[#00665C]/90 text-white flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Activité
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {servants.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Aucun serviteur dans ce département</p>
            </div>
          ) : totalActivities === 0 ? (
            <div className="text-center py-6">
              <CalendarDays className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500 mb-1">Aucune activité enregistrée</p>
              <p className="text-xs text-gray-400">Cliquez sur "+ Activité" pour commencer le suivi</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {sortedByParticipation.map(({ servant, rate }) => {
                const badge = participationBadge(rate.rate, rate.totalActivities);
                return (
                  <div key={servant.id} className="flex items-center gap-3 py-2.5">
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      rate.totalActivities === 0 ? 'bg-gray-100 text-gray-400'
                        : rate.rate >= 0.75 ? 'bg-green-100 text-green-700'
                        : rate.rate >= 0.5 ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {servant.fullName.charAt(0).toUpperCase()}
                    </div>

                    {/* Nom + badges rôle */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-medium text-gray-900 truncate">{servant.fullName}</span>
                        {servant.isHead && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-[#00665C]/10 text-[#00665C] rounded-full font-medium">Chef</span>
                        )}
                        {servant.isShepherd && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">Berger</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {rate.totalActivities === 0
                          ? 'Aucune activité'
                          : `${rate.presentCount} / ${rate.totalActivities} activité${rate.totalActivities > 1 ? 's' : ''}`
                        }
                      </p>
                    </div>

                    {/* Badge taux */}
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste des serviteurs (gestion) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm sm:text-base">
            <span>Serviteurs du département</span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => setShowImportModal(true)}
                variant="default"
                size="sm"
                className="h-8 px-3 text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Importer
              </Button>
              <Button
                onClick={() => navigate('/serviteurs')}
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
              >
                Gérer tous
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {servants.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Aucun serviteur dans ce département</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {servants.map((servant) => (
                <div
                  key={servant.id}
                  className="flex items-center gap-3 py-2.5"
                >
                  <div className="w-8 h-8 rounded-full bg-[#00665C]/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-[#00665C]">
                    {servant.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {servant.fullName}
                      {servant.nickname && (
                        <span className="text-gray-400 font-normal ml-1 text-xs">({servant.nickname})</span>
                      )}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">
                      {[servant.phone, servant.email].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 flex-shrink-0">
                    {servant.isHead && (
                      <Badge variant="default" className="text-[9px] px-1.5 py-0 h-4 bg-[#00665C]">
                        Chef
                      </Badge>
                    )}
                    {servant.isShepherd && (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                        Berger
                      </Badge>
                    )}
                    {servant.originalSoulId && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-blue-600 border-blue-300">
                        Promu
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ImportServantsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        fixedDepartmentId={department.id}
      />

      <DepartmentActivityModal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        onSaved={() => {
          loadParticipationRates(department.id, servants.map((s) => s.id));
        }}
        departmentId={department.id}
        servants={servants}
        createdBy={user?.id}
      />
    </div>
  );
}
