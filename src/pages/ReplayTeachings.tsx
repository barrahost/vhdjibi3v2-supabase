import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { TeachingHeader } from '../components/audio/TeachingHeader';
import { TeachingList } from '../components/audio/TeachingList';
import { Play, Calendar, Share2, Copy, Check, Facebook, Headphones, Info, X, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateForInput, isWithinLast7Days } from '../utils/dateUtils';
import { Footer } from '../components/ui/Footer';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { AudioPlayer } from '../components/audio/AudioPlayer';
import toast from 'react-hot-toast';
import { TeachingDetails } from '../components/audio/TeachingDetails';
import { RecentlyPlayedBar } from '../components/audio/RecentlyPlayedBar';

// Helper function to get date from one month ago
const getOneMonthAgoDate = (): string => {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return formatDateForInput(date);
};

interface Teaching {
  id: string;
  title: string;
  description: string;
  speaker: string;
  category: string;
  tags: string[];
  date: Date;
  duration: number;
  fileUrl: string;
  thumbnail_url?: string;
  featured?: boolean;
  file_url?: string;
  createdAt?: Date;
  updatedAt?: Date;
  theme?: string;
  plays?: number;
}

export default function ReplayTeachings() {
  const [teachings, setTeachings] = useState<Teaching[]>([]);
  const [featuredTeachings, setFeaturedTeachings] = useState<Teaching[]>([]);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [selectedTeaching, setSelectedTeaching] = useState<Teaching | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState<string>(getOneMonthAgoDate());
  const [endDate, setEndDate] = useState<string>(formatDateForInput(new Date()));
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const featuredSliderRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const ITEMS_PER_PAGE = 12;

  // Audio Player state
  const [isAudioPlayerVisible, setIsAudioPlayerVisible] = useState(false);
  const [audioPlayerProps, setAudioPlayerProps] = useState<{
    url: string;
    id: string;
    title: string;
    speaker: string;
    thumbnailUrl?: string;
  } | null>(null);
  const shouldContinuePlaying = useRef(false);

  // Auto-scroll for featured items
  useEffect(() => {
    if (featuredTeachings.length <= 2) return;

    const interval = setInterval(() => {
      setCurrentSlide(prev => {
        // Calculate the next slide with looping effect
        const nextSlide = (prev + 1) % featuredTeachings.length;

        // Scroll to the next slide
        if (featuredSliderRef.current) {
          scrollToSlide(nextSlide, true);
        }

        return nextSlide;
      });
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [featuredTeachings.length]);

  // Function to scroll to a specific slide with looping effect
  const scrollToSlide = (index: number, isAutoScroll = false) => {
    if (!featuredSliderRef.current) return;

    const slider = featuredSliderRef.current;
    const slideWidth = slider.scrollWidth / featuredTeachings.length;

    // For smooth infinite scrolling effect
    if (isAutoScroll && currentSlide === featuredTeachings.length - 1 && index === 0) {
      // We're going from last to first slide
      // First scroll to a position just after the last slide to create a smooth transition
      slider.scrollTo({
        left: slider.scrollWidth,
        behavior: 'smooth'
      });

      // Then after a short delay, instantly jump to the first slide (without animation)
      setTimeout(() => {
        slider.scrollTo({
          left: 0,
          behavior: 'auto'
        });
      }, 500); // This delay should be shorter than the interval time
    } else {
      // Normal scrolling
      slider.scrollTo({
        left: index * slideWidth,
        behavior: 'smooth'
      });
    }
  };

  const handleSlideChange = (index: number) => {
    setCurrentSlide(index);
    scrollToSlide(index);
  };

  const handleManualScroll = () => {
    if (featuredSliderRef.current) {
      const scrollPosition = featuredSliderRef.current.scrollLeft;
      const slideWidth = featuredSliderRef.current.scrollWidth / featuredTeachings.length;
      const newSlide = Math.round(scrollPosition / slideWidth);

      if (newSlide !== currentSlide) {
        setCurrentSlide(newSlide);
      }
    }
  };

  const fetchTeachings = async () => {
    try {
      let queryBuilder = supabase
        .from('teachings')
        .select('*')
        .eq('status', 'active')
        .order('date', { ascending: false });

      if (startDate && endDate) {
        queryBuilder = queryBuilder
          .gte('date', new Date(startDate).toISOString())
          .lte('date', new Date(endDate).toISOString());
      }

      if (selectedCategory) {
        queryBuilder = queryBuilder.eq('category', selectedCategory);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('Error loading teachings:', error);
        toast.error('Erreur lors du chargement des enseignements');
        setLoading(false);
        return;
      }

      const teachingsData = (data ?? []).map(row => ({
        id: row.id,
        title: row.title || '',
        description: row.description || '',
        speaker: row.speaker || '',
        category: row.category || '',
        tags: row.tags || [],
        duration: row.duration || 0,
        fileUrl: row.fileUrl || row.file_url || '',
        thumbnail_url: row.thumbnailUrl || row.thumbnail_url,
        date: row.date ? new Date(row.date) : new Date(),
        createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
        featured: row.featured || false,
        file_url: row.fileUrl || row.file_url,
        theme: row.theme,
        plays: row.plays || 0
      })) as Teaching[];

      // Separate featured teachings
      const featured = teachingsData.filter(t => isWithinLast7Days(t.date));
      setFeaturedTeachings(featured);

      const uniqueCategories = [...new Set(teachingsData.map(t => t.category))];
      setCategories(uniqueCategories);

      setTeachings(teachingsData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading teachings:', error);
      toast.error('Erreur lors du chargement des enseignements');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachings();

    const channel = supabase
      .channel('replay-teachings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teachings' }, () => {
        fetchTeachings();
      })
      .subscribe();

    // Check for audioId in URL parameters
    const audioId = searchParams.get('audioId');
    if (audioId) {
      console.log('Audio ID found in URL:', audioId);
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [startDate, endDate, selectedCategory]);

  // Find and select the teaching from URL parameter
  useEffect(() => {
    const audioId = searchParams.get('audioId');
    if (audioId && teachings.length > 0) {
      const teaching = teachings.find(t => t.id === audioId);
      if (teaching && !selectedTeaching) {
        // Only set if not already selected to avoid unnecessary re-renders
        handleTeachingSelect(teaching);
        console.log('Selected teaching from URL parameter:', teaching.title);
      }
    }
  }, [teachings, searchParams]);

  // Handle teaching selection with audio continuity
  const handleTeachingSelect = (teaching: Teaching) => {
    setSelectedTeaching(teaching);

    // Increment play count (fire-and-forget)
    supabase
      .from('teachings')
      .update({ plays: (teaching.plays || 0) + 1 })
      .eq('id', teaching.id)
      .then(() => {});

    // Configure audio player properties
    setAudioPlayerProps({
      url: teaching.fileUrl,
      id: teaching.id,
      title: teaching.title,
      speaker: teaching.speaker,
      thumbnailUrl: teaching.thumbnail_url
    });

    // Show audio player if not already visible
    if (!isAudioPlayerVisible) {
      setIsAudioPlayerVisible(true);
    } else {
      // If already playing, signal to continue playing after source change
      shouldContinuePlaying.current = true;
    }

    // Update URL with selected audio ID without page reload
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set('audioId', teaching.id);
    const newUrl = window.location.pathname + '?' + currentParams.toString();
    window.history.pushState(null, '', newUrl);
  };

  useEffect(() => {
    if (selectedTeaching) {
      const index = teachings.findIndex(t => t.id === selectedTeaching.id);
      setCurrentIndex(index);
    } else {
      setCurrentIndex(-1);
    }
  }, [selectedTeaching, teachings]);

  const handleNext = () => {
    if (currentIndex < teachings.length - 1) {
      handleTeachingSelect(teachings[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      handleTeachingSelect(teachings[currentIndex - 1]);
    }
  };

  const handlePresetSelect = (preset: 'today' | 'week' | 'month' | 'year') => {
    // This is handled inside the DateRangePicker component
  };

  const copyToClipboard = (text: string = window.location.href) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Lien copié dans le presse-papier');
    }).catch(err => {
      console.error('Erreur lors de la copie:', err);
      toast.error('Impossible de copier le lien');
    });
  };

  const shareOnFacebook = (url: string = window.location.href) => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const shareOnTwitter = (url: string = window.location.href, text: string = 'Écoutez les audios de Vases d\'Honneur Assemblée Grâce Confondante') => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareOnWhatsApp = (url: string = window.location.href, text: string = 'Écoutez les audios de Vases d\'Honneur Assemblée Grâce Confondante') => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}%20${encodeURIComponent(url)}`, '_blank');
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleAudioShare = () => {
    // When sharing from the audio player, open the share modal
    setShowShareModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#00665C]/5 to-[#F2B636]/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00665C] mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Chargement des enseignements audio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00665C]/5 to-[#F2B636]/5">
      <TeachingHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative">
        <div className="absolute top-0 right-4 flex space-x-2 z-10">
          <button
            onClick={() => setShowShareModal(true)}
            className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow text-[#00665C] hover:bg-[#00665C]/10"
            title="Partager cette page"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowInfoModal(true)}
            className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow text-[#00665C] hover:bg-[#00665C]/10"
            title="À propos"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>

        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onPresetSelect={handlePresetSelect}
        />

        <RecentlyPlayedBar
          allTeachings={teachings}
          onSelect={(t) => setSelectedTeaching(t)}
        />

        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_400px] lg:gap-6 lg:items-start gap-8 relative">
          {/* Mobile view: bottom sheet for selected teaching detail */}
          {isMobile && (
            <>
              {/* Overlay */}
              <div
                onClick={() => setSelectedTeaching(null)}
                className={`fixed inset-0 z-30 bg-black/40 transition-opacity duration-300 ${
                  selectedTeaching ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                aria-hidden="true"
              />
              {/* Sheet */}
              <div
                role="dialog"
                aria-modal="true"
                className={`fixed inset-x-0 bottom-0 z-40 bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 ${
                  selectedTeaching ? 'translate-y-0' : 'translate-y-full'
                }`}
                style={{
                  maxHeight: '85vh',
                  overflowY: 'auto',
                  paddingBottom: isAudioPlayerVisible ? '80px' : '16px'
                }}
              >
                {/* Drag handle */}
                <div className="sticky top-0 bg-white pt-3 pb-2 flex justify-center z-10 rounded-t-2xl">
                  <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>
                <div className="px-4 pb-4">
                  {selectedTeaching && <TeachingDetails teaching={selectedTeaching} />}
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={() => setSelectedTeaching(null)}
                      className="px-4 py-2 text-sm font-medium text-[#00665C] border border-[#00665C] rounded-lg hover:bg-[#00665C]/10 transition-colors"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Tablet view: side-drawer from the right for selected teaching */}
          {isTablet && (
            <>
              {/* Overlay */}
              <div
                onClick={() => setSelectedTeaching(null)}
                className={`fixed inset-0 z-30 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
                  selectedTeaching ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                aria-hidden="true"
              />
              {/* Drawer */}
              <div
                role="dialog"
                aria-modal="true"
                className={`fixed top-0 right-0 h-full w-[380px] max-w-[90vw] z-40 bg-white shadow-2xl transform transition-transform duration-300 overflow-y-auto ${
                  selectedTeaching ? 'translate-x-0' : 'translate-x-full'
                }`}
                style={{ paddingBottom: isAudioPlayerVisible ? '80px' : '16px' }}
              >
                <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
                  <span className="text-sm font-semibold text-[#00665C]">Détails de l'enseignement</span>
                  <button
                    onClick={() => setSelectedTeaching(null)}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-[#00665C] transition-colo