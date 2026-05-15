import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, AlertTriangle, Rewind, FastForward, X, Share2, Download, ChevronDown } from 'lucide-react';
import { formatDuration } from '../../utils/dateUtils';
import { incrementPlayCount } from '../../lib/db';
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
  
  // Mettre à jour la source audio et les événements lorsque l'URL change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Reset audio player state for new URL
    setError(null);
    setIsLoading(true);
    playTrackedRef.current = false;
    
    // If this is initial load and initialPlayState is true, or
    // if we're changing audio and current audio was playing
    const shouldContinuePlaying = initialPlayState || isPlaying;
    setShouldPlay(shouldContinuePlaying);
    
    console.log(`Audio source changing to: ${url}, should continue playing: ${shouldContinuePlaying}`);
    
    // Mettre à jour la source audio
    audio.src = url;
    audio.volume = isMuted ? 0 : volume;
    
    // Set up event listeners
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
      // Restaurer l'état de lecture après changement d'URL
      if (shouldPlay) {
        audio.play()
          .then(() => { 
            console.log("Auto-playing audio after source change");
            setIsPlaying(true);
            playTrackedRef.current = true;
          })
          .catch(error => {
            console.error('Error auto-playing audio after source change:', error);
            setShouldPlay(false);
            setIsPlaying(false);
          });
      }
    };
    
    const handleError = () => {
      const errorMessage = getErrorMessage(audio.error);
      console.error('Audio error:', errorMessage, audio.error);
      setError(errorMessage);
      setIsLoading(false);
      setIsPlaying(false);
      toast.error('Impossible de lire cet audio. Veuillez réessayer plus tard.');
    };
    
    // Add event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    
    // Load the audio
    audio.load();
    
    // Cleanup
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [url, volume, isMuted, shouldPlay, initialPlayState]);
  
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
            incrementPlayCount(id);
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

  // ========== DESKTOP MODE (unchanged) ==========
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-white via-gray-50 to-white backdrop-blur-sm border-t shadow-2xl z-50 animate-slide-up">
      <div className="space-y-6 p-6">
        {/* Title and Thumbnail */}
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg ring-2 ring-white">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#00665C]/10 to-[#F2B636]/10">
                  <Play className="w-10 h-10 text-[#00665C]" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="overflow-hidden">
                <h3 className="text-xl font-bold text-gray-900 truncate transition-colors duration-200 hover:text-[#00665C]">
                  {title}
                </h3>
              </div>
              <div className="mt-1">
                <p className="text-base text-gray-600 font-medium truncate">
                  {speaker}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="p-3 text-gray-400 hover:text-[#00665C] rounded-full hover:bg-[#00665C]/10 transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg"
              title="Télécharger l'audio"
              disabled={!!error}
            >
              <Download className="w-6 h-6" />
            </button>
            {onShare && (
              <button
                onClick={handleShare}
                className="p-3 text-gray-400 hover:text-[#00665C] rounded-full hover:bg-[#00665C]/10 transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg"
                title="Partager"
              >
                <Share2 className="w-6 h-6" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-3 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg"
              title="Fermer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center justify-center space-x-3 text-red-700 bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl border border-red-200 shadow-inner">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
            <span className="text-base font-medium">{error}</span>
          </div>
        )}

        {/* Audio visualization */}
        <div className="max-w-7xl mx-auto relative">
          <div
            className="h-6 bg-gray-200 rounded-full cursor-pointer relative overflow-hidden"
            onClick={handleProgressClick}
          >
            <div
              ref={progressBarRef}
              className="absolute top-0 left-0 h-full bg-[#00665C] rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="text-base font-mono text-gray-600 bg-gray-100 px-3 py-2 rounded-lg shadow-inner">
            {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration))}
          </div>

          <div className="flex items-center space-x-6">
            <button
              onClick={onPrevious}
              className="p-3 text-gray-600 hover:text-[#00665C] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#00665C]/10 rounded-full hover:scale-110 shadow-md hover:shadow-lg"
              title="Piste précédente"
              disabled={!onPrevious || !!error}
            >
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 20L9 12l10-8v16z" />
                <line x1="5" y1="19" x2="5" y2="5" />
              </svg>
            </button>

            <button
              onClick={() => handleSkip(-10)}
              className="p-3 text-gray-600 hover:text-[#00665C] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#00665C]/10 rounded-full hover:scale-110 shadow-md hover:shadow-lg"
              title="Reculer de 10 secondes"
              disabled={!!error}
            >
              <Rewind className="w-7 h-7" />
            </button>

            <button
              onClick={togglePlayPause}
              className="relative p-5 bg-gradient-to-r from-[#00665C] to-[#00665C]/90 text-white rounded-full hover:from-[#00665C]/90 hover:to-[#00665C] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-110 active:scale-95"
              disabled={isLoading || !!error}
              title={isPlaying ? 'Pause' : 'Lecture'}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
              {isPlaying ? (
                <Pause className="w-8 h-8 relative z-10" />
              ) : (
                <Play className="w-8 h-8 relative z-10" />
              )}
            </button>

            <button
              onClick={() => handleSkip(10)}
              className="p-3 text-gray-600 hover:text-[#00665C] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#00665C]/10 rounded-full hover:scale-110 shadow-md hover:shadow-lg"
              title="Avancer de 10 secondes"
              disabled={!!error}
            >
              <FastForward className="w-7 h-7" />
            </button>

            <button
              onClick={onNext}
              className="p-3 text-gray-600 hover:text-[#00665C] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#00665C]/10 rounded-full hover:scale-110 shadow-md hover:shadow-lg"
              title="Piste suivante"
              disabled={!onNext || !!error}
            >
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 4l10 8-10 8V4z" />
                <line x1="19" y1="5" x2="19" y2="19" />
              </svg>
            </button>
          </div>

          {/* Volume */}
          <div className="hidden md:flex items-center space-x-3 bg-white px-4 py-3 rounded-xl shadow-md border border-gray-200">
            <button
              onClick={toggleMute}
              className="text-gray-600 hover:text-[#00665C] transition-all duration-200 disabled:opacity-50 hover:scale-110"
              disabled={!!error}
            >
              {isMuted ? (
                <VolumeX className="w-6 h-6" />
              ) : (
                <Volume2 className="w-6 h-6" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="volume-slider w-28"
              style={{'--volume-percent': `${(isMuted ? 0 : volume) * 100}%`} as React.CSSProperties}
              disabled={!!error}
            />
          </div>

          {/* Speed Control */}
          <div className="hidden md:flex items-center space-x-3 bg-white px-4 py-3 rounded-xl shadow-md border border-gray-200">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Vitesse</span>
            <select
              value={playbackSpeed}
              onChange={(e) => handleSpeedChange(Number(e.target.value))}
              className="text-sm bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-[#00665C] rounded px-2 py-1"
              disabled={!!error}
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1.0}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2.0}>2x</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}