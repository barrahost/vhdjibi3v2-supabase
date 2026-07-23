import { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { GitMerge, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { getChurchId } from '../../../lib/churchId';

interface SpeakerLite {
  id: string;
  name: string;
}

interface MergeSpeakerModalProps {
  /** Orateur(s) concerné(s) par la fusion (1 ou plusieurs variantes) */
  sources: SpeakerLite[];
  /** Cibles possibles (orateur à conserver) */
  targetOptions: SpeakerLite[];
  isOpen: boolean;
  onClose: () => void;
}

export function MergeSpeakerModal({ sources, targetOptions, isOpen, onClose }: MergeSpeakerModalProps) {
  const [targetName, setTargetName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Pré-sélectionner s'il n'y a qu'une seule cible possible
    setTargetName(targetOptions.length === 1 ? targetOptions[0].name : '');
  }, [sources, targetOptions, isOpen]);

  const target = targetOptions.find(t => t.name === targetName) || null;
  // Variantes réellement fusionnées + supprimées (toutes les sources sauf la cible conservée)
  const toMerge = target ? sources.filter(s => s.id !== target.id) : sources;

  const handleMerge = async () => {
    if (!target) {
      toast.error('Choisissez un orateur à conserver');
      return;
    }
    if (toMerge.length === 0) {
      toast.error('Choisissez une cible différente des variantes à fusionner');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Réaffecter les audios de chaque variante vers l'orateur cible (insensible à la casse)
      let totalReassigned = 0;
      for (const s of toMerge) {
        const { data: updated, error: updErr } = await supabase
          .from('teachings')
          .update({ speaker: target.name, updated_at: new Date().toISOString() })
          .eq('church_id', getChurchId())
          .ilike('speaker', s.name)
          .select('id');
        if (updErr) throw updErr;
        totalReassigned += updated?.length ?? 0;
      }

      // 2. Supprimer les variantes désormais inutilisées
      const { error: delErr } = await supabase
        .from('audio_speakers')
        .delete()
        .in('id', toMerge.map(s => s.id));
      if (delErr) throw delErr;

      toast.success(
        `Fusion effectuée : ${totalReassigned} audio${totalReassigned > 1 ? 's' : ''} réaffecté${totalReassigned > 1 ? 's' : ''} à « ${target.name} » · ${toMerge.length} orateur${toMerge.length > 1 ? 's' : ''} supprimé${toMerge.length > 1 ? 's' : ''}`
      );
      onClose();
    } catch (error) {
      console.error('Error merging speakers:', error);
      toast.error('Erreur lors de la fusion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Fusionner des orateurs">
      <div className="p-6 space-y-5 overflow-y-auto flex-1">
        {/* Variantes concernées */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1.5">
            Orateur{sources.length > 1 ? 's' : ''} sélectionné{sources.length > 1 ? 's' : ''} ({sources.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sources.map(s => (
              <span
                key={s.id}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                  target && s.id === target.id
                    ? 'bg-[#00665C]/10 text-[#00665C] border-[#00665C]/30'
                    : 'bg-gray-100 text-gray-700 border-gray-200'
                }`}
              >
                {s.name}{target && s.id === target.id ? ' (conservé)' : ''}
              </span>
            ))}
          </div>
        </div>

        {/* Cible */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Orateur à conserver
          </label>
          {targetOptions.length === 0 ? (
            <p className="text-sm text-gray-500">
              Aucune cible disponible. Créez d'abord l'orateur cible.
            </p>
          ) : (
            <select
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
            >
              <option value="">Sélectionner l'orateur à conserver</option>
              {targetOptions.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Avertissement */}
        {target && toMerge.length > 0 && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" />
            <p className="text-sm">
              Les audios de <strong>{toMerge.map(s => `« ${s.name} »`).join(', ')}</strong> seront
              réaffectés à <strong>« {target.name} »</strong>, puis ces variantes seront supprimées.
              Action irréversible.
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleMerge}
            disabled={isSubmitting || !target || toMerge.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md disabled:opacity-50"
          >
            <GitMerge className="w-4 h-4" />
            {isSubmitting ? 'Fusion...' : 'Fusionner'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
