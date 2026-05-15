import { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { TeachingHeader } from '../components/audio/TeachingHeader';
import { TeachingList } from '../components/audio/TeachingList';
import { Play, Calendar, Share2, Copy, Check, Facebook, Headphones, Info, X, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateForInput, isWithinLast7Days } from '../utils/dateUtils';
import { incrementPlayCount } from '../lib/db';
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

  useEffect(() => {
    let q = query(
      collection(db, 'teachings'),
      where('status', '==', 'active'),
      orderBy('date', 'desc')
    );

    if (startDate && endDate) {
      q = query(
        collection(db, 'teachings'),
        where('status', '==', 'active'),
        orderBy('date', 'desc'),
        where('date', '>=', new Date(startDate)),
        where('date', '<=', new Date(endDate))
      );
    }

    if (selectedCategory) {
      q = query(
        collection(db, 'teachings'),
        where('status', '==', 'active'),
        orderBy('date', 'desc'),
        where('category', '==', selectedCategory)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teachingsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          speaker: data.speaker || '',
          category: data.category || '',
          tags: data.tags || [],
          duration: data.duration || 0,
          fileUrl: data.fileUrl || data.file_url || '',
          thumbnail_url: data.thumbnailUrl || data.thumbnail_url,
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate(),
          featured: data.featured || false,
          file_url: data.fileUrl || data.file_url,
          theme: data.theme,
          plays: data.plays || 0
        };
      }) as Teaching[];
      
      // Separate featured teachings
      const featured = teachingsData.filter(t => isWithinLast7Days(t.date));
      setFeaturedTeachings(featured);
      
      const uniqueCategories = [...new Set(teachingsData.map(t => t.category))];
      setCategories(uniqueCategories);
      
      setTeachings(teachingsData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading teachings:', error);
      toast.error('Erreur lors du chargement des enseignements');
      setLoading(false);
    });

    // Check for audioId in URL parameters
    const audioId = searchParams.get('audioId');
    if (audioId) {
      console.log('Audio ID found in URL:', audioId);
    }

    return () => {
      unsubscribe();
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
    
    // Increment play count
    incrementPlayCount(teaching.id);
    
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
                    className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-[#00665C] transition-colors"
                    aria-label="Fermer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4">
                  {selectedTeaching && <TeachingDetails teaching={selectedTeaching} />}
                </div>
              </div>
            </>
          )}
          
          <div className="w-full min-w-0 space-y-8">
            {/* Featured Teachings Section */}
            {featuredTeachings.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-[#00665C] flex items-center">
                    <Star className="w-5 h-5 mr-2 text-amber-500" />
                    À la une
                  </h2>
                  
                  {featuredTeachings.length > 2 && (
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleSlideChange((currentSlide - 1 + featuredTeachings.length) % featuredTeachings.length)}
                        className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                        aria-label="Précédent"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleSlideChange((currentSlide + 1) % featuredTeachings.length)}
                        className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                        aria-label="Suivant"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div 
                  ref={featuredSliderRef}
                  className={`${featuredTeachings.length > 2 ? 'flex overflow-x-auto pb-4 space-x-4 snap-x snap-mandatory scroll-smooth scrollbar-hide' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}`}
                  onScroll={featuredTeachings.length > 2 ? handleManualScroll : undefined}
                >
                  {featuredTeachings.map((teaching, index) => (
                    <div 
                      key={teaching.id}
                      onClick={() => setSelectedTeaching(teaching)}
                      className={`bg-white rounded-lg border shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 ${
                        featuredTeachings.length > 2 ? 'flex-shrink-0 snap-start basis-full sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(33.333%-0.667rem)]' : ''
                      }`}
                    >
                      <div className="relative">
                        {teaching.thumbnail_url ? (
                          <img 
                            src={teaching.thumbnail_url}
                            alt={teaching.title}
                            className="w-full h-32 object-cover"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                            <Play className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            <Star className="w-3 h-3 mr-1" />
                            À la une
                          </span>
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-gray-900 line-clamp-1">{teaching.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">{teaching.speaker}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Slide indicators */}
                {featuredTeachings.length > 2 && (
                  <div className="flex justify-center mt-4 space-x-2">
                    {featuredTeachings.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => handleSlideChange(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          currentSlide === index ? 'bg-[#00665C]' : 'bg-gray-300'
                        }`}
                        aria-label={`Slide ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Regular Teachings List */}
            <TeachingList
              teachings={teachings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE) as any}
              onSelect={handleTeachingSelect as any}
              selectedTeaching={selectedTeaching as any}
              currentPage={currentPage}
              totalPages={Math.ceil(teachings.length / ITEMS_PER_PAGE)}
              onPageChange={setCurrentPage}
            />
          </div>

          <aside className="hidden lg:block w-full">
            <div className="sticky top-4">
              {selectedTeaching && !isMobile ? (
                <div className="relative">
                  <button
                    onClick={() => setSelectedTeaching(null)}
                    className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#00665C] hover:border-[#00665C] transition-colors"
                    title="Fermer la fiche"
                    aria-label="Fermer la fiche"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <TeachingDetails teaching={selectedTeaching} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-80 rounded-2xl border-2 border-dashed border-gray-200 bg-white/40 text-gray-400 p-6 text-center">
                  <Headphones className="w-10 h-10 mb-3 opacity-50" />
                  <p className="text-sm font-medium">Sélectionnez un enseignement</p>
                  <p className="text-xs mt-1">pour voir les détails ici</p>
                </div>
              )}
            </div>
          </aside>
        </div>

        {showShareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Partager cette page</h3>
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={selectedTeaching ? 
                        `${window.location.origin}${window.location.pathname}?audioId=${selectedTeaching.id}` : 
                        window.location.href}
                      readOnly
                      className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
                    />
                    <button
                      onClick={() => copyToClipboard(selectedTeaching ? 
                        `${window.location.origin}${window.location.pathname}?audioId=${selectedTeaching.id}` : 
                        window.location.href)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      title="Copier le lien"
                    >
                      {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-center space-x-4 pt-2">
                  <button
                    onClick={() => shareOnFacebook(selectedTeaching ? 
                      `${window.location.origin}${window.location.pathname}?audioId=${selectedTeaching.id}` : 
                      window.location.href)}
                    className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                    title="Partager sur Facebook"
                  >
                    <Facebook className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      const url = selectedTeaching ? 
                        `${window.location.origin}${window.location.pathname}?audioId=${selectedTeaching.id}` : 
                        window.location.href;
                      const text = selectedTeaching ? 
                        `${selectedTeaching.title} - ${selectedTeaching.speaker}` : 
                        'Écoutez les audios de Vases d\'Honneur Assemblée Grâce Confondante';
                      shareOnTwitter(url, text);
                    }}
                    className="p-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                    title="Partager sur X (Twitter)"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      const url = selectedTeaching ? 
                        `${window.location.origin}${window.location.pathname}?audioId=${selectedTeaching.id}` : 
                        window.location.href;
                      const text = selectedTeaching ? 
                        `${selectedTeaching.title} - ${selectedTeaching.speaker}` : 
                        'Écoutez les audios de Vases d\'Honneur Assemblée Grâce Confondante';
                      shareOnWhatsApp(url, text);
                    }}
                    className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                    title="Partager sur WhatsApp"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {showInfoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">À propos de Replay Audio</h3>
                <button 
                  onClick={() => setShowInfoModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4 text-gray-600">
                <p>
                  Bienvenue sur la page de replay audio de Vases d'Honneur Assemblée Grâce Confondante. Cette plateforme vous permet d'écouter tous les moments forts de la cellule : adoration, louange, prédication, sainte cène et plus encore.
                </p>
                <p>
                  Vous pouvez filtrer les audios par date, catégorie ou orateur, et télécharger les fichiers pour les écouter hors ligne.
                </p>
                <p>
                  N'hésitez pas à partager cette page avec vos proches pour qu'ils puissent également revivre ces moments spirituels édifiants.
                </p>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setShowInfoModal(false)}
                    className="px-4 py-2 bg-[#00665C] text-white rounded-lg hover:bg-[#00665C]/90 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {isAudioPlayerVisible && audioPlayerProps && (
          <AudioPlayer
            onClose={() => {
              setIsAudioPlayerVisible(false);
              setSelectedTeaching(null);
              setAudioPlayerProps(null);
            }}
            id={audioPlayerProps.id}
            url={audioPlayerProps.url}
            title={audioPlayerProps.title}
            speaker={audioPlayerProps.speaker}
            thumbnailUrl={audioPlayerProps.thumbnailUrl}
            onNext={currentIndex < teachings.length - 1 ? handleNext : undefined}
            onPrevious={currentIndex > 0 ? handlePrevious : undefined}
            onEnded={() => {
              // Handle playback ending
              setIsAudioPlayerVisible(false);
              setSelectedTeaching(null);
              setAudioPlayerProps(null);
            }}
            onShare={handleAudioShare}
            initialPlayState={shouldContinuePlaying.current}
          />
        )}
      </div>
      <Footer />
    </div>
  );
}