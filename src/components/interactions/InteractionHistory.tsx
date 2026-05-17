import { useEffect, useState } from 'react';
import { Interaction } from '../../types/database.types';
import { formatDate } from '../../utils/dateUtils';
import { Phone, Users, MessageSquare, Trash2, MessageCircle, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { useConfirmModal } from '../../hooks/useConfirmModal';

interface InteractionHistoryProps {
  soulId: string;
}

const interactionIcons: Record<string, any> = {
  call: Phone,
  visit: Users,
  sms: MessageCircle,
  message: MessageSquare,
  other: HelpCircle
};

const interactionLabels: Record<string, string> = {
  call: 'Appel',
  visit: 'Visite',
  sms: 'SMS',
  message: 'Message',
  other: 'Autre'
};

export default function InteractionHistory({ soulId }: InteractionHistoryProps) {
  const { confirm, confirmModalProps } = useConfirmModal();
  const [interactions, setInteractions] = useState<Interaction[]>([]);

  useEffect(() => {
    const loadInteractions = async () => {
      const { data, error } = await supabase
        .from('interactions')
        .select('*')
        .eq('soul_id', soulId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading interactions:', error);
        return;
      }

      setInteractions((data ?? []).map((r: any) => ({
        id: r.id,
        soulId: r.soul_id,
        shepherdId: r.shepherd_id,
        type: r.type,
        notes: r.notes,
        date: r.date ? new Date(r.date) : new Date(),
        createdAt: r.created_at ? new Date(r.created_at) : new Date(),
        updatedAt: r.updated_at ? new Date(r.updated_at) : new Date(),
      })));
    };

    loadInteractions();

    // Realtime subscription
    const channel = supabase
      .channel('interaction-history-' + soulId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interactions', filter: 'soul_id=eq.' + soulId }, async () => {
        const { data } = await supabase.from('interactions').select('*').eq('soul_id', soulId).order('date', { ascending: false });
        setInteractions((data ?? []).map((r: any) => ({
          id: r.id, soulId: r.soul_id, shepherdId: r.shepherd_id, type: r.type, notes: r.notes,
          date: r.date ? new Date(r.date) : new Date(),
          createdAt: r.created_at ? new Date(r.created_at) : new Date(),
          updatedAt: r.updated_at ? new Date(r.updated_at) : new Date(),
        })));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [soulId]);

  const handleDelete = async (interactionId: string) => {
    if (await confirm('Êtes-vous sûr de vouloir supprimer cette interaction ?')) {
      try {
        const { error } = await supabase.from('interactions').delete().eq('id', interactionId);
        if (error) throw error;
        toast.success('Interaction supprimée avec succès');
      } catch (error) {
        console.error('Error deleting interaction:', error);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  if (interactions.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        Aucune interaction enregistrée
      <ConfirmModal {...confirmModalProps} />
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {interactions.map((interaction, idx) => {
          const Icon = interactionIcons[interaction.type] || HelpCircle;
          return (
            <li key={interaction.id}>
              <div className="relative pb-8">
                {idx !== interactions.length - 1 && (
                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                )}
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-[#00665C]/10 flex items-center justify-center ring-8 ring-white">
                      <Icon className="h-5 w-5 text-[#00665C]" />
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                          {interactionLabels[interaction.type] || interaction.type}
                        </p>
                        <button
                          onClick={() => handleDelete(interaction.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Supprimer l'interaction"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-1 text-sm text-gray-700">{interaction.notes}</p>
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                      <time dateTime={interaction.date.toISOString()}>
                        {formatDate(interaction.date)}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
