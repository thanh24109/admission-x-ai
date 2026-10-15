"use client";

import React from "react";
import { SearchX, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProgramEmptyStateProps {
  onReset: () => void;
  searchQuery?: string;
}

export function ProgramEmptyState({ onReset, searchQuery }: ProgramEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-2xl">
      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500 mb-3">
        <SearchX className="w-8 h-8" />
      </div>

      <h3 className="text-base font-bold text-school-navy dark:text-slate-100">
        Không tìm thấy chương trình phù hợp
      </h3>

      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1.5 leading-relaxed">
        {searchQuery ? (
          <>
            Không có kết quả nào cho từ khóa{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              &quot;{searchQuery}&quot;
            </span>
            . Vui lòng thử tìm kiếm với tên ngành khác hoặc mã ngành viết liền.
          </>
        ) : (
          "Không có chương trình đào tạo nào thỏa mãn bộ lọc hiện tại."
        )}
      </p>

      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        className="mt-4 gap-1.5 text-xs text-school-navy dark:text-slate-200 hover:text-epu-orange border-slate-200 dark:border-slate-800 rounded-xl"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Đặt lại bộ lọc</span>
      </Button>
    </div>
  );
}
