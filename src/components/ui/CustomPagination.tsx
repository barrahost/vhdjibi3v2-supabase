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
  itemsPerPage 
}: PaginationProps) {
  const startItem = ((currentPage - 1) * itemsPerPage) + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  // Calculate which page numbers to show
  const getPageNumbers = () => {
    const maxPagesToShow = 5; // Show at most 5 page numbers at once
    
    if (totalPages <= maxPagesToShow) {
      // If we have fewer pages than the max, show all pages
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Calculate the range of pages to show, accounting for first and last pages
    const maxPagesWithoutFirstLast = maxPagesToShow - 2; // Reserve space for first and last
    
    let startPage = Math.max(2, currentPage - Math.floor(maxPagesWithoutFirstLast / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxPagesWithoutFirstLast - 1);
    
    // Adjust the range if we're near the beginning or end
    if (startPage <= 2) {
      startPage = 2;
      endPage = Math.min(totalPages - 1, startPage + maxPagesWithoutFirstLast - 1);
    } else if (endPage >= totalPages - 1) {
      endPage = totalPages - 1;
      startPage = Math.max(2, endPage - maxPagesWithoutFirstLast + 1);
    }
    
    // Create the array of page numbers
    let pages = [];
    
    // Always add the first page
    pages.push(1);
    
    // Add ellipsis if there's a gap after the first page
    if (startPage > 2) {
      pages.push('...');
    }
    
    // Add the middle pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Add ellipsis if there's a gap before the last page
    if (endPage < totalPages - 1) {
      pages.push('...');
    }
    
    // Always add the last page if it's not already included
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  const pageNumbers = getPageNumbers();

  return (
    <div className="px-6 py-4 border-t">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Affichage de {startItem} à {endItem} sur {totalItems} résultats
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Précédent
          </button>
          {pageNumbers.map((pageNumber, index) => (
            pageNumber === '...' ? (
              <span key={`ellipsis-${index}`} className="px-3 py-1 text-sm text-gray-500">
                ...
              </span>
            ) : (
              <button
                key={`page-${pageNumber}`}
                onClick={() => onPageChange(Number(pageNumber))}
                className={`px-3 py-1 border rounded-md text-sm ${
                  currentPage === pageNumber
                    ? 'bg-[#00665C] text-white'
                    : 'hover:bg-gray-50'
                }`}
              >
                {pageNumber}
              </button>
            )
          ))}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}