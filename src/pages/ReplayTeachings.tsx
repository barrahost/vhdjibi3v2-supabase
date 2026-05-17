import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useSearchParams } from 'react-router-dom';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { formatDateForInput, isWithinLast7Days } from '../utils/dateUtils';
import { formatDuration } from '../utils/dateUtils';
import { AudioPlayer } from '../components/audio/AudioPlayer';
import { DateRangePicker, DateRange } from '../components/ui/DateRangePicker';
import { SpotifyCard } from '../components/audio/SpotifyCard';
import { Logo } from '../components/ui/Logo';
import toast from 'react-hot-toast';
import {
  Search, X, Share2, Info, Headphones, Menu,
  Facebook, Copy, Check, Star, Clock, ChevronLeft, ChevronRight,
} from 'lucide-react';

const getOneMonthAgoDate = (): string => {
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

const ITEMS_STEP = 24;

export default function ReplayTeachings() {
  const [searchParams] = useSearchParams();
  const [teachings, setTeachings] = useState<Teaching[]>([]);
  const [featuredTeachings, setFeaturedTeachings] = useState<Teaching[]>([]);
  const [selectedTeaching, setSelectedTeaching] = useState<Teaching | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: getOneMonthAgoDate(), endDate: formatDateForInput(new Date()) });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(ITEMS_STEP);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isAudioPlayerVisible, setIsAudioPlayerVisible] = useState(false);
  const [recentlyPlayedIds, setRecentlyPlayedIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('recently_played') || '[]'); } catch { return []; }
  });
  const [audioPlayerProps, setAudioPlayerProps] = useState<{
    url: string; id: string; title: string; speaker: string; thumbnailUrl?: string;
  } | null>(null);
  const shouldContinuePlaying = useRef(false);
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const mainRef = useRef<HTMLDivElement>(null);

  // ── Fetch ─────────────────────────────────────────────────────
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

  // Sync recently played
  useEffect(() => {
    const sync = () => {
      try { setRecentlyPlayedIds(JSON.parse(localStorage.getItem('recently_played') || '[]')); } catch {}
    };
    window.addEventListener('recently_played:updated', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('recently_played:updated', sync); window.removeEventListener('storage', sync); };
  }, []);

  // URL audioId
  useEffect(() => {
    const audioId = searchParams.get('audioId');
    if (audioId && teachings.length > 0 && !selectedTeaching) {
      const t = teachings.find(t => t.id === audioId);
      if (t) handleTeachingSelect(t);
    }
  }, [teachings, searchParams]);

  // currentIndex
  useEffect(() => {
    if (selectedTeaching) setCurrentIndex(teachings.findIndex(t => t.id === selectedTeaching.id));
    else setCurrentIndex(-1);
  }, [selectedTeaching, teachings]);

  // ── Handlers ─────────────────────────────────────────────────
  const handleTeachingSelect = (t: Teaching) => {
    setSelectedTeaching(t);
    supabase.from('teachings').update({ plays: (t.plays || 0) + 1 }).eq('id', t.id).then(() => {});
    setAudioPlayerProps({ url: t.fileUrl, id: t.id, title: t.title, speaker: t.speaker, thumbnailUrl: t.thumbnail_url });
    if (!isAudioPlayerVisible) setIsAudioPlayerVisible(true);
    else shouldContinuePlaying.current = true;
    const p = new URLSearchParams(window.location.search); p.set('audioId', t.id);
    window.history.pushState(null, '', window.location.pathname + '?' + p.toString());
    if (isMobile) setIsSidebarOpen(false);
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = () => { if (currentIndex < teachings.length - 1) handleTeachingSelect(teachings[currentIndex + 1]); };
  const handlePrevious = () => { if (currentIndex > 0) handleTeachingSelect(teachings[currentIndex - 1]); };

  const copyToClipboard = (text = window.location.href) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); toast.success('Lien copié'); });
  };
  const shareOnFacebook = (url = window.location.href) => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  const shareOnWhatsApp = (url = window.location.href, text = "Écoutez les audios de l'assemblée") =>
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}%20${encodeURIComponent(url)}`, '_blank');

  // ── Derived ───────────────────────────────────────────────────
  const categories = [...new Set(teachings.map(t => t.category).filter(Boolean))];
  const speakers   = [...new Set(teachings.map(t => t.speaker).filter(Boolean))];
  const filteredTeachings = teachings.filter(t => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !searchTerm || t.title.toLowerCase().includes(q) || t.speaker.toLowerCase().includes(q) || (t.theme || '').toLowerCase().includes(q);
    const matchCat = !selectedCategory || t.category === selectedCategory;
    const matchSpk = !selectedSpeaker || t.speaker === selectedSpeaker;
    return matchSearch && matchCat && matchSpk;
  });
  const recentlyPlayed = recentlyPlayedIds.map(id => teachings.find(t => t.id === id)).filter((t): t is Teaching => Boolean(t));
  const playerHeight = isAudioPlayerVisible ? 72 : 0;
  const shareUrl = selectedTeaching
    ? `${window.location.origin}${window.location.pathname}?audioId=${selectedTeaching.id}`
    : window.location.href;

  // ── Sidebar content ───────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-y-auto" style={{ color: '#cbd5e1' }}>
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 flex items-center gap-3 flex-shrink-0">
        <Logo className="h-9 w-auto" />
        <div>
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: '#F2B636' }}>Replay</p>
          <p className="text-xs" style={{ color: '#64748b' }}>Audios</p>
        </div>
      </div>

      {/* Search (sidebar) — hidden when top search bar visible on desktop */}
      <div className="px-4 pb-4 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#64748b' }} />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setVisibleCount(ITEMS_STEP); }}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border-none outline-none"
            style={{ background: '#1e293b', color: '#e2e8f0' }}
          />
        </div>
      </div>

      <div className="px-4 space-y-6 flex-1 overflow-y-auto pb-6">
        {/* Catégories */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>Catégories</p>
          <ul className="space-y-0.5">
            {['', ...categories].map(cat => (
              <li key={cat || '__all__'}>
                <button
                  onClick={() => { setSelectedCategory(cat); setVisibleCount(ITEMS_STEP); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs transition-colors"
                  style={{
                    background: selectedCategory === cat ? 'rgba(242,182,54,0.12)' : 'transparent',
                    color: selectedCategory === cat ? '#F2B636' : '#94a3b8',
                    fontWeight: selectedCategory === cat ? 600 : 400,
                  }}
                >
                  {cat || 'Toutes les catégories'}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Orateurs */}
        {speakers.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>Orateurs</p>
            <ul className="space-y-0.5">
              {['', ...speakers].map(spk => (
                <li key={spk || '__all__'}>
                  <button
                    onClick={() => { setSelectedSpeaker(spk); setVisibleCount(ITEMS_STEP); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs transition-colors"
                    style={{
                      background: selectedSpeaker === spk ? 'rgba(242,182,54,0.12)' : 'transparent',
                      color: selectedSpeaker === spk ? '#F2B636' : '#94a3b8',
                      fontWeight: selectedSpeaker === spk ? 600 : 400,
                    }}
                  >
                    {spk || 'Tous les orateurs'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Période */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>Période</p>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>

        {/* Reset */}
        {(selectedCategory || selectedSpeaker || searchTerm) && (
          <button
            onClick={() => { setSelectedCategory(''); setSelectedSpeaker(''); setSearchTerm(''); setVisibleCount(ITEMS_STEP); }}
            className="w-full text-xs py-2 rounded-lg transition-colors"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>
    </div>
  );

  // ── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#0f172a' }}>
        <div className="text-center">
          <Headphones className="w-12 h-12 mx-auto mb-4 animate-pulse" style={{ color: '#F2B636' }} />
          <p className="text-sm" style={{ color: '#64748b' }}>Chargement des enseignements...</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="flex" style={{ background: '#0f172a', minHeight: '100vh' }}>

      {/* ── Desktop Sidebar (≥1024px) ── */}
      <aside
        className="hidden lg:flex lg:flex-col flex-shrink-0 sticky top-0 h-screen overflow-hidden"
        style={{ width: 240, background: '#0a0f1a', borderRight: '1px solid rgba(255,255,255,0.04)' }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar Drawer ── */}
      {isMobile && isSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => setIsSidebarOpen(false)}
          />
          <aside
            className="fixed top-0 left-0 h-full z-50 overflow-hidden flex flex-col"
            style={{ width: 280, background: '#0a0f1a' }}
          >
            <div className="flex justify-end px-4 pt-4">
              <button onClick={() => setIsSidebarOpen(false)} style={{ color: '#64748b' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </>
      )}

      {/* ── Main content ── */}
      <div
        ref={mainRef}
        className="flex-1 overflow-y-auto"
        style={{ height: '100vh', paddingBottom: playerHeight + 16 }}
      >
        {/* Top bar */}
        <div
          className="sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 py-3"
          style={{ background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        >
          {/* Hamburger (mobile) */}
          <button
            className="lg:hidden p-1.5 rounded-lg"
            style={{ color: '#94a3b8' }}
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search (top bar — desktop) */}
          <div className="relative flex-1 max-w-md hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#475569' }} />
            <input
              type="text"
              placeholder="Titres, orateurs, thèmes..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setVisibleCount(ITEMS_STEP); }}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border-none outline-none"
              style={{ background: '#1e293b', color: '#e2e8f0' }}
            />
            {searchTerm && (
              <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setSearchTerm('')} style={{ color: '#64748b' }}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mobile title */}
          <div className="lg:hidden flex items-center gap-2 flex-1">
            <Headphones className="w-5 h-5" style={{ color: '#F2B636' }} />
            <span className="font-semibold text-sm" style={{ color: '#f1f5f9' }}>Replay Audios</span>
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => setShowShareModal(true)}
              className="p-2 rounded-full transition-colors"
              style={{ color: '#64748b' }}
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowInfoModal(true)}
              className="p-2 rounded-full transition-colors"
              style={{ color: '#64748b' }}
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="lg:hidden px-4 pt-3 pb-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#475569' }} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setVisibleCount(ITEMS_STEP); }}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border-none outline-none"
              style={{ background: '#1e293b', color: '#e2e8f0' }}
            />
          </div>
        </div>

        {/* Mobile category chips */}
        {isMobile && categories.length > 0 && (
          <div className="px-4 pt-3 pb-1 flex gap-2 overflow-x-auto scrollbar-hide">
            {['', ...categories].map(cat => (
              <button
                key={cat || '__all__'}
                onClick={() => { setSelectedCategory(cat); setVisibleCount(ITEMS_STEP); }}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={{
                  background: selectedCategory === cat ? '#F2B636' : '#1e293b',
                  color: selectedCategory === cat ? '#111827' : '#94a3b8',
                }}
              >
                {cat || 'Tout'}
              </button>
            ))}
          </div>
        )}

        <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-10">

          {/* ── À la une ── */}
          {featuredTeachings.length > 0 && !searchTerm && !selectedCategory && !selectedSpeaker && (
            <section>
              <div className="flex items-center gap-2 mb-5">
                <Star className="w-5 h-5" style={{ color: '#F2B636' }} />
                <h2 className="text-lg font-bold" style={{ color: '#f1f5f9' }}>À la une</h2>
                <span className="text-xs px-2 py-0.5 rounded-full ml-1" style={{ background: 'rgba(242,182,54,0.12)', color: '#F2B636' }}>
                  {featuredTeachings.length} nouveaux
                </span>
              </div>
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                {featuredTeachings.slice(0, 6).map(t => (
                  <SpotifyCard
                    key={t.id}
                    title={t.title}
                    speaker={t.speaker}
                    duration={t.duration}
                    category={t.category}
                    theme={t.theme}
                    thumbnail_url={t.thumbnail_url}
                    plays={t.plays}
                    isSelected={selectedTeaching?.id === t.id}
                    isPlaying={selectedTeaching?.id === t.id && isAudioPlayerVisible}
                    onClick={() => handleTeachingSelect(t)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Récemment écoutés ── */}
          {recentlyPlayed.length > 0 && !searchTerm && (
            <section>
              <div className="flex items-center gap-2 mb-5">
                <Clock className="w-4 h-4" style={{ color: '#64748b' }} />
                <h2 className="text-base font-bold" style={{ color: '#f1f5f9' }}>Récemment écoutés</h2>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                {recentlyPlayed.map(t => (
                  <div key={t.id} className="flex-shrink-0" style={{ width: 140 }}>
                    <SpotifyCard
                      title={t.title}
                      speaker={t.speaker}
                      duration={t.duration}
                      category={t.category}
                      thumbnail_url={t.thumbnail_url}
                      isSelected={selectedTeaching?.id === t.id}
                      isPlaying={selectedTeaching?.id === t.id && isAudioPlayerVisible}
                      onClick={() => handleTeachingSelect(t)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Tous les audios ── */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold" style={{ color: '#f1f5f9' }}>
                {searchTerm || selectedCategory || selectedSpeaker ? 'Résultats' : 'Tous les audios'}
              </h2>
              <span className="text-xs" style={{ color: '#475569' }}>
                {filteredTeachings.length} audio{filteredTeachings.length > 1 ? 's' : ''}
              </span>
            </div>

            {filteredTeachings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Headphones className="w-14 h-14 opacity-20" style={{ color: '#94a3b8' }} />
                <p className="text-sm" style={{ color: '#475569' }}>Aucun audio trouvé</p>
                {(searchTerm || selectedCategory || selectedSpeaker) && (
                  <button
                    onClick={() => { setSearchTerm(''); setSelectedCategory(''); setSelectedSpeaker(''); }}
                    className="text-xs px-4 py-2 rounded-full"
                    style={{ background: 'rgba(242,182,54,0.12)', color: '#F2B636' }}
                  >
                    Effacer les filtres
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                  {filteredTeachings.slice(0, visibleCount).map(t => (
                    <SpotifyCard
                      key={t.id}
                      title={t.title}
                      speaker={t.speaker}
                      duration={t.duration}
                      category={t.category}
                      theme={t.theme}
                      thumbnail_url={t.thumbnail_url}
                      plays={t.plays}
                      isSelected={selectedTeaching?.id === t.id}
                      isPlaying={selectedTeaching?.id === t.id && isAudioPlayerVisible}
                      onClick={() => handleTeachingSelect(t)}
                    />
                  ))}
                </div>

                {visibleCount < filteredTeachings.length && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={() => setVisibleCount(c => c + ITEMS_STEP)}
                      className="px-6 py-2.5 rounded-full text-sm font-medium transition-colors"
                      style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      Voir plus ({filteredTeachings.length - visibleCount} restants)
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

        </div>
      </div>

      {/* ── Player ── */}
      {isAudioPlayerVisible && audioPlayerProps && (
        <AudioPlayer
          url={audioPlayerProps.url}
          id={audioPlayerProps.id}
          title={audioPlayerProps.title}
          speaker={audioPlayerProps.speaker}
          thumbnailUrl={audioPlayerProps.thumbnailUrl}
          onClose={() => { setIsAudioPlayerVisible(false); setSelectedTeaching(null); setAudioPlayerProps(null); }}
          onNext={currentIndex < teachings.length - 1 ? handleNext : undefined}
          onPrevious={currentIndex > 0 ? handlePrevious : undefined}
          onEnded={() => { setIsAudioPlayerVisible(false); setSelectedTeaching(null); setAudioPlayerProps(null); }}
          onShare={() => setShowShareModal(true)}
          initialPlayState={shouldContinuePlaying.current}
        />
      )}

      {/* ── Share modal ── */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-2xl shadow-2xl w-full max-w-sm p-6" style={{ background: '#1e293b' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold" style={{ color: '#f1f5f9' }}>Partager</h3>
              <button onClick={() => setShowShareModal(false)} style={{ color: '#64748b' }}><X className="w-5 h-5" /></button>
            </div>
            <div className="relative mb-5">
              <input
                readOnly
                value={shareUrl}
                className="w-full pr-10 pl-3 py-2 text-xs rounded-lg border-none outline-none"
                style={{ background: '#0f172a', color: '#94a3b8' }}
              />
              <button
                onClick={() => copyToClipboard(shareUrl)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                style={{ color: copied ? '#22c55e' : '#64748b' }}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex justify-center gap-4">
              <button onClick={() => shareOnFacebook(shareUrl)}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: '#1877f2' }}>
                <Facebook className="w-5 h-5 text-white" />
              </button>
              <button onClick={() => shareOnWhatsApp(shareUrl)}
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

      {/* ── Info modal ── */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-2xl shadow-2xl w-full max-w-sm p-6" style={{ background: '#1e293b' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: '#f1f5f9' }}>À propos de Replay Audio</h3>
              <button onClick={() => setShowInfoModal(false)} style={{ color: '#64748b' }}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-sm" style={{ color: '#94a3b8' }}>
              <p>Retrouvez tous les moments forts de la cellule : adoration, louange, prédication, sainte cène et plus encore.</p>
              <p>Filtrez par catégorie, orateur ou période. Partagez avec vos proches.</p>
            </div>
            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full mt-5 py-2 rounded-xl text-sm font-medium"
              style={{ background: '#F2B636', color: '#111827' }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
