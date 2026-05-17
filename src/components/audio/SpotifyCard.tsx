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
  isDark?: boolean;
  onClick: () => void;
}

const fmt     = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const fmtPlay = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

export function SpotifyCard({
  title, speaker, duration, thumbnail_url,
  isSelected, isPlaying, plays, isDark = false, onClick
}: SpotifyCardProps) {

  const c = isDark ? {
    card:      isSelected ? '#253341' : '#1a2332',
    cardHover: '#253341',
    thumb:     '#2d3f55',
    textH:     '#f1f5f9',
    textS:     '#94a3b8',
    textM:     '#64748b',
    badge:     'rgba(0,0,0,0.65)',
    badgeText: '#ffffff',
    dot:       '#F2B636',
    btn:       '#F2B636',
    btnIcon:   '#111827',
    ring:      '#F2B636',
  } : {
    card:      isSelected ? '#ecfdf5' : '#ffffff',
    cardHover: '#f8fafc',
    thumb:     '#e5e7eb',
    textH:     '#0f172a',
    textS:     '#374151',
    textM:     '#9ca3af',
    badge:     'rgba(0,0,0,0.55)',
    badgeText: '#ffffff',
    dot:       '#00665C',
    btn:       '#00665C',
    btnIcon:   '#ffffff',
    ring:      '#00665C',
  };

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      className="group cursor-pointer rounded-xl p-3 transition-colors duration-150 outline-none"
      style={{
        background: c.card,
        boxShadow: isDark ? 'none' : (isSelected ? '0 0 0 2px #00665C' : '0 1px 3px rgba(0,0,0,0.07)'),
        border: isDark ? 'none' : `1px solid ${isSelected ? '#00665C' : '#e5e7eb'}`,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = c.cardHover; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = c.card; }}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-3"
           style={{ background: c.thumb }}>
        {thumbnail_url ? (
          <img src={thumbnail_url} alt={title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-10 h-10 opacity-25" style={{ color: c.btn }} />
          </div>
        )}

        {/* Playing badge */}
        {isPlaying && (
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full px-2 py-0.5"
               style={{ background: c.badge }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: c.dot }} />
            <span className="text-[10px] font-medium" style={{ color: c.badgeText }}>En cours</span>
          </div>
        )}

        {/* Hover play */}
        <div className="absolute bottom-2 right-2 opacity-0 translate-y-1
                        group-hover:opacity-100 group-hover:translate-y-0
                        transition-all duration-200">
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
            style={{ background: c.btn }}
            aria-label={isPlaying ? 'Pause' : 'Lire'}
          >
            {isPlaying
              ? <Pause className="w-4 h-4" style={{ color: c.btnIcon }} />
              : <Play  className="w-4 h-4 ml-0.5" style={{ color: c.btnIcon }} />}
          </button>
        </div>
      </div>

      <p className="text-sm font-semibold leading-tight line-clamp-2 mb-1"
         style={{ color: c.textH }}>{title}</p>
      <p className="text-xs truncate" style={{ color: c.textS }}>{speaker}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs" style={{ color: c.textM }}>{fmt(duration)}</span>
        {typeof plays === 'number' && plays > 0 && (
          <>
            <span style={{ color: c.textM }}>·</span>
            <span className="text-xs" style={{ color: c.textM }}>{fmtPlay(plays)}</span>
          </>
        )}
      </div>
    </div>
  );
}
