import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../constants/roles';
import { SMSService } from '../services/sms.service';
import { SMSTest } from '../components/sms/SMSTest';
import SMSForm from '../components/sms/SMSForm';
import BulkSMSUndecided from '../components/sms/BulkSMSUndecided';
import { MessageCircle, CreditCard } from 'lucide-react';
import { isShepherdUser } from '../utils/roleHelpers';
import toast from 'react-hot-toast';

export default function SMSManagement() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [shepherdId, setShepherdId] = useState<string | null>(null);
  const [assignedSouls, setAssignedSouls] = useState<any[]>([]);
  const [smsBalance, setSmsBalance] = useState<{ credits: number | null; smsCount: number | null; smsCostXOF: number; balanceRaw: string }>({
    credits: null,
    smsCount: null,
    smsCostXOF: 24,
    balanceRaw: ''
  });
  const [loadingCredit, setLoadingCredit] = useState(false);
  const [activeTab, setActiveTab] = useState<'shepherd' | 'undecided'>('shepherd');
  const canManageUndecidedSouls = hasPermission(PERMISSIONS.MANAGE_SOULS);

  useEffect(() => {
    const loadShepherdData = async () => {
      if (!user) return;

      try {
        // Récupérer l'utilisateur (incluant bergers multi-casquettes)
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .eq('church_id', getChurchId())
          .eq('id', (() => { const s = localStorage.getItem('user'); return s ? JSON.parse(s).id : ''; })())
          .eq('status', 'active');

        if (usersError) throw usersError;

        const matched = usersData?.find((u: any) => isShepherdUser(u));

        if (matched) {
          const currentShepherdId = matched.id;
          setShepherdId(currentShepherdId);

          // Récupérer les âmes assignées
          const { data: soulsData, error: soulsError } = await supabase
            .from('souls')
            .select('id, full_name, nickname, phone')
            .eq('church_id', getChurchId())
            .eq('shepherd_id', currentShepherdId)
            .eq('status', 'active');

          if (soulsError) throw soulsError;

          setAssignedSouls((soulsData ?? []).map((soul: any) => ({
            id: soul.id,
            fullName: soul.full_name || soul.fullName || '',
            nickname: soul.nickname,
            phone: soul.phone.replace('+225', '')
          })));
        }
      } catch (error) {
        console.error('Error loading shepherd data:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadShepherdData();
  }, [user]);

  const loadSmsCredit = async () => {
    try {
      setLoadingCredit(true);
      const balance = await SMSService.getSMSBalance();
      setSmsBalance({
        credits: balance.credits,
        smsCount: balance.smsCount,
        smsCostXOF: balance.smsCostXOF ?? 24,
        balanceRaw: balance.balanceRaw ?? ''
      });
    } catch (error) {
      console.error('Error loading SMS credit:', error);
      toast.error('Erreur lors du chargement du crédit SMS');
    } finally {
      setLoadingCredit(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des SMS</h1>
        <div className="flex flex-wrap items-center gap-2">
          {canManageUndecidedSouls && (
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('shepherd')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'shepherd'
                    ? 'bg-[#00665C] text-white'
                    : 'text-gray-700 bg-white border border-gray-300'
                }`}
              >
                SMS aux âmes assignées
              </button>
              <button
                onClick={() => setActiveTab('undecided')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'undecided'
                    ? 'bg-[#00665C] text-white'
                    : 'text-gray-700 bg-white border border-gray-300'
                }`}
              >
                SMS aux âmes indécises
              </button>
            </div>
          )}
          <button
            onClick={loadSmsCredit}
            disabled={loadingCredit}
            className="flex items-center px-4 py-2 text-sm font-medium text-[#00665C] hover:bg-[#00665C]/10 border border-[#00665C] rounded-md"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {loadingCredit ? 'Chargement...' : 'Vérifier le crédit SMS'}
          </button>
        </div>
      </div>

      {(smsBalance.credits !== null || smsBalance.smsCount !== null) && (
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center space-x-4">
            <MessageCircle className="w-5 h-5 text-[#00665C]" />
            <div className="flex items-center space-x-2">
              <span className="font-medium">Crédit API: </span>
              <span className="text-[#00665C] font-bold">{smsBalance.balanceRaw || `XOF ${(smsBalance.credits || 0).toFixed(2)}`}</span>
              <span className="text-gray-500">crédits</span>
            </div>
            <span className="text-gray-400">•</span>
            <div className="flex items-center space-x-2">
              <span className="font-medium">Équivalent: </span>
              <span className="text-[#00665C] font-bold">{smsBalance.smsCount || 0}</span>
              <span className="text-gray-500">SMS</span>
              <span className="text-xs text-gray-400">(~{smsBalance.smsCostXOF} XOF/SMS — Côte d'Ivoire)</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'undecided' && canManageUndecidedSouls ? (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <BulkSMSUndecided />
        </div>
      ) : shepherdId ? (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-[#00665C] mb-4">
            Envoyer des SMS à mes âmes
          </h2>
          {assignedSouls.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Vous n'avez pas encore d'âmes assignées.
              </p>
              <p className="text-gray-500 mt-2">
                Contactez un administrateur pour vous assigner des âmes.
              </p>
            </div>
          ) : (
            <div>
              <SMSForm assignedSouls={assignedSouls} />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-[#00665C] mb-4">
            Test d'envoi SMS
          </h2>
          <SMSTest />
        </div>
      )}
    </div>
  );
}
