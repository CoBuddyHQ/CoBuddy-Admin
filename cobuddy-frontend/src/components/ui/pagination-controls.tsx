'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import type { PaginationMeta } from '@/types/pagination';

export function PaginationControls({
  meta,
  page,
  onPageChange,
  pending = false,
}: {
  meta?: PaginationMeta;
  page: number;
  onPageChange: (page: number) => void;
  pending?: boolean;
}) {
  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
    >
      <span aria-live="polite">
        {meta
          ? `Page ${page} of ${Math.max(1, meta.totalPages)} | ${meta.totalItems} records`
          : 'Loading records...'}
      </span>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          title="Previous page"
          aria-label="Previous page"
          disabled={pending || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          title="Next page"
          aria-label="Next page"
          disabled={pending || !meta?.hasNext}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
