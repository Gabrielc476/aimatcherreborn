import React from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: PaginationProps) {
  // Don't render pagination if there's only one page
  if (totalPages <= 1) return null;

  // Calculate which page numbers to show
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // If total pages is less than max pages to show, display all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always include first page, last page, current page, and pages around current
      const leftSiblingIndex = Math.max(currentPage - 1, 1);
      const rightSiblingIndex = Math.min(currentPage + 1, totalPages);

      // Flag to determine if we should show dots
      const shouldShowLeftDots = leftSiblingIndex > 2;
      const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

      if (!shouldShowLeftDots && shouldShowRightDots) {
        // Show first few pages
        for (let i = 1; i <= 3; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("dots");
        pageNumbers.push(totalPages);
      } else if (shouldShowLeftDots && !shouldShowRightDots) {
        // Show last few pages
        pageNumbers.push(1);
        pageNumbers.push("dots");
        for (let i = totalPages - 2; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else if (shouldShowLeftDots && shouldShowRightDots) {
        // Show first page, dots, around current page, dots, and last page
        pageNumbers.push(1);
        pageNumbers.push("dots");
        pageNumbers.push(leftSiblingIndex);
        pageNumbers.push(currentPage);
        pageNumbers.push(rightSiblingIndex);
        pageNumbers.push("dots");
        pageNumbers.push(totalPages);
      } else {
        // Show all pages
        for (let i = 1; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      }
    }

    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`flex items-center justify-center space-x-1 ${className}`}>
      {/* First page button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="h-8 w-8"
      >
        <ChevronsLeft className="h-4 w-4" />
        <span className="sr-only">Primeira página</span>
      </Button>

      {/* Previous page button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-8 w-8"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Página anterior</span>
      </Button>

      {/* Page numbers */}
      {pageNumbers.map((pageNumber, index) => {
        if (pageNumber === "dots") {
          return (
            <span
              key={`dots-${index}`}
              className="flex h-8 w-8 items-center justify-center text-sm"
            >
              ...
            </span>
          );
        }

        return (
          <Button
            key={`page-${pageNumber}`}
            variant={currentPage === pageNumber ? "default" : "outline"}
            onClick={() => onPageChange(pageNumber as number)}
            className="h-8 w-8"
          >
            {pageNumber}
          </Button>
        );
      })}

      {/* Next page button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-8 w-8"
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Próxima página</span>
      </Button>

      {/* Last page button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="h-8 w-8"
      >
        <ChevronsRight className="h-4 w-4" />
        <span className="sr-only">Última página</span>
      </Button>
    </div>
  );
}

export default Pagination;
