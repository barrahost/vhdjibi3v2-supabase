import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useSearchParams } from 'react-router-dom';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { formatDateForInput, isWithinLast7Days } from '../utils/dateUtils';
import { AudioPlayer } from '../components/audio/AudioPlayer';
import { DateRangePicker, DateRange } from '../components/ui/DateRangePicker';
import { SpotifyCard, getSpeakerAvatar } from '../components/audio/SpotifyCard';
import { Logo } from '../components/ui/Logo';
import toast from 'react-hot-toast';
import {
  Search, X, Share2, Info, Headphones, Menu,
  Facebook, Copy, Check, Star, Clock, Sun, Moon,
  Heart, ListMusic, Layers,
} from 'lucide-react';

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = {
  light: {
    pageBg: '#f8fafc', sidebarBg: '#ffffff', sidebarBorder: '#e5e7eb',
    topbarBg: 'rgba(248,250,252,0.95)', topbarBorder: '#e5e7eb',
    cardBg: '#ffffff', cardHover: '#f1f5f9', cardSelected: '#ecfdf5',
    textH: '#0f172a', textBody: '#374151', textMuted: '#9ca3af',
    accent: '#00665C', accentBg: 'rgba(0,102,92,0.08)',
    gold: '#d97706', inputBg: '#f1f5f9', inputText: '#0f172a',
    sectionLabel: '#9ca3af', modalBg: '#ffffff',
    chipBg: '#f1f5f9', chipText: '#475569',
    chipActive: '#00665C', chipActiveText: '#ffffff',
    loadMoreBg: '#f1f5f9', loadMoreText: '#6b7280', loadMoreBorder: '#e5e7eb',
    navActiveBg: 'rgba(0,102,92,0.08)', navActiveText: '#00665C', navText: '#6b7280',
    badgeBg: 'rgba(0,102,92,0.08)', badgeText: '#00665C',
    resetBg: 'rgba(239,68,68,0.06)', resetText: '#dc2626',
    toggleBg: '#f1f5f9', toggleText: '#475569',
    overlayBg: 'rgba(0,0,0,0.45)', drawerBg: '#ffffff',
    favBg: 'rgba(244,63,94,0.08)', favText: '#f43f5e',
  },
  dark: {
    pageBg: '#0f172a', sidebarBg: '#0a0f1a', sidebarBorder: 'rgba(255,255,255,0.05)',
    topbarBg: 'rgba(15,23,42,0.92)', topbarBorder: 'rgba(255,255,255,0.05)',
    cardBg: '#1a2332', cardHover: '#253341', cardSelected: '#253341',
    textH: '#f1f5f9', textBody: '#cbd5e1', textMuted: '#475569',
    accent: '#F2B636', accentBg: 'rgba(242,182,54,0.12)',
    gold: '#F2B636', inputBg: '#1e293b', inputText: '#e2e8f0',
    sectionLabel: '#475569', modalBg: '#1e293b',
    chipBg: '#1e293b', chipText: '#94a3b8',
    chipActive: '#F2B636', chipActiveText: '#111827',
    loadMoreBg: '#1e293b', loadMoreText: '#94a3b8', loadMoreBorder: 'rgba(255,255,255,0.08)',
    navActiveBg: 'rgba(242,182,54,0.12)', navActiveText: '#F2B636', navText: '#94a3b8',
    badgeBg: 'rgba(242,182,54,0.12)', badgeText: '#F2B636',
    resetBg: 'rgba(239,68,68,0.1)', resetText: '#f87171',
    toggleBg: '#1e293b', toggleText: '#94a3b8',
    overlayBg: 'rgba(0,0,0,0.65)', drawerBg: '#0a0f1a',
    favBg: 'rgba(244,63,94,0.12)', favText: '#f87171',
  },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getOneMonthAgoDate = () => {
  const d = new Date(); d.setMonth(d.getMonth() - 1);
  return formatDateForInput(d);
};

interface Teaching {
  id: string; title: string; description: string;
  speaker: string; category: string; tags: string[];
  date: Date; duration: number; fileUrl: string;
  thumbnail_url?: string; featured?: boolean;
  file_url?: string; theme?: string; plays?: number;
}

interface SavedPosition { time: number; duration: number; }
type SortKey = 'date-desc' | 'date-asc' | 'title' | 'speaker';

const ITEMS_STEP = 24;

// ─── Component ────────────────────────────────────────────────────────────────
export default function ReplayTeachings() {
  const [searchParams] = useSearchParams();

  // Theme
  const [isDark, setIsDark] = useState<boolean>(() => {
    try { return localStorage.getItem('replay-theme') === 'dark'; } catch { return false; }
  });
  const th = isDark ? T.dark : T.light;
  const toggleTheme = () => setIsDark(d => {
    const next = !d;
    try { localStorage.setItem('replay-theme', next ? 'dark' : 'light'); } catch {}
    return next;
  });

  // Data
  const [teachings, setTeachings]              = useState<Teaching[]>([]);
  const [featuredTeachings, setFeaturedTeachings] = useState<Teaching[]>([]);
  const [selectedTeaching, setSelectedTeaching] = useState<Teaching | null>(null);
  const [loading, setLoading]                   = useState(true);
  const [currentIndex, setCurrentIndex]         = useState(-1);
  const [dateRange, setDateRange]               = useState<DateRange>({
    startDate: getOneMonthAgoDate(),
    endDate:   formatDateForInput(new Date()),
  });

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSpeaker, setSelectedSpeaker]   = useState('');
  const [selectedTheme, setSelectedTheme]       = useState('');
  const [searchTerm, setSearchTerm]             = useState('');
  const [sortBy, setSortBy]                     = useState<SortKey>('date-desc');
  const [visibleCount, setVisibleCount]         = useState(ITEMS_STEP);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Persistence
  const [savedPositions, setSavedPositions] = useState<Record<string, SavedPosition>>(() => {
    try { return JSON.parse(localStorage.getItem('audio_positions') || '{}'); } catch { return {}; }
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('replay_favorites') || '[]'); } catch { return []; }
  });
  const [recentlyPlayedIds, setRecentlyPlayedIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('recently_played') || '[]'); } catch { return []; }
  });

  // Queue
  const [queue, setQueue]       = useState<Teaching[]>([]);
  const [showQueue, setShowQueue] = useState(false);

  // UI
  const [isSidebarOpen, setIsSidebarOpen]   = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showInfoModal, setShowInfoModal]   = useState(false);
  const [copied, setCopied]                 = useState(false);
  const [shareTime, setShareTime]           = useState<number>(0);

  // Player
  const [isAudioPlayerVisible, setIsAudioPlayerVisible] = useState(false);
  const [audioPlayerProps, setAudioPlayerProps] = useState<{
    url: string; id: string; title: string; speaker: string;
    thumbnailUrl?: string; initialTime?: number;
  } | null>(null);
  const shouldContinuePlaying = useRef(false);

  const isMobile = useMediaQuery('(max-width: 1023px)');
  const mainRef  = useRef<HTMLDivElement>(null);

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchTeachings = async () => {
    try {
      let q = supabase.from('teachings').select('*').eq('status', 'active').order('date', { ascending: false });
      if (dateRange.startDate && dateRange.endDate) {
        q = q.gte('date', new Date(dateRange.startDate).toISOString())
             .lte('date', new Date(dateRange.endDate).toISOString());
      }
      const { data, error } = await q;
      if (error) { toast.error('Erreur de chargement'); setLoading(false); return; }
      const list = (data ?? []).map(r => ({
        id: r.id, title: r.title || '', description: r.description || '',
        speaker: r.speaker || '', category: r.category || '', tags: r.tags || [],
        duration: r.duration || 0, fileUrl: r.fileUrl || r.file_url || '',
        thumbnail_url: r.thumbnailUrl || r.thumbnail_url,
        date: r.date ? new Date(r.date) : new Date(),
        featured: r.featured || false, file_url: r.fileUrl || r.file_url,
        theme: r.theme, plays: r.plays || 0,
      })) as Teaching[];
      setFeaturedTeachings(list.filter(t => isWithinLast7Days(t.date)));
      setTeachings(list);
      setLoading(false);
    } catch { toast.error('Erreur de chargement'); setLoading(false); }
  };

  useEffect(() => {
    fetchTeachings();
    const ch = supabase.channel('replay-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teachings' }, fetchTeachings)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    const sync = () => {
      try { setRecentlyPlayedIds(JSON.parse(localStorage.getItem('recently_played') || '[]')); } catch {}
    };
    window.addEventListener('recently_played:updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('recently_played:updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  // URL params: ?audioId=X&t=Y
  useEffect(() => {
    const audioId = searchParams.get('audioId');
    const tParam  = searchParams.get('t');
    if (audioId && teachings.length > 0 && !selectedTeaching) {
      const t = teachings.find(t => t.id === audioId);
      if (t) {
        const startTime = tParam ? parseInt(tParam, 10) : (savedPositions[t.id]?.time ?? 0);
        handleTeachingSelect(t, startTime);
      }
    }
  }, [teachings, searchParams]);

  useEffect(() => {
    if (selectedTeaching) setCurrentIndex(teachings.findIndex(t => t.id === selectedTeaching.id));
    else setCurrentIndex(-1);
  }, [selectedTeaching, teachings]);

  // ── Derived ────────────────────────────────────────────────────
  const categories = useMemo(() => [...new Set(teachings.map(t => t.category).filter(Boolean))], [teachings]);
  const speakers   = useMemo(() => [...new Set(teachings.map(t => t.speaker).filter(Boolean))], [teachings]);
  const themes     = useMemo(() => [...new Set(teachings.map(t => t.theme).filter(Boolean) as string[])], [teachings]);

  const filteredTeachings = useMemo(() => teachings.filter(t => {
    const q = searchTerm.toLowerCase();
    return (
      (!searchTerm || t.title.toLowerCase().includes(q) || t.speaker.toLowerCase().includes(q) || (t.theme || '').toLowerCase().includes(q))
      && (!selectedCategory || t.category === selectedCategory)
      && (!selectedSpeaker  || t.speaker  === selectedSpeaker)
      && (!selectedTheme    || t.theme    === selectedTheme)
    );
  }), [teachings, searchTerm, selectedCategory, selectedSpeaker, selectedTheme]);

  const sortedTeachings = useMemo(() => {
    const base = showFavoritesOnly
      ? filteredTeachings.filter(t => favorites.includes(t.id))
      : filteredTeachings;
    return [...base].sort((a, b) => {
      switch (sortBy) {
        case 'date-asc': return a.date.getTime() - b.date.getTime();
        case 'title':    return a.title.localeCompare(b.title, 'fr');
        case 'speaker':  return a.speaker.localeCompare(b.speaker, 'fr');
        default:         return b.date.getTime() - a.date.getTime();
      }
    });
  }, [filteredTeachings, sortBy, showFavoritesOnly, favorites]);

  const recentlyPlayed = useMemo(() =>
    recentlyPlayedIds.map(id => teachings.find(t => t.id === id)).filter((t): t is Teaching => Boolean(t)),
    [recentlyPlayedIds, teachings],
  );

  const favTeachings = useMemo(() =>
    favorites.map(id => teachings.find(t => t.id === id)).filter((t): t is Teaching => Boolean(t)),
    [favorites, teachings],
  );

  // "Vous aimerez aussi" — same speaker or same theme, excluding current
  const suggestions = useMemo(() => {
    if (!selectedTeaching) return [];
    return teachings
      .filter(t =>
        t.id !== selectedTeaching.id &&
        (t.speaker === selectedTeaching.speaker || (t.theme && t.theme === selectedTeaching.theme))
      )
      .slice(0, 5);
  }, [selectedTeaching, teachings]);

  const shareUrl = useMemo(() => {
    if (!selectedTeaching) return window.location.href;
    const base = `${window.location.origin}${window.location.pathname}?audioId=${selectedTeaching.id}`;
    return shareTime > 5 ? `${base}&t=${Math.floor(shareTime)}` : base;
  }, [selectedTeaching, shareTime]);

  const playerHeight = isAudioPlayerVisible ? 72 : 0;

  // ── Helpers ────────────────────────────────────────────────────
  const getProgressPercent = (t: Teaching): number | undefined => {
    const pos = savedPositions[t.id];
    if (!pos || !pos.duration) return undefined;
    return (pos.time / pos.duration) * 100;
  };

  const getInitialTime = (t: Teaching): number => {
    const pos = savedPositions[t.id];
    if (!pos || !pos.time || !pos.duration) return 0;
    if (pos.time / pos.duration > 0.95) return 0; // nearly done → restart
    return pos.time;
  };

  // ── Handlers ───────────────────────────────────────────────────
  const handleTeachingSelect = (t: Teaching, startTime?: number) => {
    const initTime = startTime !== undefined ? startTime : getInitialTime(t);
    setSelectedTeaching(t);
    supabase.from('teachings').update({ plays: (t.plays || 0) + 1 }).eq('id', t.id).then(() => {});
    setAudioPlayerProps({
      url: t.fileUrl, id: t.id, title: t.title, speaker: t.speaker,
      thumbnailUrl: t.thumbnail_url, initialTime: initTime,
    });
    if (!isAudioPlayerVisible) setIsAudioPlayerVisible(true);
    else shouldContinuePlaying.current = true;
    const p = new URLSearchParams(window.location.search);
    p.set('audioId', t.id);
    window.history.pushState(null, '', `${window.location.pathname}?${p}`);
    if (isMobile) setIsSidebarOpen(false);
  };

  const handleNext = () => {
    if (queue.length > 0) {
      const next = queue[0];
      setQueue(q => q.slice(1));
      handleTeachingSelect(next);
    } else if (currentIndex < teachings.length - 1) {
      handleTeachingSelect(teachings[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) handleTeachingSelect(teachings[currentIndex - 1]);
  };

  const handleEnded = () => {
    if (queue.length > 0) {
      const next = queue[0];
      setQueue(q => q.slice(1));
      handleTeachingSelect(next);
    } else {
      setIsAudioPlayerVisible(false);
      setSelectedTeaching(null);
      setAudioPlayerProps(null);
    }
  };

  const handleOnTimeUpdate = (time: number, duration: number) => {
    if (!audioPlayerProps?.id) return;
    const id = audioPlayerProps.id;
    setSavedPositions(prev => {
      const next = { ...prev, [id]: { time, duration } };
      try { localStorage.setItem('audio_positions', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleShare = (currentTime: number) => {
    setShareTime(currentTime);
    setShowShareModal(true);
  };

  const handleFavorite = (e: React.MouseEvent, t: Teaching) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = prev.includes(t.id) ? prev.filter(id => id !== t.id) : [t.id, ...prev];
      try { localStorage.setItem('replay_favorites', JSON.stringify(next)); } catch {}
      if (!prev.includes(t.id)) toast.success('Ajouté aux favoris ❤️');
      return next;
    });
  };

  const handleAddToQueue = (e: React.MouseEvent, t: Teaching) => {
    e.stopPropagation();
    setQueue(prev => {
      if (prev.find(q => q.id === t.id)) { toast('Déjà dans la file'); return prev; }
      toast.success(`"${t.title.slice(0, 28)}…" ajouté à la file`);
      return [...prev, t];
    });
  };

  const copyToClipboard = (text = shareUrl) =>
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000); toast.success('Lien copié');
    });

  const shareOnFacebook = (url = shareUrl) =>
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');

  const shareOnWhatsApp = (url = shareUrl) =>
    window.open(`https://wa.me/?text=${encodeURIComponent("Écoutez cet audio :")}%20${encodeURIComponent(url)}`, '_blank');

  const resetFilters = () => {
    setSelectedCategory(''); setSelectedSpeaker(''); setSelectedTheme('');
    setSearchTerm(''); setShowFavoritesOnly(false); setVisibleCount(ITEMS_STEP);
  };

  // ── Sidebar content ────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-y-auto" style={{ color: th.textBody }}>
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 flex items-center gap-3 flex-shrink-0"
           style={{ borderBottom: `1px solid ${th.sidebarBorder}` }}>
        <Logo className="h-9 w-auto" />
        <div>
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: th.accent }}>Replay</p>
          <p className="text-xs" style={{ color: th.textMuted }}>Audios</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: th.textMuted }} />
          <input type="text" placeholder="Rechercher..." value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setVisibleCount(ITEMS_STEP); }}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border-none outline-none"
            style={{ background: th.inputBg, color: th.inputText }} />
          {searchTerm && (
            <button className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: th.textMuted }}
                    onClick={() => setSearchTerm('')}><X className="w-3 h-3" /></button>
          )}
        </div>
      </div>

      <div className="px-4 space-y-5 flex-1 overflow-y-auto pb-6">

        {/* Favoris shortcut */}
        <button
          onClick={() => { setShowFavoritesOnly(f => !f); setVisibleCount(ITEMS_STEP); }}
          className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors"
          style={{
            background: showFavoritesOnly ? th.favBg : 'transparent',
            color: showFavoritesOnly ? th.favText : th.navText,
            fontWeight: showFavoritesOnly ? 600 : 400,
          }}>
          <Heart className="w-3.5 h-3.5" fill={showFavoritesOnly ? 'currentColor' : 'none'} />
          Mes favoris
          {favTeachings.length > 0 && (
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: th.favBg, color: th.favText }}>
              {favTeachings.length}
            </span>
          )}
        </button>

        {/* Catégories */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: th.sectionLabel }}>Catégories</p>
          <ul className="space-y-0.5">
            {['', ...categories].map(cat => (
              <li key={cat || '__all__'}>
                <button onClick={() => { setSelectedCategory(cat); setVisibleCount(ITEMS_STEP); }}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors"
                  style={{
                    background: selectedCategory === cat ? th.navActiveBg : 'transparent',
                    color:      selectedCategory === cat ? th.navActiveText : th.navText,
                    fontWeight: selectedCategory === cat ? 600 : 400,
                  }}>
                  {cat || 'Toutes les catégories'}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Thématiques / Séries */}
        {themes.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1" style={{ color: th.sectionLabel }}>
              <Layers className="w-3 h-3" /> Thématiques
            </p>
            <ul className="space-y-0.5">
              {['', ...themes].map(theme => (
                <li key={theme || '__all_themes__'}>
                  <button onClick={() => { setSelectedTheme(theme); setVisibleCount(ITEMS_STEP); }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors"
                    style={{
                      background: selectedTheme === theme ? th.navActiveBg : 'transparent',
                      color:      selectedTheme === theme ? th.navActiveText : th.navText,
                      fontWeight: selectedTheme === theme ? 600 : 400,
                    }}>
                    {theme || 'Toutes les thématiques'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Orateurs */}
        {speakers.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: th.sectionLabel }}>Orateurs</p>
            <ul className="space-y-0.5">
              {['', ...speakers].map(spk => (
                <li key={spk || '__all_spk__'}>
                  <button onClick={() => { setSelectedSpeaker(spk); setVisibleCount(ITEMS_STEP); }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors"
                    style={{
                      background: selectedSpeaker === spk ? th.navActiveBg : 'transparent',
                      color:      selectedSpeaker === spk ? th.navActiveText : th.navText,
                      fontWeight: selectedSpeaker === spk ? 600 : 400,
                    }}>
                    {spk || 'Tous les orateurs'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Période */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: th.sectionLabel }}>Période</p>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>

        {/* Reset */}
        {(selectedCategory || selectedSpeaker || selectedTheme || searchTerm || showFavoritesOnly) && (
          <button onClick={resetFilters} className="w-full text-xs py-2 rounded-lg"
                  style={{ background: th.resetBg, color: th.resetText }}>
            Réinitialiser les filtres
          </button>
        )}

        {/* Vous aimerez aussi */}
        {suggestions.length > 0 && selectedTeaching && (
          <div style={{ borderTop: `1px solid ${th.sidebarBorder}`, paddingTop: '1.25rem' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: th.sectionLabel }}>
              Vous aimerez aussi
            </p>
            <ul className="space-y-1">
              {suggestions.map(s => {
                const av = getSpeakerAvatar(s.speaker);
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => handleTeachingSelect(s)}
                      className="w-full text-left flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors"
                      style={{ color: th.textBody }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = th.navActiveBg; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                      <div className="w-9 h-9 rounded-md flex-shrink-0 overflow-hidden">
                        {s.thumbnail_url
                          ? <img src={s.thumbnail_url} alt={s.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white"
                                 style={{ background: av.gradient }}>
                              {av.initials}
                            </div>}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: th.textBody }}>{s.title}</p>
                        <p className="text-[10px] truncate" style={{ color: th.textMuted }}>{s.speaker}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );

  // ── Loading ────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: th.pageBg }}>
      <div className="text-center">
        <Headphones className="w-12 h-12 mx-auto mb-4 animate-pulse" style={{ color: th.accent }} />
        <p className="text-sm" style={{ color: th.textMuted }}>Chargement des enseignements...</p>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="flex" style={{ background: th.pageBg, minHeight: '100vh' }}>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col flex-shrink-0 sticky top-0 h-screen overflow-hidden"
             style={{ width: 240, background: th.sidebarBg, borderRight: `1px solid ${th.sidebarBorder}` }}>
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {isMobile && isSidebarOpen && (
        <>
          <div className="fixed inset-0 z-40" style={{ background: th.overlayBg }}
               onClick={() => setIsSidebarOpen(false)} />
          <aside className="fixed top-0 left-0 h-full z-50 overflow-hidden flex flex-col"
                 style={{ width: 280, background: th.drawerBg }}>
            <div className="flex justify-end px-4 pt-4">
              <button onClick={() => setIsSidebarOpen(false)} style={{ color: th.textMuted }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Queue Panel */}
      {showQueue && (
        <>
          <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)' }}
               onClick={() => setShowQueue(false)} />
          <div className="fixed right-0 top-0 bottom-0 z-50 flex flex-col shadow-2xl"
               style={{ width: isMobile ? '100%' : 360, background: th.modalBg, borderLeft: `1px solid ${th.sidebarBorder}` }}>
            <div className="flex items-center justify-between px-5 py-4"
                 style={{ borderBottom: `1px solid ${th.sidebarBorder}` }}>
              <div className="flex items-center gap-2">
                <ListMusic className="w-5 h-5" style={{ color: th.accent }} />
                <h3 className="font-semibold text-sm" style={{ color: th.textH }}>File de lecture</h3>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: th.badgeBg, color: th.badgeText }}>
                  {queue.length}
                </span>
              </div>
              <button onClick={() => setShowQueue(false)} style={{ color: th.textMuted }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {queue.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6" style={{ color: th.textMuted }}>
                <ListMusic className="w-12 h-12 opacity-20" />
                <p className="text-sm text-center">File vide — ajoutez des audios avec le bouton <strong>+</strong></p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {queue.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3"
                       style={{ borderBottom: `1px solid ${th.sidebarBorder}` }}>
                    <span className="text-xs w-5 flex-shrink-0 text-center" style={{ color: th.textMuted }}>{i + 1}</span>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { handleTeachingSelect(t); setShowQueue(false); }}>
                      <p className="text-sm font-medium truncate" style={{ color: th.textH }}>{t.title}</p>
                      <p className="text-xs truncate" style={{ color: th.textMuted }}>{t.speaker}</p>
                    </div>
                    <button onClick={() => setQueue(q => q.filter(qt => qt.id !== t.id))}
                            className="flex-shrink-0 p-1.5 rounded-full hover:opacity-70"
                            style={{ color: th.textMuted }}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {queue.length > 0 && (
              <div className="px-5 py-4" style={{ borderTop: `1px solid ${th.sidebarBorder}` }}>
                <button onClick={() => setQueue([])} className="w-full py-2 text-sm rounded-lg"
                        style={{ background: th.resetBg, color: th.resetText }}>
                  Vider la file
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Main */}
      <div ref={mainRef} className="flex-1 overflow-y-auto"
           style={{ height: '100vh', paddingBottom: playerHeight + 16 }}>

        {/* Top bar */}
        <div className="sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 py-3"
             style={{ background: th.topbarBg, borderBottom: `1px solid ${th.topbarBorder}`, backdropFilter: 'blur(12px)' }}>
          <button className="lg:hidden p-1.5 rounded-lg" style={{ color: th.textMuted }}
                  onClick={() => setIsSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop search */}
          <div className="relative flex-1 max-w-md hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: th.textMuted }} />
            <input type="text" placeholder="Titres, orateurs, thèmes..." value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setVisibleCount(ITEMS_STEP); }}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border-none outline-none"
              style={{ background: th.inputBg, color: th.inputText }} />
            {searchTerm && (
              <button className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: th.textMuted }}
                      onClick={() => setSearchTerm('')}><X className="w-3.5 h-3.5" /></button>
            )}
          </div>

          {/* Mobile title */}
          <div className="lg:hidden flex items-center gap-2 flex-1">
            <Headphones className="w-5 h-5" style={{ color: th.accent }} />
            <span className="font-semibold text-sm" style={{ color: th.textH }}>Replay Audios</span>
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <button onClick={toggleTheme} className="p-2 rounded-full transition-colors"
                    style={{ background: th.toggleBg, color: th.toggleText }}
                    title={isDark ? 'Mode clair' : 'Mode sombre'}>
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={() => { setShareTime(0); setShowShareModal(true); }} className="p-2 rounded-full"
                    style={{ color: th.textMuted }}><Share2 className="w-4 h-4" /></button>
            <button onClick={() => setShowInfoModal(true)} className="p-2 rounded-full"
                    style={{ color: th.textMuted }}><Info className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="lg:hidden px-4 pt-3 pb-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: th.textMuted }} />
            <input type="text" placeholder="Rechercher..." value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setVisibleCount(ITEMS_STEP); }}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border-none outline-none"
              style={{ background: th.inputBg, color: th.inputText }} />
          </div>
        </div>

        {/* Mobile category chips */}
        {isMobile && categories.length > 0 && (
          <div className="px-4 pt-3 pb-1 flex gap-2 overflow-x-auto scrollbar-hide">
            {['', ...categories].map(cat => (
              <button key={cat || '__all__'}
                onClick={() => { setSelectedCategory(cat); setVisibleCount(ITEMS_STEP); }}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={{
                  background: selectedCategory === cat ? th.chipActive : th.chipBg,
                  color:      selectedCategory === cat ? th.chipActiveText : th.chipText,
                }}>
                {cat || 'Tout'}
              </button>
            ))}
          </div>
        )}

        <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-10">

          {/* À la une */}
          {featuredTeachings.length > 0 && !searchTerm && !selectedCategory && !selectedSpeaker && !selectedTheme && !showFavoritesOnly && (
            <section>
              <div className="flex items-center gap-2 mb-5">
                <Star className="w-5 h-5" style={{ color: th.gold }} />
                <h2 className="text-lg font-bold" style={{ color: th.textH }}>À la une</h2>
                <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: th.badgeBg, color: th.badgeText }}>
                  {featuredTeachings.length} nouveau{featuredTeachings.length > 1 ? 'x' : ''}
                </span>
              </div>
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))' }}>
                {featuredTeachings.slice(0, 6).map(t => (
                  <SpotifyCard key={t.id} isDark={isDark}
                    title={t.title} speaker={t.speaker} duration={t.duration}
                    category={t.category} theme={t.theme}
                    thumbnail_url={t.thumbnail_url} plays={t.plays}
                    isSelected={selectedTeaching?.id === t.id}
                    isPlaying={selectedTeaching?.id === t.id && isAudioPlayerVisible}
                    progressPercent={getProgressPercent(t)}
                    isFavorite={favorites.includes(t.id)}
                    onClick={() => handleTeachingSelect(t)}
                    onFavorite={e => handleFavorite(e, t)}
                    onAddToQueue={e => handleAddToQueue(e, t)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Favoris section */}
          {showFavoritesOnly && (
            <section>
              <div className="flex items-center gap-2 mb-5">
                <Heart className="w-5 h-5" style={{ color: th.favText }} fill="currentColor" />
                <h2 className="text-lg font-bold" style={{ color: th.textH }}>Mes favoris</h2>
                <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: th.favBg, color: th.favText }}>{favTeachings.length}</span>
              </div>
              {favTeachings.length === 0 ? (
                <p className="text-sm py-10 text-center" style={{ color: th.textMuted }}>
                  Aucun favori — cliquez sur le ❤ sur une carte pour en ajouter.
                </p>
              ) : null}
            </section>
          )}

          {/* Récemment écoutés */}
          {recentlyPlayed.length > 0 && !searchTerm && !showFavoritesOnly && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4" style={{ color: th.textMuted }} />
                <h2 className="text-base font-bold" style={{ color: th.textH }}>Récemment écoutés</h2>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {recentlyPlayed.map(t => (
                  <div key={t.id} className="flex-shrink-0" style={{ width: 148 }}>
                    <SpotifyCard isDark={isDark}
                      title={t.title} speaker={t.speaker} duration={t.duration}
                      category={t.category} thumbnail_url={t.thumbnail_url}
                      isSelected={selectedTeaching?.id === t.id}
                      isPlaying={selectedTeaching?.id === t.id && isAudioPlayerVisible}
                      progressPercent={getProgressPercent(t)}
                      isFavorite={favorites.includes(t.id)}
                      onClick={() => handleTeachingSelect(t)}
                      onFavorite={e => handleFavorite(e, t)}
                      onAddToQueue={e => handleAddToQueue(e, t)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tous les audios */}
          <section>
            <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold" style={{ color: th.textH }}>
                  {showFavoritesOnly ? 'Mes favoris'
                    : (searchTerm || selectedCategory || selectedSpeaker || selectedTheme)
                      ? 'Résultats'
                      : 'Tous les audios'}
                </h2>
                <span className="text-xs" style={{ color: th.textMuted }}>
                  {sortedTeachings.length} audio{sortedTeachings.length > 1 ? 's' : ''}
                </span>
              </div>
              {/* Sort selector */}
              <select value={sortBy} onChange={e => { setSortBy(e.target.value as SortKey); setVisibleCount(ITEMS_STEP); }}
                className="text-xs rounded-lg px-3 py-1.5 border-none outline-none cursor-pointer"
                style={{ background: th.inputBg, color: th.inputText }}>
                <option value="date-desc">Plus récents</option>
                <option value="date-asc">Plus anciens</option>
                <option value="title">Titre A→Z</option>
                <option value="speaker">Orateur A→Z</option>
              </select>
            </div>

            {sortedTeachings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Headphones className="w-14 h-14 opacity-20" style={{ color: th.textMuted }} />
                <p className="text-sm" style={{ color: th.textMuted }}>Aucun audio trouvé</p>
                {(searchTerm || selectedCategory || selectedSpeaker || selectedTheme) && (
                  <button onClick={resetFilters} className="text-xs px-4 py-2 rounded-full"
                          style={{ background: th.accentBg, color: th.accent }}>
                    Effacer les filtres
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))' }}>
                  {sortedTeachings.slice(0, visibleCount).map(t => (
                    <SpotifyCard key={t.id} isDark={isDark}
                      title={t.title} speaker={t.speaker} duration={t.duration}
                      category={t.category} theme={t.theme}
                      thumbnail_url={t.thumbnail_url} plays={t.plays}
                      isSelected={selectedTeaching?.id === t.id}
                      isPlaying={selectedTeaching?.id === t.id && isAudioPlayerVisible}
                      progressPercent={getProgressPercent(t)}
                      isFavorite={favorites.includes(t.id)}
                      onClick={() => handleTeachingSelect(t)}
                      onFavorite={e => handleFavorite(e, t)}
                      onAddToQueue={e => handleAddToQueue(e, t)}
                    />
                  ))}
                </div>
                {visibleCount < sortedTeachings.length && (
                  <div className="flex justify-center mt-8">
                    <button onClick={() => setVisibleCount(c => c + ITEMS_STEP)}
                      className="px-6 py-2.5 rounded-full text-sm font-medium transition-colors"
                      style={{ background: th.loadMoreBg, color: th.loadMoreText, border: `1px solid ${th.loadMoreBorder}` }}>
                      Voir plus ({sortedTeachings.length - visibleCount} restants)
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {/* Player */}
      {isAudioPlayerVisible && audioPlayerProps && (
        <AudioPlayer
          url={audioPlayerProps.url} id={audioPlayerProps.id}
          title={audioPlayerProps.title} speaker={audioPlayerProps.speaker}
          thumbnailUrl={audioPlayerProps.thumbnailUrl}
          initialTime={audioPlayerProps.initialTime}
          onClose={() => { setIsAudioPlayerVisible(false); setSelectedTeaching(null); setAudioPlayerProps(null); }}
          onNext={handleNext}
          onPrevious={currentIndex > 0 ? handlePrevious : undefined}
          onEnded={handleEnded}
          onShare={handleShare}
          onTimeUpdate={handleOnTimeUpdate}
          onQueueOpen={() => setShowQueue(true)}
          queueCount={queue.length}
          initialPlayState={shouldContinuePlaying.current}
        />
      )}

      {/* Share modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: th.overlayBg }}>
          <div className="rounded-2xl shadow-2xl w-full max-w-sm p-6"
               style={{ background: th.modalBg }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold" style={{ color: th.textH }}>Partager</h3>
                {shareTime > 5 && (
                  <p className="text-xs mt-0.5" style={{ color: th.textMuted }}>
                    Lien avec position : {Math.floor(shareTime / 60)}:{String(Math.floor(shareTime % 60)).padStart(2, '0')}
                  </p>
                )}
              </div>
              <button onClick={() => setShowShareModal(false)} style={{ color: th.textMuted }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative mb-5">
              <input readOnly value={shareUrl}
                className="w-full pr-10 pl-3 py-2 text-xs rounded-lg outline-none border"
                style={{ background: th.inputBg, color: th.textBody, borderColor: th.loadMoreBorder }} />
              <button className="absolute right-2 top-1/2 -translate-y-1/2"
                      style={{ color: copied ? '#22c55e' : th.textMuted }}
                      onClick={() => copyToClipboard()}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {shareTime > 5 && selectedTeaching && (
              <div className="flex gap-2 mb-4">
                <button onClick={() => setShareTime(0)}
                  className="flex-1 text-xs py-1.5 rounded-lg border"
                  style={{ color: th.textMuted, borderColor: th.loadMoreBorder, background: 'transparent' }}>
                  Depuis le début
                </button>
                <button className="flex-1 text-xs py-1.5 rounded-lg"
                  style={{ background: th.accentBg, color: th.accent }}>
                  Depuis {Math.floor(shareTime / 60)}:{String(Math.floor(shareTime % 60)).padStart(2, '0')} ✓
                </button>
              </div>
            )}
            <div className="flex justify-center gap-4">
              <button onClick={() => shareOnFacebook()}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: '#1877f2' }}>
                <Facebook className="w-5 h-5 text-white" />
              </button>
              <button onClick={() => shareOnWhatsApp()}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: '#25d366' }}>
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: th.overlayBg }}>
          <div className="rounded-2xl shadow-2xl w-full max-w-sm p-6" style={{ background: th.modalBg }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: th.textH }}>À propos de Replay Audio</h3>
              <button onClick={() => setShowInfoModal(false)} style={{ color: th.textMuted }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm" style={{ color: th.textBody }}>
              <p>Retrouvez tous les moments forts de la cellule : prédications, adorations, et plus encore.</p>
              <p>Filtrez, ajoutez aux favoris, composez votre file de lecture et reprenez là où vous vous étiez arrêté.</p>
            </div>
            <button onClick={() => setShowInfoModal(false)}
              className="w-full mt-5 py-2 rounded-xl text-sm font-medium"
              style={{ background: th.accent, color: '#ffffff' }}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
