import { useState } from 'react';
import { Check, XCircle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { LeaveRequest } from '../../services/leaveRequest.service';

interface Props {
  requests: LeaveRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
  onDelete: (id: string) => void;
}

type Filter = 'all' | 'pending' | 'approved' | 'rejected';

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Refusé',
};

const STATUS_CHIPS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
};

function formatFr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function daysBetween(start: string, end: string): number {
  return Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
}

export function LeaveRequestList({ requests, onApprove, onReject, onDelete }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const handleRejectConfirm = (id: string) => {
    onReject(id, rejectReason.trim() || undefined);
    setRejectingId(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(['all', 'pending', 'approved', 'rejected'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-[#00665C] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? `Tous (${requests.length})` : `${STATUS_LABELS[f]}${f === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}`}
          </button>
        ))}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400">
          <p className="text-sm">Aucune demande{filter !== 'all' ? ` "${STATUS_LABELS[filter]?.toLowerCase()}"` : ''}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50 overflow-hidden">
          {filtered.map(r => (
            <div key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 truncate">{r.userName}</p>
                    <span className="text-xs text-gray-400">{r.userRole}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {formatFr(r.startDate)} → {formatFr(r.endDate)}{' '}
                    <span className="text-gray-400">
                      ({daysBetween(r.startDate, r.endDate)} j)
                    </span>
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Soumis le {r.submittedAt.toLocaleDateString('fr-FR')}
                    {r.reviewedAt && ` · Traité le ${r.reviewedAt.toLocaleDateString('fr-FR')}`}
                  </p>
                  {r.rejectionReason && (
                    <p className="text-xs text-red-500 mt-1 italic">Motif : {r.rejectionReason}</p>
                  )}
                </div>

                {/* Statut + actions */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_CHIPS[r.status]}`}>
                    {STATUS_LABELS[r.status]}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {r.status === 'pending' && (
                      <>
                        <button
                          onClick={() => onApprove(r.id)}
                          title="Approuver"
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (rejectingId === r.id) {
                              setRejectingId(null);
                              setRejectReason('');
                            } else {
                              setRejectingId(r.id);
                              setRejectReason('');
                            }
                          }}
                          title="Refuser"
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                        >
                          {rejectingId === r.id
                            ? <ChevronUp className="w-4 h-4" />
                            : <XCircle className="w-4 h-4" />
                          }
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setDeletingId(deletingId === r.id ? null : r.id)}
                      title="Supprimer"
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Zone de rejet inline */}
              {rejectingId === r.id && (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Motif du refus (optionnel)"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRejectConfirm(r.id)}
                      className="flex-1 h-9 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-colors"
                    >
                      Confirmer le refus
                    </button>
                    <button
                      onClick={() => { setRejectingId(null); setRejectReason(''); }}
                      className="px-4 h-9 border border-gray-200 text-gray-500 text-sm rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {/* Zone de suppression inline */}
              {deletingId === r.id && (
                <div className="mt-3 flex items-center justify-between gap-2 p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">Supprimer définitivement cette demande ?</p>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => { onDelete(r.id); setDeletingId(null); }}
                      className="px-3 h-8 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Supprimer
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="px-3 h-8 border border-gray-200 text-gray-500 text-xs rounded-lg hover:bg-white transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
