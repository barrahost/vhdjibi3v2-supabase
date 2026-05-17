import { Play, Pause } from 'lucide-react';

interface SpotifyCardProps {
  title: string;
  speaker: string;
  duration: number;
  category: string;
  theme?: string;
  thumbnail_url?: string | null;
  isSelected?: boolean;
  isPlaying?: boolean;
  plays?: number;
  onClick: () => void;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const fmtPlays = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

export function SpotifyCard({
  title, speaker, duration, category, theme, thumbnail_url,
  isSelected, isPlaying, plays, onClick
}: SpotifyCardProps) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      className="group cursor-pointer rounded-xl p-3 transition-colors duration-200 outline-none focus-visible:ring-2"
      style={{
        background: isSelected ? '#253341' : '#1a2332',
        '--ring-color': '#F2B636',
      } as React.CSSProperties}
    >
      {/* Square thumbnail */}
      <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-3" style={{ background: '#2d3f55' }}>
        {thumbnail_url ? (
          <img src={thumbnail_url} alt={title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-10 h-10 opacity-30" style={{ color: '#F2B636' }} />
          </div>
        )}

        {/* Playing badge */}
        {isPlaying && (
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full px-2 py-0.5"
               style={{ background: 'rgba(0,0,0,0.65)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#F2B636' }} />
            <span className="text-[10px] font-medium text-white">En cours</span>
          </div>
        )}

        {/* Hover play button */}
        <div className="absolute bottom-2 right-2 transition-all duration-200 opacity-0 translate-y-1
                        group-hover:opacity-100 group-hover:translate-y-0">
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-xl"
            style={{ background: '#F2B636' }}
            aria-label={isPlaying ? 'Pause' : 'Lire'}
          >
            {isPlaying
              ? <Pause className="w-4 h-4" style={{ color: '#111827' }} />
              : <Play  className="w-4 h-4 ml-0.5" style={{ color: '#111827' }} />}
          </button>
        </div>
      </div>

      {/* Text info */}
      <p className="text-sm font-semibold leading-tight line-clamp-2 mb-1" style={{ color: '#f1f5f9' }}>
        {title}
      </p>
      <p className="text-xs truncate" style={{ color: '#94a3b8' }}>{speaker}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs" style={{ color: '#64748b' }}>{fmt(duration)}</span>
        {typeof plays === 'number' && plays > 0 && (
          <>
            <span style={{ color: '#374151' }}>·</span>
            <span className="text-xs" style={{ color: '#64748b' }}>{fmtPlays(plays)} écoutes</span>
          </>
        )}
      </div>
    </div>
  );
}
