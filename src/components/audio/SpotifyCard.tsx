import { Play, Pause, Heart, Plus } from 'lucide-react';

// ─── Speaker avatar helper ────────────────────────────────────────────────────
const GRADIENTS: [string, string][] = [
  ['#667eea', '#764ba2'], ['#f093fb', '#f5576c'], ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'], ['#fa709a', '#fee140'], ['#a18cd1', '#fbc2eb'],
  ['#30cfd0', '#330867'], ['#fccb90', '#d57eeb'], ['#00c6fb', '#005bea'],
  ['#f7971e', '#ffd200'],
];

export function getSpeakerAvatar(name: string): { initials: string; gradient: string } {
  const words = (name || '').trim().split(/\s+/).filter(Boolean);
  const initials = words.length >= 2
    ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
    : (name.slice(0, 2) || 'AU').toUpperCase();
  let h = 0;
  for (const c of name) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  const [c1, c2] = GRADIENTS[Math.abs(h) % GRADIENTS.length];
  return { initials, gradient: `linear-gradient(135deg, ${c1}, ${c2})` };
}

// ─── Props ────────────────────────────────────────────────────────────────────
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
  /** 0-100. undefined = not started, 100 = finished (hidden) */
  progressPercent?: number;
  isFavorite?: boolean;
  onClick: () => void;
  onFavorite?: (e: React.MouseEvent) => void;
  onAddToQueue?: (e: React.MouseEvent) => void;
}

const fmt     = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const fmtPlay = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

// ─── Component ────────────────────────────────────────────────────────────────
export function SpotifyCard({
  title, speaker, duration, thumbnail_url,
  isSelected, isPlaying, plays, isDark = false,
  progressPercent, isFavorite,
  onClick, onFavorite, onAddToQueue,
}: SpotifyCardProps) {

  const c = isDark ? {
    card:    isSelected ? '#253341' : '#1a2332',
    hover:   '#253341',
    textH:   '#f1f5f9',
    textS:   '#94a3b8',
    textM:   '#64748b',
    badge:   'rgba(0,0,0,0.65)',
    badgeT:  '#ffffff',
    dot:     '#F2B636',
    btn:     '#F2B636',
    btnI:    '#111827',
    pgBg:    'rgba(255,255,255,0.12)',
    pgFill:  '#F2B636',
    border:  'none',
    shadow:  'none',
  } : {
    card:    isSelected ? '#ecfdf5' : '#ffffff',
    hover:   '#f8fafc',
    textH:   '#0f172a',
    textS:   '#374151',
    textM:   '#9ca3af',
    badge:   'rgba(0,0,0,0.55)',
    badgeT:  '#ffffff',
    dot:     '#00665C',
    btn:     '#00665C',
    btnI:    '#ffffff',
    pgBg:    'rgba(0,0,0,0.12)',
    pgFill:  '#00665C',
    border:  `1px solid ${isSelected ? '#00665C' : '#e5e7eb'}`,
    shadow:  isSelected ? '0 0 0 2px #00665C' : '0 1px 3px rgba(0,0,0,0.07)',
  };

  const { initials, gradient } = getSpeakerAvatar(speaker || '');
  const hasProg = typeof progressPercent === 'number' && progressPercent > 0 && progressPercent < 100;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      className="group cursor-pointer rounded-xl p-3 transition-colors duration-150 outline-none"
      style={{ background: c.card, boxShadow: c.shadow, border: c.border }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = c.hover; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = c.card; }}
    >
      {/* ── Thumbnail ──────────────────────────────────────────── */}
      <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-3">

        {/* Image or gradient avatar */}
        {thumbnail_url ? (
          <img src={thumbnail_url} alt={title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: gradient }}>
            <span className="text-2xl font-bold text-white select-none"
                  style={{ textShadow: '0 1px 4px rgba(0,0,0,0.35)' }}>
              {initials}
            </span>
          </div>
        )}

        {/* En cours badge */}
        {isPlaying && (
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full px-2 py-0.5"
               style={{ background: c.badge }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: c.dot }} />
            <span className="text-[10px] font-medium" style={{ color: c.badgeT }}>En cours</span>
          </div>
        )}

        {/* Favorite heart (top-right, visible on hover or when active) */}
        {onFavorite && (
          <button
            onClick={e => { e.stopPropagation(); onFavorite(e); }}
            aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center
                        transition-all duration-200
                        ${isFavorite
                          ? 'opacity-100 scale-100'
                          : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100'}`}
            style={{ background: 'rgba(0,0,0,0.5)' }}
          >
            <Heart
              className="w-3.5 h-3.5"
              fill={isFavorite ? '#f43f5e' : 'none'}
              style={{ color: isFavorite ? '#f43f5e' : '#fff' }}
            />
          </button>
        )}

        {/* Hover overlay: queue + play buttons */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5
                        opacity-0 translate-y-1
                        group-hover:opacity-100 group-hover:translate-y-0
                        transition-all duration-200">
          {onAddToQueue && (
            <button
              onClick={e => { e.stopPropagation(); onAddToQueue(e); }}
              aria-label="Ajouter à la file"
              title="File de lecture"
              className="w-8 h-8 rounded-full flex items-center justify-center shadow-md"
              style={{ background: 'rgba(0,0,0,0.6)' }}
            >
              <Plus className="w-3.5 h-3.5 text-white" />
            </button>
          )}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
            style={{ background: c.btn }}
          >
            {isPlaying
              ? <Pause className="w-4 h-4" style={{ color: c.btnI }} />
              : <Play  className="w-4 h-4 ml-0.5" style={{ color: c.btnI }} />}
          </div>
        </div>

        {/* Listening progress bar */}
        {hasProg && (
          <div className="absolute bottom-0 left-0 right-0" style={{ height: '3px', background: c.pgBg }}>
            <div style={{ height: '100%', width: `${progressPercent}%`, background: c.pgFill }} />
          </div>
        )}
      </div>

      {/* ── Meta ───────────────────────────────────────────────── */}
      <p className="text-sm font-semibold leading-tight line-clamp-2 mb-1" style={{ color: c.textH }}>
        {title}
      </p>
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
