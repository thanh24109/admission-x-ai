"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgramPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function ProgramPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: ProgramPaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers
  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
      {/* Result range counter */}
      <div className="text-slate-500 dark:text-slate-400 font-medium">
        Hiển thị <span className="font-bold text-school-navy dark:text-slate-200">{startItem}</span> -{" "}
        <span className="font-bold text-school-navy dark:text-slate-200">{endItem}</span> trên tổng số{" "}
        <span className="font-bold text-school-navy dark:text-slate-200">{totalItems}</span> ngành
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        {/* Previous button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            "p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-colors",
            currentPage === 1
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-white dark:hover:bg-slate-800 hover:text-school-navy dark:hover:text-amber-400"
          )}
          aria-label="Trang trước"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page buttons */}
        {pages.map((p) => {
          const isCurrent = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={cn(
                "h-8 min-w-8 px-2 rounded-lg font-semibold transition-all duration-150",
                isCurrent
                  ? "bg-school-navy dark:bg-amber-400 text-white dark:text-slate-950 shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
              )}
              aria-current={isCurrent ? "page" : undefined}
            >
              {p}
            </button>
          );
        })}

        {/* Next button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            "p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-colors",
            currentPage === totalPages
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-white dark:hover:bg-slate-800 hover:text-school-navy dark:hover:text-amber-400"
          )}
          aria-label="Trang sau"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
