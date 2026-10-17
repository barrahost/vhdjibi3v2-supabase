import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { HandHelping, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CulteReportService } from '../services/culteReport.service';
import { CulteNeed, CulteNeedPriority } from '../types/culteReport.types';
import { getProfileDepartmentIds } from '../types/businessProfile.types';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';

const PRIORITY_STYLES: Record<CulteNeedPriority, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-600',
};

const PRIORITY_LABELS: Record<CulteNeedPriority, string> = {
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse',
};

export default function CulteNeedsManagement() {
  const { user, userRole } = useAuth();
  const [needs, setNeeds] = useState<CulteNeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddressed, setShowAddressed] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Un Pasteur Assistant (non admin) ne voit que les besoins de SES departements supervises
  const profiles = ((user as any)?.businessProfiles || []) as any[];
  const isAdminU = userRole === 'admin' || userRole === 'super_admin'
    || profiles.some((p) => p?.type === 'admin');
  const paProfile = profiles.find((p) => p?.type === 'pasteur_assistant');
  const supervisedIds = !isAdminU && paProfile ? getProfileDepartmentIds(paProfile) : [];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let data = await CulteReportService.getNeeds({ isAddressed: showAddressed ? undefined : false });
      if (supervisedIds.length > 0) {
        const { data: depts } = await supabase
          .from('departments')
          .select('name')
          .eq('church_id', getChurchId())
          .in('id', supervisedIds);
        const names = new Set((depts || []).map((d: any) => d.name));
        data = data.filter((n) => names.has(n.departmentName));
      }
      setNeeds(data);
    } catch (error) {
      console.error('Error loading needs:', error);
      toast.error('Erreur lors du chargement des besoins');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAddressed]);

  useEffect(() => { load(); }, [load]);

  const handleMarkAddressed = async (needId: string) => {
    setProcessingId(needId);
    try {
      await CulteReportService.markNeedAddressed(needId, user?.id || 'admin');
      toast.success('Besoin marqué comme traité');
      load();
    } catch (error) {
      console.error('Error marking need addressed:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <HandHelping className="w-6 h-6 text-[#00665C]" /> Besoins signalés
        </h1>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={showAddressed} onChange={(e) => setShowAddressed(e.target.checked)} />
          Afficher les besoins traités
        </label>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Chargement...</div>
      ) : needs.length === 0 ? (
        <div className="bg-white rounded-lg border p-10 text-center text-gray-500">
          Aucun besoin {showAddressed ? '' : 'en attente'}.
        </div>
      ) : (
        <div className="bg-white rounded-lg border divide-y">
          {needs.map((need) => (
            <div key={need.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">{need.departmentName}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_STYLES[need.priority]}`}>
                    {PRIORITY_LABELS[need.priority]}
                  </span>
                  {need.isAddressed && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <CheckCircle2 className="w-3 h-3" /> Traité
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 mt-1">{need.description}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(need.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
              {!need.isAddressed && (
                <button
                  onClick={() => handleMarkAddressed(need.id)}
                  disabled={processingId === need.id}
                  className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md disabled:opacity-50"
                >
                  {processingId === need.id ? '...' : 'Marquer traité'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
