import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, List, Copy, Check, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { LeaveRequestService, LeaveRequest } from '../services/leaveRequest.service';
import { LeaveCalendar } from '../components/leaves/LeaveCalendar';
import { LeaveRequestList } from '../components/leaves/LeaveRequestList';

type Tab = 'calendar' | 'list';

export default function LeaveManagement() {
  const [tab, setTab] = useState<Tab>('list');
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const publicLink = `${window.location.origin}/conge`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await LeaveRequestService.getAllRequests();
      setRequests(data);
    } catch {
      toast.error('Impossible de charger les demandes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id: string) => {
    try {
      await LeaveRequestService.approveRequest(id);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved', reviewedAt: new Date() } : r));
      toast.success('Demande approuvée');
    } catch {
      toast.error('Erreur lors de l\'approbation');
    }
  };

  const handleReject = async (id: string, reason?: string) => {
    try {
      await LeaveRequestService.rejectRequest(id, reason);
      setRequests(prev => prev.map(r =>
        r.id === id ? { ...r, status: 'rejected', rejectionReason: reason, reviewedAt: new Date() } : r
      ));
      toast.success('Demande refusée');
    } catch {
      toast.error('Erreur lors du refus');
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    toast.success('Lien copié — partage-le via WhatsApp !');
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#00665C]" />
            Congés
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {requests.length} demande{requests.length !== 1 ? 's' : ''}
            {pendingCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded-full">
                {pendingCount} en attente
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#00665C] text-white text-sm font-medium rounded-xl hover:bg-[#00665C]/90 transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copié !' : 'Copier le lien'}
          </button>
        </div>
      </div>

      {/* Lien public */}
      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-400 mb-0.5">Lien à partager à toute l'équipe</p>
          <p className="text-xs text-gray-600 font-mono truncate">{publicLink}</p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setTab('list')}
          className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-sm font-medium transition-all ${
            tab === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <List className="w-4 h-4" />
          Liste
        </button>
        <button
          onClick={() => setTab('calendar')}
          className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-sm font-medium transition-all ${
            tab === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Calendrier
        </button>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-[#00665C] animate-spin" />
        </div>
      ) : (
        <>
          {tab === 'list' && (
            <LeaveRequestList
              requests={requests}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}
          {tab === 'calendar' && (
            <LeaveCalendar
              requests={requests}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}
        </>
      )}
    </div>
  );
}
