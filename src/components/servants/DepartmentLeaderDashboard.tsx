import { useState, useEffect } from 'react';

import { Servant } from '../../types/servant.types';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Users, UserCheck, UserPlus, Crown, Download } from 'lucide-react';
import { ImportServantsModal } from './ImportServantsModal';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';

interface Department {
  id: string;
  name: string;
  description?: string;
}

export default function DepartmentLeaderDashboard() {
  const { user } = useAuth();
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

  const canManageDepartmentServants = hasPermission('MANAGE_DEPARTMENT_SERVANTS');

  // Récupérer le département de l'utilisateur via business profiles
  useEffect(() => {
    if (!user?.businessProfiles) {
      setLoading(false);
      return;
    }

    const loadDepartment = async () => {
      try {
        // Find the department_leader profile
        const deptLeaderProfile = user.businessProfiles.find(
          (p: any) => p.type === 'department_leader' && p.departmentId
        );
        
        if (!deptLeaderProfile?.departmentId) {
          console.log('User has no department_leader profile with departmentId');
          setLoading(false);
          return;
        }
        
        // Get department details
        const { data: deptRows } = await supabase.from('departments').select('id, name, description').eq('church_id', getChurchId()).eq('id', deptLeaderProfile.departmentId).limit(1);
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

  // Récupérer les serviteurs du département
  useEffect(() => {
    if (!department?.id) return;

    const loadServants = async () => {
      const { data } = await supabase.from('servants').select('*').eq('church_id', getChurchId()).eq('department_id', department.id).eq('status', 'active');
      const servantsData = (data ?? []).map((r: any) => ({
        id: r.id,
        fullName: r.full_name || '',
        nickname: r.nickname || '',
        gender: r.gender,
        phone: r.phone || '',
        email: r.email || '',
        departmentId: r.department_id || '',
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
    };
    loadServants();
    const channel = supabase.channel('dept_servants_' + department.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'servants' }, () => loadServants())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [department?.id]);

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

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Département: {department.name}
        </h1>
        <p className="text-muted-foreground">
          {department.description || 'Gérez les serviteurs de votre département'}
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalServants}</p>
                <p className="text-sm text-muted-foreground">Total serviteurs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.activeServants}</p>
                <p className="text-sm text-muted-foreground">Actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UserPlus className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.promotedFromSouls}</p>
                <p className="text-sm text-muted-foreground">Promus d'âmes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.shepherds}</p>
                <p className="text-sm text-muted-foreground">Bergers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des serviteurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>Serviteurs du département</span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => setShowImportModal(true)}
                variant="default"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Importer
              </Button>
              <Button
                onClick={() => window.location.href = '/serviteurs'}
                variant="outline"
                size="sm"
              >
                Gérer tous les serviteurs
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {servants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun serviteur dans ce département</p>
            </div>
          ) : (
            <div className="space-y-3">
              {servants.map((servant) => (
                <div
                  key={servant.id}
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground break-words">
                      {servant.fullName}
                      {servant.nickname && (
                        <span className="text-muted-foreground ml-2">({servant.nickname})</span>
                      )}
                    </h4>
                    <div className="text-sm text-muted-foreground break-words">
                      {[servant.email, servant.phone].filter(Boolean).join(' • ')}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {servant.isHead && (
                      <Badge variant="default" className="bg-primary">
                        Responsable
                      </Badge>
                    )}
                    {servant.isShepherd && (
                      <Badge variant="secondary">
                        Berger
                      </Badge>
                    )}
                    {servant.originalSoulId && (
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        Promu d'âme
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
    </div>
  );
}