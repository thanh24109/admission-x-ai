"use client";

import React from "react";
import Link from "next/link";
import { AdmissionTabId } from "@/types/admissions";
import { cn } from "@/lib/utils";

interface CategoryTab {
  id: AdmissionTabId;
  label: string;
  href: string;
}

interface AdmissionsCategoryTabsProps {
  activeTab: AdmissionTabId;
  onTabChange?: (tab: AdmissionTabId) => void;
  isNavigating?: boolean;
}

export const ADMISSION_TABS: CategoryTab[] = [
  { id: "all", label: "Tất cả", href: "/tuyensinh" },
  { id: "daihoc", label: "Đại học", href: "/tuyensinh/daihoc" },
  { id: "caohoc", label: "Cao học", href: "/tuyensinh/caohoc" },
  { id: "nghiencuusinh", label: "Nghiên cứu sinh", href: "/tuyensinh/nghiencuusinh" },
  { id: "daotaothuongxuyen", label: "Đào tạo thường xuyên", href: "/tuyensinh/daotaothuongxuyen" },
];

export function AdmissionsCategoryTabs({
  activeTab,
  onTabChange,
  isNavigating = false,
}: AdmissionsCategoryTabsProps) {
  return (
    <div
      className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-full inline-flex flex-wrap items-center gap-1 shadow-sm"
      role="tablist"
      aria-label="Danh mục tuyển sinh"
    >
      {ADMISSION_TABS.map((tab) => {
        const isActive = activeTab === tab.id;

        if (isNavigating) {
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-150 select-none",
                isActive
                  ? "bg-school-navy dark:bg-slate-800 text-white dark:text-amber-400 shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-school-navy dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              )}
              role="tab"
              aria-selected={isActive}
            >
              {tab.label}
            </Link>
          );
        }

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange?.(tab.id)}
            className={cn(
              "px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-150 select-none cursor-pointer",
              isActive
                ? "bg-school-navy dark:bg-slate-800 text-white dark:text-amber-400 shadow-sm font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-school-navy dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            )}
            role="tab"
            aria-selected={isActive}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
