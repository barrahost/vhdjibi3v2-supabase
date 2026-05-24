import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { Bug, Clock, CheckCircle, AlertCircle, RefreshCw, Trash2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';

type Status = 'open' | 'in_progress' | 'resolved';
type Priority = 'low' | 'medium' | 'high';

interface BugReport {
  id: string;
  title: string;
  description: string;
  page_url: string;
  user_name: string;
  status: Status;
  priority: Priority;
  admin_note: string;
  created_at: string;
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; icon: any }> = {
  open:        { label: 'Ouvert',      color: 'bg-red-100 text-red-700',    icon: AlertCircle },
  in_progress: { label: 'En cours',    color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  resolved:    { label: 'Résolu',      color: 'bg-green-100 text-green-700',  icon: CheckCircle },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; dot: string }> = {
  low:    { label: 'Faible',  dot: 'bg-green-500' },
  medium: { label: 'Moyen',   dot: 'bg-yellow-500' },
  high:   { label: 'Urgent',  dot: 'bg-red-500' },
};

export default function BugReports() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const { confirm, confirmModalProps } = useConfirmModal();

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bug_reports')
      .select('*')
      .eq('church_id', getChurchId())
      .order('created_at', { ascending: false });
    if (error) { toast.error('Erreur de chargement'); setLoading(false); return; }
    setReports((data || []) as BugReport[]);
    const initNotes: Record<string, string> = {};
    (data || []).forEach((r: any) => { initNotes[r.id] = r.admin_note || ''; });
    setNotes(initNotes);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const updateStatus = async (id: string, status: Status) => {
    const { error } = await supabase.from('bug_reports').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error('Erreur'); return; }
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    toast.success('Statut mis à jour');
  };

  const saveNote = async (id: string) => {
    const { error } = await supabase.from('bug_reports').update({ admin_note: notes[id], updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error('Erreur'); return; }
    toast.success('Note sauvegardée');
  };

  const deleteReport = async (id: string) => {
    const ok = await confirm('Supprimer ce signalement définitivement ?');
    if (!ok) return;
    const { error } = await supabase.from('bug_reports').delete().eq('id', id);
    if (error) { toast.error('Erreur'); return; }
    setReports(prev => prev.filter(r => r.id !== id));
    toast.success('Signalement supprimé');
  };

  const filtered = filterStatus === 'all' ? reports : reports.filter(r => r.status === filterStatus);
  const counts = { all: reports.length, open: reports.filter(r => r.status === 'open').length, in_progress: reports.filter(r => r.status === 'in_progress').length, resolved: reports.filter(r => r.status === 'resolved').length };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bug className="w-6 h-6 text-red-600" /> Signalements de bugs
          </h1>
          <p className="text-sm text-gray-500 mt-1">{counts.open} ouvert{counts.open > 1 ? 's' : ''} · {counts.in_progress} en cours · {counts.resolved} résolu{counts.resolved > 1 ? 's' : ''}</p>
        </div>
        <button onClick={fetch} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'open', 'in_progress', 'resolved'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${filterStatus === s ? 'bg-[#00665C] text-white border-[#00665C]' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}
          >
            {s === 'all' ? 'Tous' : STATUS_CONFIG[s].label} ({counts[s]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Bug className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>Aucun signalement{filterStatus !== 'all' ? ' dans cette catégorie' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const S = STATUS_CONFIG[r.status];
            const P = PRIORITY_CONFIG[r.priority];
            const isOpen = expanded === r.id;
            return (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                >
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${P.dot}`} title={P.label} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{r.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {r.user_name} · {r.page_url} · {new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${S.color}`}>{S.label}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>

                {isOpen && (
                  <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Changer le statut</p>
                        <select
                          value={r.status}
                          onChange={e => updateStatus(r.id, e.target.value as Status)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00665C]"
                        >
                          <option value="open">Ouvert</option>
                          <option value="in_progress">En cours</option>
                          <option value="resolved">Résolu</option>
                        </select>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Priorité signalée</p>
                        <div className={`flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white`}>
                          <div className={`w-2 h-2 rounded-full ${P.dot}`} />
                          {P.label}
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Note interne</p>
                      <textarea
                        value={notes[r.id] || ''}
                        onChange={e => setNotes(n => ({ ...n, [r.id]: e.target.value }))}
                        placeholder="Ajouter une note de suivi…"
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00665C] resize-none"
                      />
                      <div className="flex justify-between mt-2">
                        <button
                          onClick={() => saveNote(r.id)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-lg"
                        >
                          Sauvegarder la note
                        </button>
                        <button
                          onClick={() => deleteReport(r.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <ConfirmModal {...confirmModalProps} />
    </div>
  );
}
