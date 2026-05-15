import { useState, useEffect } from 'react';
import { Soul, Interaction } from '../../types/database.types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  souls: Soul[];
  interactions: Interaction[];
}

export function Calendar({ souls, interactions }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [interactionsByDate, setInteractionsByDate] = useState<Record<string, Interaction[]>>({});

  // Générer les jours du mois
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Ajouter les jours du mois précédent pour compléter la première semaine
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.unshift(new Date(year, month, -i));
    }

    // Ajouter tous les jours du mois
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    // Ajouter les jours du mois suivant pour compléter la dernière semaine
    const lastDayOfWeek = lastDay.getDay();
    for (let i = 1; i <= 7 - lastDayOfWeek; i++) {
      days.push(new Date(year, month + 1, i));
    }

    setCalendarDays(days);
  }, [currentDate]);

  // Grouper les interactions par date
  useEffect(() => {
    const grouped: Record<string, Interaction[]> = {};
    interactions.forEach(interaction => {
      const date = interaction.date.toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(interaction);
    });
    setInteractionsByDate(grouped);
  }, [interactions]);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 flex items-center justify-between border-b">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold">
          {currentDate.toLocaleDateString('fr-FR', {
            month: 'long',
            year: 'numeric'
          })}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
          <div
            key={day}
            className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
        {calendarDays.map((date, index) => {
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          const dateKey = date.toISOString().split('T')[0];
          const dayInteractions = interactionsByDate[dateKey] || [];

          return (
            <div
              key={index}
              className={`min-h-[100px] p-2 ${
                isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <div className="text-right">
                <span className={`text-sm ${
                  isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {date.getDate()}
                </span>
              </div>
              {dayInteractions.length > 0 && (
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#00665C]/10 text-[#00665C]">
                    {dayInteractions.length} interaction{dayInteractions.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}