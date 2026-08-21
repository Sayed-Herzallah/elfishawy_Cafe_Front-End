import React from 'react';
import { Button } from './Button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  /** Current page number (1-based) */
  currentPage: number;
  /** Total number of items */
  totalItems: number;
  /** Items per page */
  itemsPerPage: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Maximum number of page buttons to show (optional, default 7) */
  maxPages?: number;
  /** Show "Previous/Next" buttons (optional, default true) */
  showPrevNext?: boolean;
  /** Always show first/last (optional, default true) */
  showFirstLast?: boolean;
  /** Show items per page selector */
  showItemsPerPage?: boolean;
  /** Items per page options */
  itemsPerPageOptions?: number[];
  /** Callback when items per page changes */
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

/**
 * Professional Google-style pagination with ellipsis for large data sets.
 * Features: RTL-aware, responsive, accessible, items per page selector
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  maxPages = 7,
  showPrevNext = true,
  showFirstLast = true,
  showItemsPerPage = false,
  itemsPerPageOptions = [10, 25, 50, 100],
  onItemsPerPageChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= maxPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const sidePages = Math.floor((maxPages - 5) / 2);
    let start = Math.max(2, currentPage - sidePages);
    let end = Math.min(totalPages - 1, currentPage + sidePages);

    if (currentPage <= sidePages + 1) {
      start = 2;
      end = maxPages - 3;
    } else if (currentPage >= totalPages - sidePages) {
      start = totalPages - (maxPages - 3) + 1;
      end = totalPages - 1;
    }

    const pages: (number | 'ellipsis')[] = [1];
    if (start > 2) pages.push('ellipsis');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  const pages = getPageNumbers();

  if (totalPages <= 1 && !showItemsPerPage) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-1">
      {/* Items per page selector */}
      {showItemsPerPage && onItemsPerPageChange && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-bold">عرض:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="bg-[#faf8f5] hover:bg-white focus:bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2e5b9f]/20 focus:border-[#2e5b9f] appearance-none cursor-pointer"
          >
            {itemsPerPageOptions.map((opt) => (
              <option key={opt} value={opt}>{opt} في الصفحة</option>
            ))}
          </select>
        </div>
      )}

      {/* Pagination Info */}
      <div className="flex items-center gap-4 text-sm text-gray-500 font-mono">
        <span className="px-3 py-1.5 bg-gray-50 rounded-lg">
          {totalItems > 0 ? `${startItem} - ${endItem} من ${totalItems}` : 'لا توجد نتائج'}
        </span>
      </div>

      {/* Page Numbers */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {/* First Page */}
        {showFirstLast && (
          <Button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            variant={currentPage === 1 ? 'ghost' : 'outline'}
            size="sm"
            className="text-xs font-mono p-2 w-9 h-9"
            aria-label="الصفحة الأولى"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        )}

        {/* Previous */}
        {showPrevNext && (
          <Button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            variant={currentPage === 1 ? 'ghost' : 'outline'}
            size="sm"
            className="text-xs font-mono p-2 w-9 h-9"
            aria-label="السابق"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}

        {/* Page Numbers */}
        {pages.map((page, idx) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-2 py-1.5 text-xs text-gray-400 font-mono"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <Button
              key={page}
              onClick={() => onPageChange(page)}
              variant={currentPage === page ? 'primary' : 'outline'}
              size="sm"
              className={`text-xs font-mono min-w-[36px] h-9 ${
                currentPage === page ? 'bg-[#2e5b9f] text-white shadow-2xs' : 'hover:bg-gray-50'
              }`}
              aria-label={`صفحة ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </Button>
          )
        )}

        {/* Next */}
        {showPrevNext && (
          <Button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant={currentPage === totalPages ? 'ghost' : 'outline'}
            size="sm"
            className="text-xs font-mono p-2 w-9 h-9"
            aria-label="التالي"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}

        {/* Last Page */}
        {showFirstLast && (
          <Button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            variant={currentPage === totalPages ? 'ghost' : 'outline'}
            size="sm"
            className="text-xs font-mono p-2 w-9 h-9"
            aria-label="الصفحة الأخيرة"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};