"use client";

import React, { useState, useMemo } from "react";
import { AdmissionArticle, AdmissionTabId } from "@/types/admissions";
import { AdmissionsCategoryTabs } from "./AdmissionsCategoryTabs";
import { AdmissionCard } from "./AdmissionCard";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdmissionsListProps {
  initialArticles: AdmissionArticle[];
  initialCategory?: AdmissionTabId;
  pageSize?: number;
}

export function AdmissionsList({
  initialArticles,
  initialCategory = "all",
  pageSize = 10,
}: AdmissionsListProps) {
  const [activeTab, setActiveTab] = useState<AdmissionTabId>(initialCategory);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter articles based on active category tab
  const filteredArticles = useMemo(() => {
    if (activeTab === "all") {
      return initialArticles;
    }
    return initialArticles.filter((item) => item.categorySlug === activeTab);
  }, [initialArticles, activeTab]);

  const handleTabChange = (tab: AdmissionTabId) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // Pagination calculation
  const totalPages = Math.ceil(filteredArticles.length / pageSize) || 1;
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredArticles.slice(start, start + pageSize);
  }, [filteredArticles, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* 1. Category Filter Tabs */}
      <div>
        <AdmissionsCategoryTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      {/* 2. Articles List */}
      {paginatedArticles.length > 0 ? (
        <div className="space-y-3.5">
          {paginatedArticles.map((article) => (
            <AdmissionCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Chưa có thông báo trong mục này
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            Hiện chưa có tin tuyển sinh mới cho cấp học này. Vui lòng quay lại sau hoặc chọn mục khác.
          </p>
          <button
            type="button"
            onClick={() => handleTabChange("all")}
            className="mt-4 px-4 py-1.5 text-xs font-semibold text-school-navy dark:text-amber-400 hover:underline"
          >
            Xem tất cả thông báo
          </button>
        </div>
      )}

      {/* 3. Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200/60 dark:border-slate-800 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Hiển thị <span className="font-bold text-slate-800 dark:text-slate-200">{(currentPage - 1) * pageSize + 1}</span> -{" "}
            <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min(currentPage * pageSize, filteredArticles.length)}</span> trên tổng số{" "}
            <span className="font-bold text-slate-800 dark:text-slate-200">{filteredArticles.length}</span> thông báo
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className={cn(
                "p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-colors",
                currentPage === 1
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-white dark:hover:bg-slate-800 hover:text-school-navy dark:hover:text-amber-400"
              )}
              aria-label="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "h-8 min-w-8 px-2.5 rounded-lg text-xs font-semibold transition-all",
                  currentPage === page
                    ? "bg-school-navy dark:bg-amber-400 text-white dark:text-slate-950 shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                )}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={cn(
                "p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-colors",
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
      )}
    </div>
  );
}
