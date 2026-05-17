import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, AlertTriangle, Rewind, FastForward, X, Share2, Download, ChevronDown } from 'lucide-react';
import { formatDuration } from '../../utils/dateUtils';
import { supabase } from '../../lib/supabase';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import toast from 'react-hot-toast';

interface AudioPlayerProps {
  url: string;
  id: string;
  title: string;
  speaker: string;
  thumbnailUrl?: string; // Keep this as thumbnailUrl since it's used in the props
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onEnded?: () => void;
  onShare?: () => void;
  initialPlayState?: boolean;
}

export function AudioPlayer({ 
  url, 
  id, 
  title, 
  speaker, 
  thumbnailUrl, 
  onClose, 
  onNext, 
  onPrevious, 
  onEnded, 
  onShare, 
  initialPlayState = false 
}: AudioPlayerProps) {
  // Créer une référence audio persistante qui ne sera pas recréée à chaque changement d'URL
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  // Ajout d'un état pour suivre si l'audio doit reprendre automatiquement après changement d'URL
  const [shouldPlay, setShouldPlay] = useState(initialPlayState);
  const [isPlaying, setIsPlaying] = useState(false); 
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const playTrackedRef = useRef(false);
  const [waveformPathData, setWaveformPathData] = useState<string>('');
  const [loadingWaveform, setLoadingWaveform] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isExpanded, setIsExpanded] = useState(false);
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  
  // Gérer les propriétés de l'audio et les événements de base lors du premier montage
  // Initialize audio element once and reuse it throughout the component's lifecycle
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = volume;
    
    // Store reference
    audioRef.current = audio;
    
    // Cleanup on unmount
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);
  
  // Ref pour décider si on auto-joue après un changement d'URL (évite les dépendances instables)
  const autoPlayRef = useRef(initialPlayState);

  // Mettre à jour la source audio UNIQUEMENT quand l'URL change
  // Volume et mute sont gérés par leur propre effet séparé — ne pas les mettre ici
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Décider si on doit reprendre la lecture (capture instantanée au moment du changement d'URL)
    autoPlayRef.current = initialPlayState || isPlaying;

    setError(null);
    setIsLoading(true);
    playTrackedRef.current = false;

    audio.src = url;
    // Appliquer le volume courant sans passer par les deps
    audio.volume = audio.muted ? 0 : audio.volume;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      setError(null);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      updateProgress();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setShouldPlay(false);
      onEnded?.();
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      if (autoPlayRef.current) {
        autoPlayRef.current = false; // ne jouer qu'une fois
        audio.play()
          .then(() => {
            setIsPlaying(true);
            setShouldPlay(true);
            playTrackedRef.current = true;
          })
          .catch(() => {
            setIsPlaying(false);
            setShouldPlay(false);
          });
      }
    };

    const handleError = () => {
      const msg = getErrorMessage(audio.error);
      setError(msg);
      setIsLoading(false);
      setIsPlaying(false);
      toast.error('Impossible de lire cet audio. Veuillez réessayer plus tard.');
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [url]); // ← UNIQUEMENT url : volume/mute/shouldPlay ont leur propre effet
  
  // Mettre à jour le volume quand il change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);
  
  // Mettre à jour la vitesse de lecture quand elle change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);
  
  const getErrorMessage = (error: MediaError | null): string => {
    if (!error) return 'Erreur inconnue';
    
    switch (error.code) {
      case MediaError.MEDIA_ERR_ABORTED:
        return 'La lecture a été interrompue';
      case MediaError.MEDIA_ERR_NETWORK:
        return 'Erreur réseau lors du chargement';
      case MediaError.MEDIA_ERR_DECODE:
        return 'Impossible de décoder l\'audio';
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        return 'Format audio non supporté';
      default:
        return 'Erreur lors de la lecture';
    }
  };
  
  const updateProgress = () => {
    if (!audioRef.current || !progressBarRef.current) return;
    
    const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
    progressBarRef.current.style.width = `${progress}%`;
  };
  
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    
    const bounds = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - bounds.left) / bounds.width;
    const newTime = percent * audioRef.current.duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  const togglePlayPause = () => {
    if (!audioRef.current || error) return;
    
    try {
      if (isPlaying) {
        // Si on met en pause
        audioRef.current.pause();
        setIsPlaying(false);
        setShouldPlay(false);
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          // Track play count when user explicitly starts playing
          if (!playTrackedRef.current) {
            supabase.from('teachings').select('plays').eq('id', id).single().then(({ data }) => { if (data) supabase.from('teachings').update({ plays: (data.plays || 0) + 1 }).eq('id', id).then(() => {}); });
            playTrackedRef.current = true;
            console.log("Tracking play count for:", id);

            // Persist locally for "Récemment écoutés"
            try {
              const key = 'recently_played';
              const stored: string[] = JSON.parse(localStorage.getItem(key) || '[]');
              const updated = [id, ...stored.filter((v) => v !== id)].slice(0, 5);
              localStorage.setItem(key, JSON.stringify(updated));
              window.dispatchEvent(new Event('recently_played:updated'));
            } catch {
              // ignore localStorage errors
            }
          }
          
          playPromise
            .then(() => {
              setIsPlaying(true);
              setShouldPlay(true);
            })
            .catch(error => {
              console.error('Error playing audio:', error);
              toast.error('Erreur lors de la lecture');
            });
        }
      }
    } catch (err) {
      console.error('Error toggling play/pause:', err);
      toast.error('Erreur lors de la lecture');
    }
  };
  
  const handleSkip = (seconds: number) => {
    if (!audioRef.current) return;
    
    const newTime = Math.max(0, Math.min(currentTime + seconds, duration));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  const handleVolumeChange = (newVolume: number) => {
    if (!audioRef.current) return;
    
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };
  
  const toggleMute = () => {
    if (!audioRef.current) return;
    
    if (isMuted) {
      audioRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  // Keyboard shortcuts (desktop): Space, ←/→, ↑/↓, N, P, M
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      // Skip when typing in inputs/textareas/selects or contentEditable
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target?.isContentEditable
      ) return;
      if (error) return;

      switch (e.key) {
        case ' ':
        case 'Spacebar':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSkip(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSkip(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.1));
          break;
        case 'n':
        case 'N':
          if (onNext) { e.preventDefault(); onNext(); }
          break;
        case 'p':
        case 'P':
          if (onPrevious) { e.preventDefault(); onPrevious(); }
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentTime, duration, volume, isMuted, onNext, onPrevious, error]);
  
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare();
    }
  };
  
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    toast.success(`Vitesse de lecture: ${speed}x`);
  };

  const handleDownload = async () => {
    try {
      toast.loading('Préparation du téléchargement...', { id: 'download' });
      const response = await fetch(url);
      const blob = await response.blob();
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${title.replace(/[^a-zA-Z0-9\s]/g, '_')}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('Téléchargement démarré', { id: 'download' });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Erreur lors du téléchargement', { id: 'download' });
    }
  };
  
  // ========== MOBILE: COMPACT MODE ==========
  if (isMobile && !isExpanded) {
    return (
      <div
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl z-50 animate-slide-up cursor-pointer"
        role="button"
        aria-label="Agrandir le lecteur"
      >
        <div className="flex items-center gap-3 px-3 py-2 h-16">
          <div className="w-10 h-10 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#00665C]/10">
                <Play className="w-5 h-5 text-[#00665C]" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{title}</h3>
            <p className="text-xs text-gray-500 truncate">{speaker}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleSkip(-10); }}
            className="p-2 text-gray-600 hover:text-[#00665C] disabled:opacity-50"
            disabled={!!error}
            aria-label="Reculer 10 secondes"
          >
            <Rewind className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
            className="p-2 bg-[#00665C] text-white rounded-full disabled:opacity-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
            disabled={isLoading || !!error}
            aria-label={isPlaying ? 'Pause' : 'Lecture'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
        </div>
        {/* Fine progress bar */}
        <div className="absolute bottom-0 left-0 h-0.5 bg-[#00665C]" style={{ width: `${progressPercent}%` }} />
      </div>
    );
  }

  // ========== MOBILE: EXPANDED MODE ==========
  if (isMobile && isExpanded) {
    return (
      <>
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setIsExpanded(false)} />
        <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl animate-slide-up" style={{ height: '90vh' }}>
          <div className="flex flex-col h-full overflow-y-auto">
            {/* Header bar with handle and close */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
              <div className="w-10" />
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 text-gray-500 hover:text-gray-900"
                aria-label="Réduire le lecteur"
              >
                <ChevronDown className="w-6 h-6" />
              </button>
            </div>

            {/* Cover */}
            <div className="flex justify-center px-6 pt-4">
              <div className="w-48 h-48 rounded-2xl overflow-hidden bg-gray-100 shadow-xl">
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#00665C]/10 to-[#F2B636]/10">
                    <Play className="w-16 h-16 text-[#00665C]" />
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <div className="px-6 pt-6 text-center">
              <h2 className="text-lg font-bold text-gray-900 line-clamp-2">{title}</h2>
              <p className="text-sm text-gray-600 mt-1">{speaker}</p>
            </div>

            {error && (
              <div className="mx-6 mt-4 flex items-center justify-center gap-2 text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Progress */}
            <div className="px-6 pt-6">
              <div
                className="h-2 bg-gray-200 rounded-full cursor-pointer relative overflow-hidden"
                onClick={handleProgressClick}
              >
                <div
                  className="absolute top-0 left-0 h-full bg-[#00665C] rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-mono text-gray-500 mt-2">
                <span>{formatDuration(Math.floor(currentTime))}</span>
                <span>{formatDuration(Math.floor(duration))}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 px-6 pt-6">
              <button
                onClick={onPrevious}
                disabled={!onPrevious || !!error}
                className="p-2 text-gray-700 disabled:opacity-30"
                aria-label="Précédent"
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 20L9 12l10-8v16z" />
                  <line x1="5" y1="19" x2="5" y2="5" />
                </svg>
              </button>
              <button
                onClick={() => handleSkip(-10)}
                disabled={!!error}
                className="p-3 text-gray-700 disabled:opacity-30"
                aria-label="Reculer 10s"
              >
                <Rewind className="w-8 h-8" />
              </button>
              <button
                onClick={togglePlayPause}
                disabled={isLoading || !!error}
                className="p-5 bg-[#00665C] text-white rounded-full shadow-lg disabled:opacity-50 min-w-[64px] min-h-[64px] flex items-center justify-center"
                aria-label={isPlaying ? 'Pause' : 'Lecture'}
              >
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
              </button>
              <button
                onClick={() => handleSkip(10)}
                disabled={!!error}
                className="p-3 text-gray-700 disabled:opacity-30"
                aria-label="Avancer 10s"
              >
                <FastForward className="w-8 h-8" />
              </button>
              <button
                onClick={onNext}
                disabled={!onNext || !!error}
                className="p-2 text-gray-700 disabled:opacity-30"
                aria-label="Suivant"
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 4l10 8-10 8V4z" />
                  <line x1="19" y1="5" x2="19" y2="19" />
                </svg>
              </button>
            </div>

            {/* Speed selector */}
            <div className="flex items-center justify-center gap-2 pt-6 px-6">
              {[1, 1.25, 1.5, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                    playbackSpeed === s
                      ? 'bg-[#00665C] text-white border-[#00665C]'
                      : 'bg-white text-gray-700 border-gray-200'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Bottom actions */}
            <div className="flex items-center justify-center gap-6 pt-6 pb-8 px-6">
              <button
                onClick={handleDownload}
                disabled={!!error}
                className="flex flex-col items-center gap-1 text-gray-600 hover:text-[#00665C] disabled:opacity-50"
              >
                <Download className="w-6 h-6" />
                <span className="text-xs">Télécharger</span>
              </button>
              {onShare && (
                <button
                  onClick={handleShare}
                  className="flex flex-col items-center gap-1 text-gray-600 hover:text-[#00665C]"
                >
                  <Share2 className="w-6 h-6" />
                  <span className="text-xs">Partager</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="flex flex-col items-center gap-1 text-gray-600 hover:text-red-500"
              >
                <X className="w-6 h-6" />
                <span className="text-xs">Fermer</span>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ========== DESKTOP MODE — Style B sombre ==========
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up" style={{ background: '#111827', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Progress bar — full width, top */}
      <div
        className="w-full cursor-pointer"
        style={{ height: '3px', background: 'rgba(255,255,255,0.12)' }}
        onClick={handleProgressClick}
      >
        <div
          ref={progressBarRef}
          style={{ height: '100%', background: 'rgba(255,255,255,0.85)', transition: 'width 0.3s linear', width: `${progressPercent}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">

        {/* Thumbnail + title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-11 h-11 flex-shrink-0 rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-5 h-5" style={{ color: '#F2B636' }} />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate" style={{ color: '#F9FAFB' }}>{title}</h3>
            <p className="text-xs truncate mt-0.5" style={{ color: '#9CA3AF' }}>{speaker}</p>
          </div>
        </div>

        {/* Time */}
        <span className="text-xs font-mono flex-shrink-0 hidden sm:block" style={{ color: '#6B7280', minWidth: '80px', textAlign: 'center' }}>
          {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration))}
        </span>

        {/* Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onPrevious}
            disabled={!onPrevious || !!error}
            className="p-2 rounded-full transition-colors disabled:opacity-30"
            style={{ color: '#D1D5DB' }}
            title="Piste précédente"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 20L9 12l10-8v16z" /><line x1="5" y1="19" x2="5" y2="5" />
            </svg>
          </button>
          <button
            onClick={() => handleSkip(-10)}
            disabled={!!error}
            className="p-2 rounded-full transition-colors disabled:opacity-30"
            style={{ color: '#D1D5DB' }}
            title="Reculer 10s"
          >
            <Rewind className="w-5 h-5" />
          </button>
          <button
            onClick={togglePlayPause}
            disabled={isLoading || !!error}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-50"
            style={{ background: '#F2B636', color: '#111827' }}
            title={isPlaying ? 'Pause' : 'Lecture'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <button
            onClick={() => handleSkip(10)}
            disabled={!!error}
            className="p-2 rounded-full transition-colors disabled:opacity-30"
            style={{ color: '#D1D5DB' }}
            title="Avancer 10s"
          >
            <FastForward className="w-5 h-5" />
          </button>
          <button
            onClick={onNext}
            disabled={!onNext || !!error}
            className="p-2 rounded-full transition-colors disabled:opacity-30"
            style={{ color: '#D1D5DB' }}
            title="Piste suivante"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 4l10 8-10 8V4z" /><line x1="19" y1="5" x2="19" y2="19" />
            </svg>
          </button>
        </div>

        {/* Volume */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <button
            onClick={toggleMute}
            disabled={!!error}
            className="p-1.5 rounded-full transition-colors disabled:opacity-30"
            style={{ color: '#9CA3AF' }}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="volume-slider w-20"
            style={{ '--volume-percent': `${(isMuted ? 0 : volume) * 100}%` } as React.CSSProperties}
            disabled={!!error}
          />
        </div>

        {/* Speed */}
        <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
          <select
            value={playbackSpeed}
            onChange={(e) => handleSpeedChange(Number(e.target.value))}
            disabled={!!error}
            className="text-xs rounded px-2 py-1 border-none focus:outline-none focus:ring-1 focus:ring-yellow-400 disabled:opacity-30"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#D1D5DB' }}
          >
            <option value={0.5}>0.5x</option>
            <option value={0.75}>0.75x</option>
            <option value={1.0}>1x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2.0}>2x</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {error && (
            <div className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#FCA5A5' }}>
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{error}</span>
            </div>
          )}
          <button
            onClick={handleDownload}
            disabled={!!error}
            className="p-2 rounded-full transition-colors disabled:opacity-30"
            style={{ color: '#9CA3AF' }}
            title="Télécharger"
          >
            <Download className="w-4 h-4" />
          </button>
          {onShare && (
            <button
              onClick={handleShare}
              className="p-2 rounded-full transition-colors"
              style={{ color: '#9CA3AF' }}
              title="Partager"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors"
            style={{ color: '#9CA3AF' }}
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
