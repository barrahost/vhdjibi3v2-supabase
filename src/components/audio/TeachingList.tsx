import { useEffect, useState } from 'react';
import { TeachingFilters } from './TeachingFilters';
import { AudioTeaching as Teaching } from '../../types/audio.types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TeachingCard } from './TeachingCard';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const MOBILE_PAGE_SIZE = 8;

interface TeachingListProps {
  teachings: Teaching[];
  onSelect: (teaching: Teaching) => void;
  selectedTeaching: Teaching | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function TeachingList({ 
  teachings, 
  onSelect, 
  selectedTeaching,
  currentPage,
  totalPages,
  onPageChange
}: TeachingListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState('');
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [visibleCount, setVisibleCount] = useState(MOBILE_PAGE_SIZE);

  // Get unique categories and speakers
  const categories = [...new Set(teachings.map(t => t.category))];
  const speakers = [...new Set(teachings.map(t => t.speaker))];

  // Filter teachings
  const filteredTeachings = teachings.filter(teaching => {
    const matchesSearch = teaching.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teaching.speaker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teaching.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || teaching.category === selectedCategory;
    const matchesSpeaker = !selectedSpeaker || teaching.speaker === selectedSpeaker;

    return matchesSearch && matchesCategory && matchesSpeaker;
  });

  // Reset mobile pagination when filters change
  useEffect(() => {
    setVisibleCount(MOBILE_PAGE_SIZE);
  }, [searchTerm, selectedCategory, selectedSpeaker, isMobile]);

  // On mobile: show progressive slice. On desktop: keep parent pagination.
  const displayedTeachings = isMobile
    ? filteredTeachings.slice(0, visibleCount)
    : filteredTeachings;
  const remaining = Math.max(0, filteredTeachings.length - visibleCount);

  return (
    <div className="w-full xl:grid xl:grid-cols-[224px_1fr] xl:gap-6 xl:items-start space-y-6 xl:space-y-0">
      {/* Sidebar filters — desktop XL only */}
      <div className="hidden xl:block sticky top-4 self-start">
        <TeachingFilters
          variant="sidebar"
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedSpeaker={selectedSpeaker}
          onSpeakerChange={setSelectedSpeaker}
          categories={categories}
          speakers={speakers}
        />
      </div>

      <div className="space-y-6 min-w-0">
        {/* Inline filters — mobile, tablet, lg (hidden at XL) */}
        <div className="xl:hidden">
          <TeachingFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedSpeaker={selectedSpeaker}
            onSpeakerChange={setSelectedSpeaker}
            categories={categories}
            speakers={speakers}
          />
        </div>

        <div className="space-y-2 w-full">
          {filteredTeachings.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg border">
              <p className="text-gray-500">Aucun audio trouvé</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                {displayedTeachings.map(teaching => (
                  <TeachingCard
                    key={teaching.id}
                    id={teaching.id}
                    title={teaching.title}
                    speaker={teaching.speaker}
                    date={teaching.date}
                    duration={teaching.duration}
                    category={teaching.category}
                    theme={teaching.theme}
                    thumbnail_url={teaching.thumbnail_url}
                    plays={teaching.plays}
                    isSelected={selectedTeaching?.id === teaching.id}
                    isPlaying={selectedTeaching?.id === teaching.id}
                    onClick={() => onSelect(teaching)}
                  />
                ))}
              </div>

              {/* Mobile only: load more */}
              {isMobile && remaining > 0 && (
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + MOBILE_PAGE_SIZE)}
                  className="w-full py-3 text-sm font-medium text-[#00665C] border border-[#00665C] rounded-xl mt-4 hover:bg-[#00665C]/5 transition-colors"
                >
                  Charger plus ({remaining} restant{remaining > 1 ? 's' : ''})
                </button>
              )}
            </>
          )}
        </div>
      
      {/* Pagination — desktop only (mobile uses "Charger plus") */}
      {!isMobile && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Affichage de la page <span className="font-medium">{currentPage}</span> sur{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Précédent</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      page === currentPage
                        ? 'z-10 bg-[#00665C] text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00665C]'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Suivant</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}