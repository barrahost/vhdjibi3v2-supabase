import { useState, useEffect } from 'react';

import { Search, Pencil, Trash2, GitMerge } from 'lucide-react';
import { EditSpeakerModal } from './EditSpeakerModal';
import { MergeSpeakerModal } from './MergeSpeakerModal';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { getChurchId } from '../../../lib/churchId';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { useConfirmModal } from '../../../hooks/useConfirmModal';

interface Speaker {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export function SpeakerList() {
  const { confirm, confirmModalProps } = useConfirmModal();
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mergeConfig, setMergeConfig] = useState<{ sources: Speaker[]; targetOptions: Speaker[] } | null>(null);

  useEffect(() => {
    const loadSpeakers = async () => {
      const { data, error } = await supabase
        .from('audio_speakers')
        .select('*')
        .eq('church_id', getChurchId())
        .order('name', { ascending: true });
      if (error) {
        console.error('Error loading speakers:', error);
        toast.error('Erreur lors du chargement des orateurs');
      } else {
        setSpeakers((data ?? []).map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description || '',
          status: r.status,
          createdAt: r.created_at ? new Date(r.created_at) : new Date(),
          updatedAt: r.updated_at ? new Date(r.updated_at) : new Date()
        })));
      }
      setLoading(false);
    };
    loadSpeakers();

    const channel = supabase.channel('audio_speakers_list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audio_speakers' }, () => loadSpeakers())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleDelete = async (speaker: Speaker) => {
    if (await confirm('Êtes-vous sûr de vouloir supprimer cet orateur ?')) {
      try {
        const { error: deleteErr } = await supabase.from('audio_speakers').delete().eq('id', speaker.id);
        if (deleteErr) throw deleteErr;
        toast.success('Orateur supprimé avec succès');
      } catch (error) {
        console.error('Error deleting speaker:', error);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const closeMerge = () => {
    setMergeConfig(null);
    setSelectedIds([]);
  };

  const filteredSpeakers = speakers.filter(speaker =>
    speaker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    speaker.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedSpeakers = speakers.filter(s => selectedIds.includes(s.id));

  if (loading) {
    return <div className="text-center py-4">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un orateur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
        />
      </div>

      {/* Barre de fusion multi-sélection */}
      {selectedIds.length >= 2 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-[#00665C]/5 border border-[#00665C]/30 rounded-lg px-4 py-3">
          <span className="text-sm font-medium text-[#00665C]">
            {selectedIds.length} orateurs sélectionnés
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setSelectedIds([])}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Tout désélectionner
            </button>
            <button
              onClick={() => setMergeConfig({ sources: selectedSpeakers, targetOptions: selectedSpeakers })}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md"
            >
              <GitMerge className="w-4 h-4" />
              Fusionner la sélection
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="divide-y">
          {filteredSpeakers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Aucun orateur trouvé
            </div>
          ) : (
            filteredSpeakers.map(speaker => (
              <div key={speaker.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(speaker.id)}
                      onChange={() => toggleSelect(speaker.id)}
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-[#00665C] focus:ring-[#00665C] cursor-pointer flex-shrink-0"
                      title="Sélectionner pour fusion"
                    />
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-900 break-words">{speaker.name}</h3>
                      {speaker.description && (
                        <p className="mt-1 text-sm text-gray-500 break-words">{speaker.description}</p>
                      )}
                      <span className={`inline-flex items-center px-2.5 py-0.5 mt-2 rounded text-xs font-medium ${
                        speaker.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {speaker.status === 'active' ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0">
                    {speakers.length > 1 && (
                      <button
                        onClick={() => setMergeConfig({
                          sources: [speaker],
                          targetOptions: speakers.filter(s => s.id !== speaker.id),
                        })}
                        className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                        title="Fusionner vers un autre orateur"
                      >
                        <GitMerge className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setEditingSpeaker(speaker)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Modifier"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(speaker)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {editingSpeaker && (
        <EditSpeakerModal
          speaker={editingSpeaker}
          isOpen={!!editingSpeaker}
          onClose={() => setEditingSpeaker(null)}
        />
      )}

      {mergeConfig && (
        <MergeSpeakerModal
          sources={mergeConfig.sources}
          targetOptions={mergeConfig.targetOptions}
          isOpen={!!mergeConfig}
          onClose={closeMerge}
        />
      )}
      <ConfirmModal {...confirmModalProps} />
    </div>
  );
}
