import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { EvangelizedSoul } from '../../types/evangelized.types';
import { Search, UserCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (soul: EvangelizedSoul) => void;
}

export default function PickEvangelizedSoulModal({ isOpen, onClose, onSelect }: Props) {
  const [souls, setSouls] = useState<EvangelizedSoul[]>([]);
  const [filtered, setFiltered] = useState<EvangelizedSoul[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSearch('');
    setLoading(true);
    // Charger uniquement les âmes évangélisées pas encore reçues dans l'église
    supabase
      .from('evangelized_souls')
      .select('*')
      .neq('status', 'imported')
      .then(({ data, error }) => {
        if (error) { console.error('PickEvangelized load error:', error); return; }
        const list = (data ?? [])
          .map((d: any) => ({
            id: d.id,
            fullName: d.full_name,
            phone: d.phone,
            location: d.location,
            gender: d.gender,
            status: d.status,
            evangelistId: d.evangelist_id,
            evangelizationDate: d.evangelization_date,
            importedToSoulId: d.imported_to_soul_id,
            attendedCommunity: d.attended_community,
            gaveLifeToJesus: d.gave_life_to_jesus,
            plannedService: d.planned_service,
            prayerTopics: d.prayer_topics,
            interviewerName: d.interviewer_name,
            notes: d.notes,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
            createdBy: d.created_by,
          } as EvangelizedSoul))
          // Exclure celles qui ont déjà un importedToSoulId
          .filter((s: EvangelizedSoul) => !s.importedToSoulId)
          .sort((a: EvangelizedSoul, b: EvangelizedSoul) => (a.fullName || '').localeCompare(b.fullName || ''));
        setSouls(list);
        setFiltered(list);
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  useEffect(() => {
    const q = search.trim().toLowerCase();
    if (!q) { setFiltered(souls); return; }
    setFiltered(souls.filter(s =>
      (s.fullName || '').toLowerCase().includes(q) ||
      (s.phone || '').includes(q) ||
      (s.location || '').toLowerCase().includes(q)
    ));
  }, [search, souls]);

  const handleSelect = (soul: EvangelizedSoul) => {
    onSelect(soul);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choisir une âme évangélisée à recevoir">
      <div className="p-4 space-y-4">
        <p className="text-sm text-gray-600">
          Sélectionnez l'âme évangélisée qui vient de faire sa première visite au culte.
          Seules les âmes <strong>pas encore reçues</strong> sont affichées.
        </p>

        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone, lieu..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#00665C] focus:border-[#00665C]"
            autoFocus
          />
        </div>

        {/* Liste */}
        <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-md">
          {loading ? (
            <div className="py-8 text-center text-gray-500 text-sm">Chargement...</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">
              {souls.length === 0
                ? 'Aucune âme évangélisée en attente de réception.'
                : 'Aucun résultat pour cette recherche.'}
            </div>
          ) : (
            filtered.map(soul => (
              <button
                key={soul.id}
                onClick={() => handleSelect(soul)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#00665C]/5 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[#00665C]/10 flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-4 h-4 text-[#00665C]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{soul.fullName}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {[soul.phone, soul.location].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span className="text-xs text-[#00665C] font-medium flex-shrink-0">Sélectionner →</span>
              </button>
            ))
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Annuler
          </button>
        </div>
      </div>
    </Modal>
  );
}
