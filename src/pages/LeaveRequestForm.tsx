import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { CheckCircle2, AlertCircle, Loader2, Plus, X, CalendarDays, ChevronDown } from 'lucide-react';
import { LeaveRequestService, LeaveUser, LeavePeriod } from '../services/leaveRequest.service';
import { getChurchId } from '../lib/churchId';
import { useChurch } from '../contexts/ChurchContext';

type PageState = 'loading' | 'ready' | 'submitting' | 'done' | 'error';

interface PeriodInput {
  id: string;
  startDate: string;
  endDate: string;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  shepherd: 'Berger',
  adn: 'ADN',
  department_leader: 'Resp. Département',
  family_leader: 'Resp. Famille',
  evangelist: 'Évangéliste',
};

function getRoleLabel(roles: string[]): string {
  if (!roles?.length) return 'Utilisateur';
  return roles.map(r => ROLE_LABELS[r] ?? r).join(', ');
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function todayStr(): string {
  return toDateStr(new Date());
}

function formatFr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function daysBetween(start: string, end: string): number {
  const a = new Date(start);
  const b = new Date(end);
  return Math.floor((b.getTime() - a.getTime()) / 86400000) + 1;
}

function validatePeriods(periods: PeriodInput[]): string[] {
  const errors: string[] = [];
  const today = todayStr();
  const sorted = [...periods]
    .filter(p => p.startDate && p.endDate)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  sorted.forEach((p, i) => {
    if (p.startDate < today) {
      errors.push(`Période ${i + 1} : la date de début doit être aujourd'hui ou dans le futur`);
    }
    if (p.endDate <= p.startDate) {
      errors.push(`Période ${i + 1} : la date de fin doit être après la date de début`);
    } else {
      const dur = daysBetween(p.startDate, p.endDate);
      if (dur > 14) {
        errors.push(`Période ${i + 1} : ${dur} jours — maximum 14`);
      }
    }
    if (i > 0) {
      const prev = sorted[i - 1];
      if (prev.endDate) {
        const gap = Math.floor(
          (new Date(p.startDate).getTime() - new Date(prev.endDate).getTime()) / 86400000
        );
        if (gap < 7) {
          errors.push(`Entre les périodes ${i} et ${i + 1} : ${gap} jour(s) — minimum 7`);
        }
      }
    }
  });

  return errors;
}

function newPeriod(): PeriodInput {
  return { id: Math.random().toString(36).slice(2), startDate: '', endDate: '' };
}

export default function LeaveRequestForm() {
  const { loading: churchLoading } = useChurch();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [users, setUsers] = useState<LeaveUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<LeaveUser | null>(null);
  const [periods, setPeriods] = useState<PeriodInput[]>([newPeriod()]);
  const [errors, setErrors] = useState<string[]>([]);
  const [existingPending, setExistingPending] = useState<LeavePeriod[]>([]);
  const [submittedCount, setSubmittedCount] = useState(0);

  useEffect(() => {
    if (churchLoading) return;
    const churchId = getChurchId();
    LeaveRequestService.getUsersForForm(churchId)
      .then(u => { setUsers(u); setPageState('ready'); })
      .catch(() => setPageState('error'));
  }, [churchLoading]);

  const handleUserSelect = async (userId: string) => {
    const user = users.find(u => u.id === userId) ?? null;
    setSelectedUser(user);
    setPeriods([newPeriod()]);
    setErrors([]);
    setExistingPending([]);
    if (!user) return;
    try {
      const existing = await LeaveRequestService.getUserExistingRequests(user.id, getChurchId());
      setExistingPending(existing);
    } catch {
      // silent — not critical
    }
  };

  const updatePeriod = (id: string, field: 'startDate' | 'endDate', value: string) => {
    const next = periods.map(p => p.id === id ? { ...p, [field]: value } : p);
    setPeriods(next);
    setErrors(validatePeriods(next));
  };

  const addPeriod = () => {
    const next = [...periods, newPeriod()];
    setPeriods(next);
    setErrors(validatePeriods(next));
  };

  const removePeriod = (id: string) => {
    const next = periods.filter(p => p.id !== id);
    if (next.length === 0) next.push(newPeriod());
    setPeriods(next);
    setErrors(validatePeriods(next));
  };

  const handleSubmit = async () => {
    const valid = periods.filter(p => p.startDate && p.endDate);
    const errs = validatePeriods(valid);
    if (errs.length > 0) { setErrors(errs); return; }
    if (!selectedUser || valid.length === 0) return;

    setPageState('submitting');
    try {
      await LeaveRequestService.submitRequests(
        selectedUser.id,
        selectedUser.fullName,
        getRoleLabel(selectedUser.roles),
        getChurchId(),
        valid.map(p => ({ start_date: p.startDate, end_date: p.endDate }))
      );
      setSubmittedCount(valid.length);
      setPageState('done');
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la soumission. Réessaie.');
      setPageState('ready');
    }
  };

  const completePeriods = periods.filter(p => p.startDate && p.endDate);
  const canSubmit = selectedUser && completePeriods.length > 0 && errors.length === 0;

  // ── États non-ready ─────────────────────────────────────────────────────

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#00665C] animate-spin mx-auto" />
          <p className="text-sm text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h1 className="text-lg font-semibold text-gray-800">Impossible de charger le formulaire</h1>
          <p className="text-sm text-gray-500">Vérifie ta connexion et réessaie.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-[#00665C] underline"
          >
            Recharger
          </button>
        </div>
      </div>
    );
  }

  if (pageState === 'done') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <CheckCircle2 className="w-14 h-14 text-[#00665C] mx-auto" />
          <h1 className="text-xl font-bold text-gray-800">Demande envoyée !</h1>
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-[#00665C]">{submittedCount}</span>{' '}
            période{submittedCount > 1 ? 's' : ''} soumise{submittedCount > 1 ? 's' : ''} pour{' '}
            <span className="font-medium">{selectedUser?.fullName}</span>.
          </p>
          <p className="text-xs text-gray-400">Le pasteur examinera ta demande prochainement.</p>
        </div>
      </div>
    );
  }

  // ── Formulaire ──────────────────────────────────────────────────────────

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-gray-50 flex flex-col">

        {/* Header */}
        <div className="bg-[#00665C] text-white px-4 pt-10 pb-6">
          <div className="max-w-lg mx-auto">
            <p className="text-xs text-white/60 mb-1 uppercase tracking-wide">Vases d'Honneur</p>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              Demande de congé
            </h1>
            <p className="text-sm text-white/80 mt-1.5 leading-snug">
              Max 14 jours d'affilée · Au moins 1 semaine entre deux périodes.
            </p>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6 pb-32">

          {/* Étape 1 — Identification */}
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">1. Qui êtes-vous ?</h2>
            <div className="relative">
              <select
                value={selectedUser?.id ?? ''}
                onChange={e => handleUserSelect(e.target.value)}
                className="w-full h-12 pl-3 pr-10 border border-gray-200 rounded-xl text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-[#00665C]/30 focus:border-[#00665C]"
              >
                <option value="">-- Sélectionner mon nom --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} {u.roles.length > 0 ? `(${getRoleLabel(u.roles)})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {existingPending.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 leading-relaxed">
                Tu as déjà {existingPending.length} demande{existingPending.length > 1 ? 's' : ''} en cours :{' '}
                {existingPending.map(p => `${formatFr(p.start_date)} → ${formatFr(p.end_date)}`).join(', ')}.{' '}
                <span className="font-medium">Ta nouvelle soumission les remplacera.</span>
              </div>
            )}
          </div>

          {/* Étape 2 — Périodes (visible si user sélectionné) */}
          {selectedUser && (
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">2. Tes périodes de congé</h2>

              {periods.map((p, idx) => {
                const dur = p.startDate && p.endDate ? daysBetween(p.startDate, p.endDate) : null;
                const durOk = dur !== null && dur >= 1 && dur <= 14;
                return (
                  <div key={p.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">
                        Période {idx + 1}
                        {durOk && (
                          <span className="ml-2 text-[#00665C]">{dur} jour{dur > 1 ? 's' : ''}</span>
                        )}
                        {dur !== null && dur > 14 && (
                          <span className="ml-2 text-red-500">{dur} jours — max 14</span>
                        )}
                      </span>
                      {periods.length > 1 && (
                        <button
                          onClick={() => removePeriod(p.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Début</label>
                        <input
                          type="date"
                          min={todayStr()}
                          value={p.startDate}
                          onChange={e => updatePeriod(p.id, 'startDate', e.target.value)}
                          className="w-full h-11 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00665C]/30 focus:border-[#00665C]"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Fin</label>
                        <input
                          type="date"
                          min={p.startDate || todayStr()}
                          value={p.endDate}
                          onChange={e => updatePeriod(p.id, 'endDate', e.target.value)}
                          className="w-full h-11 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00665C]/30 focus:border-[#00665C]"
                        />
                      </div>
                    </div>
                    {idx < periods.length - 1 && (
                      <div className="border-t border-gray-50 pt-1" />
                    )}
                  </div>
                );
              })}

              {/* Erreurs de validation */}
              {errors.length > 0 && (
                <div className="space-y-1">
                  {errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-500 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      {err}
                    </p>
                  ))}
                </div>
              )}

              {/* Ajouter une période */}
              <button
                onClick={addPeriod}
                className="w-full flex items-center justify-center gap-2 h-10 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-[#00665C]/50 hover:text-[#00665C] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter une période
              </button>
            </div>
          )}
        </div>

        {/* Footer fixe */}
        {selectedUser && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-3 pb-6">
            <div className="max-w-lg mx-auto space-y-1.5">
              {completePeriods.length > 0 && errors.length === 0 && (
                <p className="text-xs text-center text-gray-400">
                  {completePeriods.length} période{completePeriods.length > 1 ? 's' : ''} prête{completePeriods.length > 1 ? 's' : ''}
                </p>
              )}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || pageState === 'submitting'}
                className="w-full h-12 bg-[#00665C] text-white font-semibold rounded-xl hover:bg-[#00665C]/90 disabled:opacity-40 transition-colors text-sm flex items-center justify-center gap-2"
              >
                {pageState === 'submitting' && <Loader2 className="w-4 h-4 animate-spin" />}
                {pageState === 'submitting' ? 'Envoi en cours...' : 'Soumettre ma demande'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
