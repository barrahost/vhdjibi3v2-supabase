import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export function CustomPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    if (totalPages <= maxPagesToShow) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const maxMid = maxPagesToShow - 2;
    let start = Math.max(2, currentPage - Math.floor(maxMid / 2));
    let end = Math.min(totalPages - 1, start + maxMid - 1);
    if (start <= 2) { start = 2; end = Math.min(totalPages - 1, start + maxMid - 1); }
    else if (end >= totalPages - 1) { end = totalPages - 1; start = Math.max(2, end - maxMid + 1); }

    const pages: (number | '...')[] = [1];
    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="px-4 sm:px-6 py-3 sm:py-4 border-t bg-white rounded-b-lg">
      {/* Mobile: compact prev/next + page indicator */}
      <div className="flex sm:hidden items-center justify-between gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-2 border rounded-md text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 active:bg-gray-100"
        >
          <ChevronLeft className="w-4 h-4" /> Préc.
        </button>
        <span className="text-sm text-gray-600 font-medium">
          {currentPage} / {totalPages}
          <span className="text-gray-400 font-normal ml-1">({totalItems})</span>
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-2 border rounded-md text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 active:bg-gray-100"
        >
          Suiv. <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Desktop: full pagination */}
      <div className="hidden sm:flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Affichage de {startItem} à {endItem} sur {totalItems} résultats
        </div>
        <div className="flex space-x-1.5">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-medium"
          >
            Précédent
          </button>
          {pageNumbers.map((pageNumber, index) =>
            pageNumber === '...' ? (
              <span key={`ellipsis-${index}`} className="px-3 py-1.5 text-sm text-gray-400">
                …
              </span>
            ) : (
              <button
                key={`page-${pageNumber}`}
                onClick={() => onPageChange(Number(pageNumber))}
                className={`px-3 py-1.5 border rounded-md text-sm font-medium ${
                  currentPage === pageNumber
                    ? 'bg-[#00665C] text-white border-[#00665C]'
                    : 'hover:bg-gray-50'
                }`}
              >
                {pageNumber}
              </button>
            )
          )}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-medium"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}
