import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from 'lucide-react';

function PaginationControls({ 
  currentPage, 
  totalItems, 
  pageSize, 
  onPageChange, 
  onPageSizeChange, 
  isLoading 
}) {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalItems);
  const hasNextPage = currentPage < totalPages - 1;
  const hasPrevPage = currentPage > 0;

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    onPageSizeChange(newSize);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow + 2) {
      // Show all pages if total is small
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(0);
      
      // Calculate range around current page
      let startPage = Math.max(1, currentPage - 1);
      let endPage = Math.min(totalPages - 2, currentPage + 1);
      
      // Adjust if we're near the start
      if (currentPage <= 2) {
        endPage = 3;
      }
      
      // Adjust if we're near the end
      if (currentPage >= totalPages - 3) {
        startPage = totalPages - 4;
      }
      
      // Add ellipsis if needed
      if (startPage > 1) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed
      if (endPage < totalPages - 2) {
        pages.push('...');
      }
      
      // Show last page
      pages.push(totalPages - 1);
    }
    
    return pages;
  };

  if (totalItems === 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      {/* Left: Page Size Selector */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground">
          Per page:
        </label>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          disabled={isLoading}
          className="h-9 px-3 text-sm border border-border bg-background rounded focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      {/* Center: Page Info */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="hidden sm:inline">
          Showing {startItem}-{endItem} of {totalItems} items
        </span>
        <span className="sm:hidden">
          {startItem}-{endItem} / {totalItems}
        </span>
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        )}
      </div>

      {/* Right: Navigation Buttons */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          onClick={() => onPageChange(0)}
          disabled={!hasPrevPage || isLoading}
          aria-label="First page"
          className="hidden sm:inline-flex h-9 w-9 rounded border border-border hover:bg-primary/10 hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all items-center justify-center"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous Page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevPage || isLoading}
          aria-label="Previous page"
          className="inline-flex h-9 w-9 rounded border border-border hover:bg-primary/10 hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all items-center justify-center"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 mx-2">
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                  ...
                </span>
              );
            }
            
            const isCurrentPage = page === currentPage;
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                disabled={isLoading}
                aria-label={`Page ${page + 1}`}
                aria-current={isCurrentPage ? 'page' : undefined}
                className={`h-9 px-3 text-sm rounded border transition-all ${
                  isCurrentPage
                    ? 'bg-primary text-black border-primary font-semibold'
                    : 'border-border hover:bg-primary/10 hover:border-primary text-foreground'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {page + 1}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage || isLoading}
          aria-label="Next page"
          className="inline-flex h-9 w-9 rounded border border-border hover:bg-primary/10 hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all items-center justify-center"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages - 1)}
          disabled={!hasNextPage || isLoading}
          aria-label="Last page"
          className="hidden sm:inline-flex h-9 w-9 rounded border border-border hover:bg-primary/10 hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all items-center justify-center"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default PaginationControls;
