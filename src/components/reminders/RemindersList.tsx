import { useState, useEffect } from 'react';
import { formatDate } from '../../utils/dateUtils';
import { Soul, Interaction } from '../../types/database.types';
import { MessageCircle, AlertTriangle } from 'lucide-react';
import InteractionModal from '../interactions/InteractionModal';

interface RemindersListProps {
  souls: Soul[];
  interactions: Interaction[];
}

interface ReminderItem {
  soul: Soul;
  lastInteraction: Date | null;
  daysWithoutInteraction: number;
}

export function RemindersList({ souls, interactions }: RemindersListProps) {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [selectedSoul, setSelectedSoul] = useState<Soul | null>(null);

  useEffect(() => {
    const today = new Date();
    const reminderItems = souls.map(soul => {
      const soulInteractions = interactions.filter(i => i.soulId === soul.id);
      const lastInteraction = soulInteractions.length > 0
        ? new Date(Math.max(...soulInteractions.map(i => i.date.getTime())))
        : null;
      
      const daysWithoutInteraction = lastInteraction
        ? Math.floor((today.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24))
        : Infinity;

      return {
        soul,
        lastInteraction,
        daysWithoutInteraction
      };
    });

    // Trier par urgence (plus grand nombre de jours en premier)
    setReminders(reminderItems.sort((a, b) => b.daysWithoutInteraction - a.daysWithoutInteraction));
  }, [souls, interactions]);

  return (
    <div className="space-y-4">
      {reminders.map(({ soul, lastInteraction, daysWithoutInteraction }) => (
        <div
          key={soul.id}
          className={`p-4 rounded-lg border ${
            daysWithoutInteraction >= 7
              ? 'bg-red-50 border-red-200'
              : daysWithoutInteraction >= 5
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">
                {soul.fullName}
              </h3>
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <AlertTriangle className={`w-4 h-4 mr-1.5 ${
                  daysWithoutInteraction >= 7
                    ? 'text-red-500'
                    : 'text-yellow-500'
                }`} />
                {lastInteraction ? (
                  <>
                    Dernière interaction il y a {daysWithoutInteraction} jours
                    ({formatDate(lastInteraction)})
                  </>
                ) : (
                  "Aucune interaction enregistrée"
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedSoul(soul)}
              className="p-2 text-[#00665C] hover:bg-[#00665C]/10 rounded-full"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}

      {selectedSoul && (
        <InteractionModal
          isOpen={!!selectedSoul}
          onClose={() => setSelectedSoul(null)}
          soulId={selectedSoul.id}
          shepherdId={selectedSoul.shepherdId!}
          soulName={selectedSoul.fullName}
        />
      )}
    </div>
  );
}