import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Check, XCircle } from 'lucide-react';
import { AbsenceRequest } from '../../services/absenceRequest.service';

interface Props {
  requests: AbsenceRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase();
}

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700 border border-amber-200',
  approved: 'bg-green-100 text-green-700 border border-green-200',
  rejected: 'bg-red-100 text-red-400 border border-red-200 line-through',
};

function formatFr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function daysBetween(start: string, end: string): number {
  return Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
}

export function AbsenceCalendar({ requests, onApprove, onReject }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selected, setSelected] = useState<AbsenceRequest | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];

  let startPad = (firstDay.getDay() + 6) % 7;
  for (let i = startPad - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  const endPad = 7 - (days.length % 7);
  if (endPad < 7) {
    for (let i = 1; i <= endPad; i++) {
      days.push(new Date(year, month + 1, i));
    }
  }

  const getRequestsForDay = (date: Date): AbsenceRequest[] => {
    const ds = toDateStr(date);
    return requests.filter(r => r.startDate <= ds && r.endDate >= ds);
  };

  return (
    <div className="space-y-4">
      {/* Navigation mensuelle */}
      <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm">
        <button
          onClick={() => setCurrentDate(new Date(year, month - 1))}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </button>
        <h2 className="text-base font-semibold text-gray-800 capitalize">
          {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </h2>
        <button
          onClick={() => setCurrentDate(new Date(year, month + 1))}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Grille */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
            <div key={d} className="py-2 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 divide-x divide-y divide-gray-50">
          {days.map((date, i) => {
            const inMonth = date.getMonth() === month;
            const isToday = toDateStr(date) === toDateStr(new Date());
            const dayRequests = getRequestsForDay(date);

            return (
              <div
                key={i}
                className={`min-h-[70px] p-1 ${inMonth ? 'bg-white' : 'bg-gray-50/50'}`}
              >
                <div className={`text-right text-xs mb-1 px-1 ${
                  isToday
                    ? 'font-bold text-[#00665C]'
                    : inMonth ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  {date.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayRequests.slice(0, 3).map(r => (
                    <button
                      key={r.id}
                      onClick={() => setSelected(r)}
                      title={`${r.userName} — ${r.reason}`}
                      className={`w-full flex items-center justify-center rounded text-[9px] font-bold px-0.5 py-0.5 leading-none transition-opacity hover:opacity-80 ${STATUS_COLORS[r.status]}`}
                    >
                      {initials(r.userName)}
                    </button>
                  ))}
                  {dayRequests.length > 3 && (
                    <p className="text-[9px] text-gray-400 text-center">+{dayRequests.length - 3}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-4 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-200" />
          <span className="text-xs text-gray-500">En attente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-200" />
          <span className="text-xs text-gray-500">Approuvé</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-200" />
          <span className="text-xs text-gray-500">Refusé</span>
        </div>
      </div>

      {/* Panel détail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{selected.userName}</p>
                <p className="text-xs text-gray-400">{selected.userRole}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-full hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl text-sm space-y-1">
              <p className="text-gray-700">
                <span className="text-gray-400 text-xs">Du</span>{' '}
                <span className="font-medium">{formatFr(selected.startDate)}</span>{' '}
                <span className="text-gray-400 text-xs">au</span>{' '}
                <span className="font-medium">{formatFr(selected.endDate)}</span>
              </p>
              <p className="text-xs text-gray-400">
                {daysBetween(selected.startDate, selected.endDate)} jour{daysBetween(selected.startDate, selected.endDate) > 1 ? 's' : ''}
                {' · '}Soumis le {selected.submittedAt.toLocaleDateString('fr-FR')}
              </p>
              <p className="text-xs">
                <span className="text-gray-400">Motif : </span>
                <span className="font-medium text-[#00665C]">{selected.reason}</span>
              </p>
            </div>
            <div className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex ${
              selected.status === 'approved' ? 'bg-green-50 text-green-700' :
              selected.status === 'rejected' ? 'bg-red-50 text-red-600' :
              'bg-amber-50 text-amber-700'
            }`}>
              {selected.status === 'approved' ? 'Approuvé' : selected.status === 'rejected' ? 'Refusé' : 'En attente'}
              {selected.rejectionReason && ` · ${selected.rejectionReason}`}
            </div>
            {selected.status === 'pending' && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { onApprove(selected.id); setSelected(null); }}
                  className="flex items-center justify-center gap-1.5 h-10 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Approuver
                </button>
                <button
                  onClick={() => { onReject(selected.id); setSelected(null); }}
                  className="flex items-center justify-center gap-1.5 h-10 bg-red-50 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Refuser
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
