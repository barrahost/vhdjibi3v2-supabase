import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Search, Heart, Users as UsersIcon, Download, Loader2, UserPlus } from 'lucide-react';
import { useDepartments } from '../../hooks/useDepartments';
import { ServantService } from '../../services/servant.service';
import { validatePhoneNumber } from '../../utils/phoneValidation';
import { GenderRadioGroup } from '../ui/GenderRadioGroup';
import { usePermissions } from '../../hooks/usePermissions';
import toast from 'react-hot-toast';

interface ImportServantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** If provided, the target department is fixed (department leader case). */
  fixedDepartmentId?: string;
  onImported?: () => void;
}

interface SoulRow {
  id: string;
  fullName: string;
  phone?: string;
  gender?: 'male' | 'female';
  alreadyServant: boolean;
}

interface UserRow {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  role?: string;
  alreadyServant: boolean;
}

type Tab = 'souls' | 'users' | 'manual';

export function ImportServantsModal({ isOpen, onClose, fixedDepartmentId, onImported }: ImportServantsModalProps) {
  const { departments } = useDepartments();
  const { hasPermission } = usePermissions();
  const canSetHead = hasPermission('MANAGE_SERVANTS') || hasPermission('*');
  const [tab, setTab] = useState<Tab>('souls');
  const [selectedDept, setSelectedDept] = useState<string>(fixedDepartmentId || '');
  const [search, setSearch] = useState('');
  const [souls, setSouls] = useState<SoulRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  // Manual create form state
  const [manualForm, setManualForm] = useState({
    fullName: '',
    nickname: '',
    gender: 'male' as 'male' | 'female',
    phone: '',
    email: '',
    isHead: false,
  });
  const [creatingManual, setCreatingManual] = useState(false);

  useEffect(() => {
    if (fixedDepartmentId) setSelectedDept(fixedDepartmentId);
  }, [fixedDepartmentId]);

  // Reset selection when changing tab or department
  useEffect(() => {
    setSelected(new Set());
  }, [tab, selectedDept]);

  // Load souls / users when needed
  useEffect(() => {
    if (!isOpen || !selectedDept || tab === 'manual') return;

    const load = async () => {
      setLoading(true);
      try {
        // Existing servants in this department to flag duplicates
        const existingSnap = await getDocs(
          query(collection(db, 'servants'), where('departmentId', '==', selectedDept))
        );
        const existingSoulIds = new Set<string>();
        const existingUserIds = new Set<string>();
        existingSnap.docs.forEach(d => {
          const data: any = d.data();
          if (data.sourceType === 'soul' && data.sourceId) existingSoulIds.add(data.sourceId);
          if (data.sourceType === 'user' && data.sourceId) existingUserIds.add(data.sourceId);
          // Legacy support
          if (data.originalSoulId) existingSoulIds.add(data.originalSoulId);
        });

        const sortByName = <T extends { fullName: string }>(arr: T[]) =>
          arr.sort((a, b) =>
            a.fullName.localeCompare(b.fullName, 'fr', { sensitivity: 'base' })
          );

        if (tab === 'souls') {
          // Avoid composite-index requirement: filter on status only, sort client-side
          const snap = await getDocs(
            query(collection(db, 'souls'), where('status', '==', 'active'))
          );
          const rows: SoulRow[] = snap.docs.map(d => {
            const data: any = d.data();
            return {
              id: d.id,
              fullName: data.fullName || '',
              phone: data.phone,
              gender: data.gender,
              alreadyServant: existingSoulIds.has(d.id),
            };
          });
          setSouls(sortByName(rows));
        } else {
          const snap = await getDocs(
            query(collection(db, 'users'), where('status', '==', 'active'))
          );
          const rows: UserRow[] = snap.docs.map(d => {
            const data: any = d.data();
            return {
              id: d.id,
              fullName: data.fullName || '',
              phone: data.phone,
              email: data.email,
              role: data.role,
              alreadyServant: existingUserIds.has(d.id),
            };
          });
          setUsers(sortByName(rows));
        }
      } catch (e) {
        console.error('Error loading import source:', e);
        toast.error('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOpen, tab, selectedDept]);

  const filteredSouls = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return souls;
    return souls.filter(x =>
      x.fullName.toLowerCase().includes(s) || (x.phone || '').includes(s)
    );
  }, [souls, search]);

  const filteredUsers = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return users;
    return users.filter(x =>
      x.fullName.toLowerCase().includes(s) ||
      (x.phone || '').includes(s) ||
      (x.email || '').toLowerCase().includes(s)
    );
  }, [users, search]);

  const currentRows = tab === 'souls' ? filteredSouls : filteredUsers;
  const selectableRows = currentRows.filter(r => !r.alreadyServant);
  const allSelected = selectableRows.length > 0 && selectableRows.every(r => selected.has(r.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectableRows.map(r => r.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleImport = async () => {
    if (!selectedDept) {
      toast.error('Sélectionnez un département cible');
      return;
    }
    if (selected.size === 0) {
      toast.error('Sélectionnez au moins une personne');
      return;
    }

    setImporting(true);
    try {
      const ids = Array.from(selected);
      const res = tab === 'souls'
        ? await ServantService.importFromSouls(ids, selectedDept)
        : await ServantService.importFromUsers(ids, selectedDept);

      const msg = `${res.imported} importé(s)` + (res.skipped.length ? `, ${res.skipped.length} ignoré(s)` : '');
      if (res.imported > 0) toast.success(msg);
      else toast(msg, { icon: 'ℹ️' });

      if (res.skipped.length > 0) {
        console.warn('Imports ignorés:', res.skipped);
      }

      setSelected(new Set());
      onImported?.();
      if (res.imported > 0) onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Erreur lors de l'import");
    } finally {
      setImporting(false);
    }
  };

  const roleLabel = (role?: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'super_admin': return 'Super Admin';
      case 'shepherd': return 'Berger(e)';
      case 'adn': return 'ADN';
      case 'department_leader': return 'Resp. Dép.';
      case 'family_leader': return 'Resp. Famille';
      case 'pasteur': return 'Pasteur';
      default: return role || '—';
    }
  };

  const handleCreateManual = async () => {
    if (!selectedDept) {
      toast.error('Sélectionnez un département cible');
      return;
    }
    if (!manualForm.fullName.trim()) {
      toast.error('Le nom est obligatoire');
      return;
    }
    const phoneValidation = validatePhoneNumber(manualForm.phone);
    if (!phoneValidation.isValid) {
      toast.error(phoneValidation.error || 'Numéro de téléphone invalide');
      return;
    }

    setCreatingManual(true);
    try {
      await ServantService.createServant({
        fullName: manualForm.fullName.trim(),
        nickname: manualForm.nickname.trim() || undefined,
        gender: manualForm.gender,
        phone: phoneValidation.formattedNumber || '',
        email: manualForm.email.trim(),
        departmentId: selectedDept,
        isHead: canSetHead ? manualForm.isHead : false,
        sourceType: 'manual',
      });
      toast.success('Serviteur créé avec succès');
      setManualForm({
        fullName: '',
        nickname: '',
        gender: 'male',
        phone: '',
        email: '',
        isHead: false,
      });
      onImported?.();
      onClose();
    } catch (e: any) {
      console.error('Error creating manual servant:', e);
      toast.error(e?.message || 'Erreur lors de la création');
    } finally {
      setCreatingManual(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Importer des serviteurs">
      <div className="space-y-4 p-6">
        {!fixedDepartmentId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Département cible
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
            >
              <option value="">Sélectionner un département</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex border-b">
          <button
            type="button"
            onClick={() => setTab('souls')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'souls'
                ? 'border-[#00665C] text-[#00665C]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Heart className="w-4 h-4" />
            Depuis les âmes
          </button>
          <button
            type="button"
            onClick={() => setTab('users')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'users'
                ? 'border-[#00665C] text-[#00665C]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <UsersIcon className="w-4 h-4" />
            Depuis les utilisateurs
          </button>
          <button
            type="button"
            onClick={() => setTab('manual')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'manual'
                ? 'border-[#00665C] text-[#00665C]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Créer manuellement
          </button>
        </div>

        {tab !== 'manual' && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={tab === 'souls' ? 'Rechercher une âme…' : 'Rechercher un utilisateur…'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
              />
            </div>

            <div className="border rounded-md overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border-b text-xs font-medium text-gray-600">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  disabled={!selectedDept || selectableRows.length === 0}
                />
                <span className="flex-1">
                  {selectedDept
                    ? `${currentRows.length} résultat(s) — ${selected.size} sélectionné(s)`
                    : 'Choisissez un département pour afficher la liste'}
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y">
                {!selectedDept ? null : loading ? (
                  <div className="p-6 text-center text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </div>
                ) : currentRows.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">Aucun résultat</div>
                ) : (
                  currentRows.map(row => {
                    const isUser = tab === 'users';
                    const userRow = row as UserRow;
                    return (
                      <label
                        key={row.id}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer hover:bg-gray-50 ${
                          row.alreadyServant ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <Checkbox
                          checked={selected.has(row.id)}
                          onCheckedChange={() => toggleOne(row.id)}
                          disabled={row.alreadyServant}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{row.fullName}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {row.phone || '—'}
                            {isUser && userRow.email ? ` • ${userRow.email}` : ''}
                          </div>
                        </div>
                        {isUser && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 whitespace-nowrap">
                            {roleLabel(userRow.role)}
                          </span>
                        )}
                        {row.alreadyServant && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 whitespace-nowrap">
                            Déjà serviteur ici
                          </span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}

        {tab === 'manual' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Créez un nouveau serviteur qui n'existe ni dans la liste des âmes, ni dans celle des utilisateurs.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom et Prénoms <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="ex: Jean Kouassi"
                value={manualForm.fullName}
                onChange={(e) => setManualForm(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Surnom (optionnel)
              </label>
              <input
                type="text"
                placeholder="ex: Jean"
                value={manualForm.nickname}
                onChange={(e) => setManualForm(prev => ({ ...prev, nickname: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
              />
            </div>

            <GenderRadioGroup
              value={manualForm.gender}
              onChange={(gender: 'male' | 'female') => setManualForm(prev => ({ ...prev, gender }))}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numéro de téléphone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">+225</span>
                <input
                  type="tel"
                  placeholder="0757000203"
                  value={manualForm.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setManualForm(prev => ({ ...prev, phone: value }));
                  }}
                  className="w-full pl-16 pr-4 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
                  maxLength={10}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (optionnel)
              </label>
              <input
                type="email"
                placeholder="ex: jean.kouassi@example.com"
                value={manualForm.email}
                onChange={(e) => setManualForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
              />
            </div>

            {canSetHead && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="manualIsHead"
                  checked={manualForm.isHead}
                  onChange={(e) => setManualForm(prev => ({ ...prev, isHead: e.target.checked }))}
                  className="h-4 w-4 text-[#00665C] focus:ring-[#00665C] border-gray-300 rounded"
                />
                <label htmlFor="manualIsHead" className="ml-2 block text-sm text-gray-900">
                  Responsable de département
                </label>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={importing || creatingManual}>
            Annuler
          </Button>
          {tab === 'manual' ? (
            <Button
              onClick={handleCreateManual}
              disabled={creatingManual || !selectedDept || !manualForm.fullName.trim() || !manualForm.phone}
              className="bg-[#00665C] hover:bg-[#00665C]/90 text-white"
            >
              {creatingManual ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              Créer le serviteur
            </Button>
          ) : (
            <Button
              onClick={handleImport}
              disabled={importing || selected.size === 0 || !selectedDept}
              className="bg-[#00665C] hover:bg-[#00665C]/90 text-white"
            >
              {importing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Importer ({selected.size})
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
