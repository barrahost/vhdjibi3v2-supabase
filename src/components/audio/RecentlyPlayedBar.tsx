import { useEffect, useState } from 'react';
import { Play, Clock } from 'lucide-react';

export interface RecentlyPlayedItem {
  id: string;
  title: string;
  speaker: string;
  thumbnail_url?: string | null;
}

interface RecentlyPlayedBarProps<T extends RecentlyPlayedItem> {
  allTeachings: T[];
  onSelect: (teaching: T) => void;
}

const STORAGE_KEY = 'recently_played';

function readRecentIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function RecentlyPlayedBar<T extends RecentlyPlayedItem>({
  allTeachings,
  onSelect
}: RecentlyPlayedBarProps<T>) {
  const [recentIds, setRecentIds] = useState<string[]>(() => readRecentIds());

  useEffect(() => {
    const sync = () => setRecentIds(readRecentIds());
    window.addEventListener('recently_played:updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('recently_played:updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const recentTeachings = recentIds
    .map((id) => allTeachings.find((t) => t.id === id))
    .filter((t): t is T => Boolean(t));

  if (recentTeachings.length === 0) return null;

  return (
    <section className="mb-4 sm:mb-6">
      <h2 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 sm:mb-3 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5" />
        Récemment écoutés
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {recentTeachings.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t)}
            className="flex-shrink-0 w-32 text-left group"
          >
            <div className="w-32 h-20 rounded-lg overflow-hidden bg-gray-100 relative">
              {t.thumbnail_url ? (
                <img
                  src={t.thumbnail_url}
                  alt={t.title}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#00665C]/10">
                  <Play className="w-6 h-6 text-[#00665C]" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Play className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <p className="text-xs font-medium mt-1.5 line-clamp-2 text-gray-800">
              {t.title}
            </p>
            <p className="text-[11px] text-gray-500 truncate">{t.speaker}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
