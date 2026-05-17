import { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, Volume2, VolumeX, AlertTriangle, Rewind, FastForward,
  X, Share2, Download, ChevronDown, Timer, ListMusic,
} from 'lucide-react';
import { formatDuration } from '../../utils/dateUtils';
import { supabase } from '../../lib/supabase';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import toast from 'react-hot-toast';

interface AudioPlayerProps {
  url: string;
  id: string;
  title: string;
  speaker: string;
  thumbnailUrl?: string;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onEnded?: () => void;
  onShare?: (currentTime: number) => void;
  onTimeUpdate?: (time: number, duration: number) => void;
  onQueueOpen?: () => void;
  queueCount?: number;
  initialPlayState?: boolean;
  initialTime?: number;
}

export function AudioPlayer({
  url, id, title, speaker, thumbnailUrl,
  onClose, onNext, onPrevious, onEnded, onShare, onTimeUpdate, onQueueOpen,
  queueCount = 0, initialPlayState = false, initialTime = 0,
}: AudioPlayerProps) {

  // ── Audio element ─────────────────────────────────────────────
  const audioRef        = useRef<HTMLAudioElement | null>(null);

  // ── Stable refs ───────────────────────────────────────────────
  const autoPlayRef     = useRef(initialPlayState);
  const initialTimeRef  = useRef(initialTime);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onEndedRef      = useRef(onEnded);
  const sleepOnEndRef   = useRef(false);
  const lastSavedRef    = useRef(0);

  initialTimeRef.current  = initialTime;
  onTimeUpdateRef.current = onTimeUpdate;
  onEndedRef.current      = onEnded;

  // ── Playback state ────────────────────────────────────────────
  const [shouldPlay, setShouldPlay] = useState(initialPlayState);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]     = useState(0);
  const [volume, setVolume]         = useState(1);
  const [isMuted, setIsMuted]       = useState(false);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const playTrackedRef = useRef(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isExpanded, setIsExpanded] = useState(false);
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  // ── Sleep timer ───────────────────────────────────────────────
  const [sleepEndAt, setSleepEndAt]       = useState<number | null>(null);
  const [sleepCountdown, setSleepCountdown] = useState('');
  const [showSleepMenu, setShowSleepMenu]   = useState(false);
  const [sleepOnEnd, setSleepOnEnd]         = useState(false);

  const setSleepTimerTo = (minutes: number | null) => {
    if (minutes === null) {
      setSleepEndAt(null); setSleepCountdown(''); setSleepOnEnd(false);
      sleepOnEndRef.current = false; toast('Minuterie annulée');
    } else if (minutes === 0) {
      setSleepOnEnd(true); setSleepEndAt(null); setSleepCountdown('');
      sleepOnEndRef.current = true; toast('🌙 Arrêt à la fin du message');
    } else {
      setSleepEndAt(Date.now() + minutes * 60_000); setSleepOnEnd(false);
      sleepOnEndRef.current = false; toast(`🌙 Arrêt dans ${minutes} min`);
    }
    setShowSleepMenu(false);
  };

  useEffect(() => {
    if (!sleepEndAt) { setSleepCountdown(''); return; }
    const id = setInterval(() => {
      const rem = sleepEndAt - Date.now();
      if (rem <= 0) {
        audioRef.current?.pause(); setIsPlaying(false);
        setSleepEndAt(null); setSleepCountdown('');
        toast('🌙 Minuterie : lecture arrêtée'); clearInterval(id);
      } else {
        const m = Math.floor(rem / 60000), s = Math.floor((rem % 60000) / 1000);
        setSleepCountdown(`${m}:${String(s).padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [sleepEndAt]);

  // ── Init audio ────────────────────────────────────────────────
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata'; audio.volume = 1;
    audioRef.current = audio;
    return () => { audio.pause(); audio.src = ''; };
  }, []);

  // ── URL effect ────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    autoPlayRef.current = initialPlayState || isPlaying;
    lastSavedRef.current = 0;
    setError(null); setIsLoading(true); setCurrentTime(0); setDuration(0);
    playTrackedRef.current = false;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      if (initialTimeRef.current > 0 && initialTimeRef.current < audio.duration * 0.95) {
        audio.currentTime = initialTimeRef.current;
        setCurrentTime(initialTimeRef.current);
      }
    };
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      const floor = Math.floor(audio.currentTime);
      if (floor - lastSavedRef.current >= 5 && audio.duration) {
        lastSavedRef.current = floor;
        onTimeUpdateRef.current?.(audio.currentTime, audio.duration);
      }
    };
    const handleEnded = () => {
      setIsPlaying(false); setShouldPlay(false);
      if (sleepOnEndRef.current) {
        sleepOnEndRef.current = false; setSleepOnEnd(false);
        toast('🌙 Lecture arrêtée (minuterie)'); return;
      }
      onEndedRef.current?.();
    };
    const handleCanPlay = () => {
      setIsLoading(false);
      if (autoPlayRef.current) {
        autoPlayRef.current = false;
        audio.play()
          .then(() => { setIsPlaying(true); setShouldPlay(true); playTrackedRef.current = true; })
          .catch(() => { setIsPlaying(false); setShouldPlay(false); });
      }
    };
    const handleError = () => {
      setError('Erreur de lecture'); setIsLoading(false); setIsPlaying(false);
      toast.error('Impossible de lire cet audio.');
    };
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.src = url; audio.load();
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (['INPUT','TEXTAREA','SELECT'].includes(tag) || (e.target as HTMLElement)?.isContentEditable) return;
      if (error) return;
      switch (e.key) {
        case ' ': case 'Spacebar': e.preventDefault(); togglePlayPause(); break;
        case 'ArrowLeft':  e.preventDefault(); handleSkip(-10); break;
        case 'ArrowRight': e.preventDefault(); handleSkip(10);  break;
        case 'ArrowUp':    e.preventDefault(); handleVolumeChange(Math.min(1, volume + 0.1)); break;
        case 'ArrowDown':  e.preventDefault(); handleVolumeChange(Math.max(0, volume - 0.1)); break;
        case 'n': case 'N': if (onNext) { e.preventDefault(); onNext(); } break;
        case 'p': case 'P': if (onPrevious) { e.preventDefault(); onPrevious(); } break;
        case 'm': case 'M': e.preventDefault(); toggleMute(); break;
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentTime, volume, isMuted, onNext, onPrevious, error]);

  // ── Helpers ───────────────────────────────────────────────────
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const b = e.currentTarget.getBoundingClientRect();
    const t = ((e.clientX - b.left) / b.width) * audioRef.current.duration;
    audioRef.current.currentTime = t; setCurrentTime(t);
  };

  const togglePlayPause = () => {
    if (!audioRef.current || error) return;
    if (isPlaying) {
      audioRef.current.pause(); setIsPlaying(false); setShouldPlay(false);
    } else {
      const p = audioRef.current.play();
      if (p !== undefined) {
        if (!playTrackedRef.current) {
          supabase.from('teachings').select('plays').eq('id', id).single()
            .then(({ data }) => { if (data) supabase.from('teachings').update({ plays: (data.plays || 0) + 1 }).eq('id', id).then(() => {}); });
          playTrackedRef.current = true;
          try {
            const stored: string[] = JSON.parse(localStorage.getItem('recently_played') || '[]');
            localStorage.setItem('recently_played', JSON.stringify([id, ...stored.filter(v => v !== id)].slice(0, 10)));
            window.dispatchEvent(new Event('recently_played:updated'));
          } catch { /* ignore */ }
        }
        p.then(() => { setIsPlaying(true); setShouldPlay(true); })
         .catch(() => toast.error('Erreur lors de la lecture'));
      }
    }
  };

  const handleSkip = (s: number) => {
    if (!audioRef.current) return;
    const t = Math.max(0, Math.min(currentTime + s, duration));
    audioRef.current.currentTime = t; setCurrentTime(t);
  };

  const handleVolumeChange = (v: number) => {
    if (!audioRef.current) return;
    audioRef.current.volume = v; setVolume(v); setIsMuted(v === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) { audioRef.current.volume = volume || 1; setIsMuted(false); }
    else { audioRef.current.volume = 0; setIsMuted(true); }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation(); onShare?.(audioRef.current?.currentTime ?? 0);
  };

  const handleSpeedChange = (s: number) => {
    setPlaybackSpeed(s); toast.success(`Vitesse : ${s}x`);
  };

  const handleDownload = async () => {
    try {
      toast.loading('Préparation...', { id: 'dl' });
      const blob = await (await fetch(url)).blob();
      const link = Object.assign(document.createElement('a'), {
        href: window.URL.createObjectURL(blob),
        download: `${title.replace(/[^a-zA-Z0-9\s]/g, '_')}.mp3`,
      });
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      toast.success('Téléchargement démarré', { id: 'dl' });
    } catch { toast.error('Erreur téléchargement', { id: 'dl' }); }
  };

  // ── Sleep menu (reused) ───────────────────────────────────────
  const SleepMenu = () => (
    <div className="absolute bottom-full mb-2 right-0 rounded-xl shadow-2xl overflow-hidden z-50"
         style={{ background: '#1e293b', minWidth: '170px', border: '1px solid rgba(255,255,255,0.08)' }}>
      {[15, 30, 45, 60].map(m => (
        <button key={m} onClick={() => setSleepTimerTo(m)}
          className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
          style={{ color: '#D1D5DB' }}>{m} minutes</button>
      ))}
      <button onClick={() => setSleepTimerTo(0)}
        className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
        style={{ color: '#D1D5DB', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        Fin du message
      </button>
      {(sleepEndAt !== null || sleepOnEnd) && (
        <button onClick={() => setSleepTimerTo(null)}
          className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
          style={{ color: '#f87171', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          Annuler la minuterie
        </button>
      )}
    </div>
  );

  // ── Skip/Prev icons ───────────────────────────────────────────
  const PrevIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 20L9 12l10-8v16z" /><line x1="5" y1="19" x2="5" y2="5" />
    </svg>
  );
  const NextIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 4l10 8-10 8V4z" /><line x1="19" y1="5" x2="19" y2="19" />
    </svg>
  );

  // ========== MOBILE: COMPACT ==========
  if (isMobile && !isExpanded) {
    return (
      <div onClick={() => setIsExpanded(true)}
           className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl z-50 animate-slide-up cursor-pointer"
           role="button" aria-label="Agrandir le lecteur">
        <div className="flex items-center gap-3 px-3 py-2 h-16">
          <div className="w-10 h-10 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
            {thumbnailUrl
              ? <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center bg-[#00665C]/10">
                  <Play className="w-5 h-5 text-[#00665C]" /></div>}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{title}</h3>
            <p className="text-xs text-gray-500 truncate">{speaker}</p>
          </div>
          <button onClick={e => { e.stopPropagation(); handleSkip(-10); }}
            className="p-2 text-gray-600 disabled:opacity-50" disabled={!!error}><Rewind className="w-5 h-5" /></button>
          <button onClick={e => { e.stopPropagation(); togglePlayPause(); }}
            className="p-2 bg-[#00665C] text-white rounded-full disabled:opacity-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
            disabled={isLoading || !!error}>
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
        </div>
        <div className="absolute bottom-0 left-0 h-0.5 bg-[#00665C]" style={{ width: `${progressPercent}%` }} />
      </div>
    );
  }

  // ========== MOBILE: EXPANDED ==========
  if (isMobile && isExpanded) {
    return (
      <>
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setIsExpanded(false)} />
        <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl animate-slide-up" style={{ height: '90vh' }}>
          <div className="flex flex-col h-full overflow-y-auto">
            <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
              <div className="w-10" />
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
              <button onClick={() => setIsExpanded(false)} className="p-2 text-gray-500">
                <ChevronDown className="w-6 h-6" /></button>
            </div>
            <div className="flex justify-center px-6 pt-4">
              <div className="w-52 h-52 rounded-2xl overflow-hidden bg-gray-100 shadow-xl">
                {thumbnailUrl
                  ? <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#00665C]/10 to-[#F2B636]/10">
                      <Play className="w-16 h-16 text-[#00665C]" /></div>}
              </div>
            </div>
            <div className="px-6 pt-6 text-center">
              <h2 className="text-lg font-bold text-gray-900 line-clamp-2">{title}</h2>
              <p className="text-sm text-gray-600 mt-1">{speaker}</p>
            </div>
            {error && (
              <div className="mx-6 mt-4 flex items-center gap-2 text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
                <AlertTriangle className="w-5 h-5" /><span className="text-sm">{error}</span>
              </div>
            )}
            <div className="px-6 pt-6">
              <div className="h-2 bg-gray-200 rounded-full cursor-pointer relative overflow-hidden" onClick={handleProgressClick}>
                <div className="absolute top-0 left-0 h-full bg-[#00665C] rounded-full" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="flex justify-between text-xs font-mono text-gray-500 mt-2">
                <span>{formatDuration(Math.floor(currentTime))}</span>
                <span>{formatDuration(Math.floor(duration))}</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 px-6 pt-6">
              <button onClick={onPrevious} disabled={!onPrevious || !!error} className="p-2 text-gray-700 disabled:opacity-30"><PrevIcon /></button>
              <button onClick={() => handleSkip(-10)} disabled={!!error} className="p-3 text-gray-700 disabled:opacity-30"><Rewind className="w-8 h-8" /></button>
              <button onClick={togglePlayPause} disabled={isLoading || !!error}
                className="p-5 bg-[#00665C] text-white rounded-full shadow-lg disabled:opacity-50 min-w-[64px] min-h-[64px] flex items-center justify-center">
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
              </button>
              <button onClick={() => handleSkip(10)} disabled={!!error} className="p-3 text-gray-700 disabled:opacity-30"><FastForward className="w-8 h-8" /></button>
              <button onClick={onNext} disabled={!onNext || !!error} className="p-2 text-gray-700 disabled:opacity-30"><NextIcon /></button>
            </div>
            <div className="flex items-center justify-center gap-2 pt-6 px-6">
              {[1, 1.25, 1.5, 2].map(s => (
                <button key={s} onClick={() => handleSpeedChange(s)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full border ${playbackSpeed === s ? 'bg-[#00665C] text-white border-[#00665C]' : 'bg-white text-gray-700 border-gray-200'}`}>
                  {s}x</button>
              ))}
            </div>
            <div className="flex items-center justify-center gap-3 pt-4 px-6">
              <span className="text-xs text-gray-500">Minuterie :</span>
              {[15, 30, 60].map(m => (
                <button key={m} onClick={() => setSleepTimerTo(m)}
                  className="px-3 py-1 text-xs rounded-full border bg-white text-gray-700 border-gray-200">
                  {m}m</button>
              ))}
              {(sleepEndAt !== null || sleepOnEnd) && (
                <button onClick={() => setSleepTimerTo(null)} className="text-xs text-red-500 underline">Annuler</button>
              )}
            </div>
            {sleepCountdown && <p className="text-center text-xs text-amber-600 font-mono pt-1">🌙 {sleepCountdown}</p>}
            <div className="flex items-center justify-center gap-6 pt-6 pb-8 px-6">
              <button onClick={handleDownload} disabled={!!error} className="flex flex-col items-center gap-1 text-gray-600 disabled:opacity-50">
                <Download className="w-6 h-6" /><span className="text-xs">Télécharger</span>
              </button>
              {onShare && (
                <button onClick={handleShare} className="flex flex-col items-center gap-1 text-gray-600">
                  <Share2 className="w-6 h-6" /><span className="text-xs">Partager</span>
                </button>
              )}
              {onQueueOpen && (
                <button onClick={onQueueOpen} className="flex flex-col items-center gap-1 text-gray-600 relative">
                  <ListMusic className="w-6 h-6" />
                  {queueCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F2B636] text-gray-900 rounded-full text-[9px] font-bold flex items-center justify-center">
                      {queueCount}</span>
                  )}
                  <span className="text-xs">File</span>
                </button>
              )}
              <button onClick={onClose} className="flex flex-col items-center gap-1 text-gray-600">
                <X className="w-6 h-6" /><span className="text-xs">Fermer</span>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ========== DESKTOP — Style A: Carte Flottante ==========
  // The outer wrapper leaves room for the sidebar (240 px) and centers
  // the card within the main content area.
  return (
    <div
      className="fixed bottom-0 z-50 flex items-end pointer-events-none animate-slide-up"
      style={{ left: 0, right: 0, bottom: 0, paddingBottom: '16px', paddingLeft: '240px' }}
    >
      <div
        className="w-full pointer-events-auto"
        style={{ maxWidth: '680px', margin: '0 auto' }}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1a2332 0%, #0f172a 100%)',
            boxShadow: '0 -2px 40px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.09)',
          }}
        >
          {/* Progress bar — top edge */}
          <div
            className="w-full cursor-pointer"
            style={{ height: '3px', background: 'rgba(255,255,255,0.08)' }}
            onClick={handleProgressClick}
          >
            <div
              style={{ height: '100%', background: '#F2B636', transition: 'width 0.3s linear', width: `${progressPercent}%` }}
            />
          </div>

          <div className="px-5 pt-4 pb-4">
            {/* Row 1: Thumbnail + info + inline seek bar */}
            <div className="flex items-center gap-4 mb-3">
              {/* Thumbnail */}
              <div className="w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden"
                   style={{ background: 'rgba(255,255,255,0.07)' }}>
                {thumbnailUrl
                  ? <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-6 h-6" style={{ color: '#F2B636' }} /></div>}
              </div>

              {/* Title + speaker + inline progress */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold truncate mb-0.5" style={{ color: '#F9FAFB' }}>{title}</h3>
                <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>{speaker}</p>
                {/* Inline seek bar */}
                <div className="flex items-center gap-2 mt-2">
                  <div
                    className="flex-1 h-1.5 rounded-full cursor-pointer overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.12)' }}
                    onClick={handleProgressClick}
                  >
                    <div style={{ height: '100%', width: `${progressPercent}%`, background: '#F2B636', borderRadius: '9999px', transition: 'width 0.3s linear' }} />
                  </div>
                  <span className="text-[11px] font-mono flex-shrink-0" style={{ color: '#6B7280' }}>
                    {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration))}
                  </span>
                </div>
              </div>

              {/* Error badge */}
              {error && (
                <div className="flex items-center gap-1 text-xs px-2 py-1 rounded flex-shrink-0"
                     style={{ background: 'rgba(239,68,68,0.15)', color: '#FCA5A5' }}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            {/* Row 2: Controls full width */}
            <div className="flex items-center justify-between gap-2">

              {/* Left: Volume */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={toggleMute} disabled={!!error}
                  className="p-1.5 rounded-full disabled:opacity-30" style={{ color: '#9CA3AF' }}>
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input type="range" min={0} max={1} step={0.1} value={isMuted ? 0 : volume}
                  onChange={e => handleVolumeChange(Number(e.target.value))}
                  className="volume-slider w-20 hidden sm:block" disabled={!!error}
                  style={{ '--volume-percent': `${(isMuted ? 0 : volume) * 100}%` } as React.CSSProperties} />
              </div>

              {/* Center: Transport */}
              <div className="flex items-center gap-2">
                <button onClick={onPrevious} disabled={!onPrevious || !!error}
                  className="p-2 rounded-full disabled:opacity-30" style={{ color: '#D1D5DB' }} title="Précédent">
                  <PrevIcon />
                </button>
                <button onClick={() => handleSkip(-10)} disabled={!!error}
                  className="p-2 rounded-full disabled:opacity-30" style={{ color: '#D1D5DB' }} title="−10s">
                  <Rewind className="w-5 h-5" />
                </button>
                <button onClick={togglePlayPause} disabled={isLoading || !!error}
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-50 shadow-lg"
                  style={{ background: '#F2B636', color: '#111827' }} title={isPlaying ? 'Pause' : 'Lecture'}>
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <button onClick={() => handleSkip(10)} disabled={!!error}
                  className="p-2 rounded-full disabled:opacity-30" style={{ color: '#D1D5DB' }} title="+10s">
                  <FastForward className="w-5 h-5" />
                </button>
                <button onClick={onNext} disabled={!onNext || !!error}
                  className="p-2 rounded-full disabled:opacity-30" style={{ color: '#D1D5DB' }} title="Suivant">
                  <NextIcon />
                </button>
              </div>

              {/* Right: Extra controls */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Speed */}
                <select value={playbackSpeed} onChange={e => handleSpeedChange(Number(e.target.value))}
                  disabled={!!error}
                  className="text-xs rounded-lg px-2 py-1 border-none hidden md:block focus:outline-none disabled:opacity-30"
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#D1D5DB' }}>
                  <option value={0.75}>0.75x</option>
                  <option value={1.0}>1x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2.0}>2x</option>
                </select>

                {/* Sleep timer */}
                <div className="relative">
                  <button onClick={() => setShowSleepMenu(s => !s)}
                    className="p-1.5 rounded-full flex items-center gap-0.5 transition-colors"
                    style={{ color: (sleepEndAt !== null || sleepOnEnd) ? '#F2B636' : '#9CA3AF' }}
                    title="Minuterie d'arrêt">
                    <Timer className="w-4 h-4" />
                    {sleepCountdown && <span className="text-[10px] font-mono">{sleepCountdown}</span>}
                  </button>
                  {showSleepMenu && <SleepMenu />}
                </div>

                {/* Queue */}
                {onQueueOpen && (
                  <div className="relative">
                    <button onClick={onQueueOpen} className="p-1.5 rounded-full transition-colors" style={{ color: '#9CA3AF' }} title="File de lecture">
                      <ListMusic className="w-4 h-4" />
                      {queueCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full text-[9px] font-bold flex items-center justify-center"
                              style={{ background: '#F2B636', color: '#111827' }}>
                          {queueCount}
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {/* Download */}
                <button onClick={handleDownload} disabled={!!error}
                  className="p-1.5 rounded-full disabled:opacity-30 hidden sm:block" style={{ color: '#9CA3AF' }} title="Télécharger">
                  <Download className="w-4 h-4" />
                </button>

                {/* Share */}
                {onShare && (
                  <button onClick={handleShare} className="p-1.5 rounded-full" style={{ color: '#9CA3AF' }} title="Partager">
                    <Share2 className="w-4 h-4" />
                  </button>
                )}

                {/* Close */}
                <button onClick={onClose} className="p-1.5 rounded-full" style={{ color: '#9CA3AF' }} title="Fermer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
