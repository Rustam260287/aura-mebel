import React, { memo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = memo(({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const pageRange = 2; 
    
    if (totalPages <= 1) return [];

    pageNumbers.push(1);

    if (currentPage > pageRange + 1) {
      pageNumbers.push('...');
    }

    for (let i = Math.max(2, currentPage - pageRange + 1); i <= Math.min(totalPages - 1, currentPage + pageRange -1); i++) {
        pageNumbers.push(i);
    }
    
    if (currentPage < totalPages - pageRange) {
        pageNumbers.push('...');
    }

    if (totalPages > 1) {
        pageNumbers.push(totalPages);
    }
    
    return [...new Set(pageNumbers)];
  };

  const pageNumbers = getPageNumbers();

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const PageButton: React.FC<{ page: number | string; active: boolean; disabled?: boolean; onClick?: () => void }> = ({ page, active, disabled = false, onClick }) => {
    const baseClasses = 'inline-flex items-center justify-center w-10 h-10 rounded-md font-medium transition-colors text-sm';
    const activeClasses = 'bg-brand-brown text-white shadow-sm';
    const inactiveClasses = 'bg-white text-brand-charcoal hover:bg-brand-cream-dark';
    const disabledClasses = 'text-gray-400 bg-gray-100 cursor-not-allowed';

    if (page === '...') {
      return <span className={`${baseClasses} text-gray-500`}>...</span>;
    }

    const classes = [
      baseClasses,
      disabled ? disabledClasses : (active ? activeClasses : inactiveClasses),
    ].join(' ');

    return (
      <button onClick={onClick} className={classes} disabled={disabled}>
        {page}
      </button>
    );
  };

  return (
    <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
      <button
        onClick={handlePrev}
        disabled={currentPage === 1}
        className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-white text-brand-charcoal hover:bg-brand-cream-dark disabled:text-gray-400 disabled:bg-gray-100 transition-colors"
        aria-label="Предыдущая страница"
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>

      {pageNumbers.map((page, index) => (
        <PageButton
          key={`${page}-${index}`}
          page={page}
          active={page === currentPage}
          onClick={() => typeof page === 'number' && onPageChange(page)}
        />
      ))}

      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-white text-brand-charcoal hover:bg-brand-cream-dark disabled:text-gray-400 disabled:bg-gray-100 transition-colors"
        aria-label="Следующая страница"
      >
        <ChevronRightIcon className="w-5 h-5" />
      </button>
    </nav>
  );
});
