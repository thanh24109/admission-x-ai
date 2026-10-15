"use client";

import React from "react";
import { DegreeFilterType } from "@/types/training";
import { cn } from "@/lib/utils";

interface DegreeFilterProps {
  selected: DegreeFilterType;
  onChange: (filter: DegreeFilterType) => void;
  counts: {
    all: number;
    engineer: number;
    bachelor: number;
  };
}

export function DegreeFilter({ selected, onChange, counts }: DegreeFilterProps) {
  const filters: { id: DegreeFilterType; label: string; count: number }[] = [
    { id: "ALL", label: "Tất cả", count: counts.all },
    { id: "ENGINEER", label: "Kỹ sư", count: counts.engineer },
    { id: "BACHELOR", label: "Cử nhân", count: counts.bachelor },
  ];

  return (
    <div
      className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold"
      role="group"
      aria-label="Lọc theo loại bằng cấp"
    >
      {filters.map((f) => {
        const isActive = selected === f.id;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange(f.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5",
              isActive
                ? "bg-white dark:bg-slate-900 text-school-navy dark:text-slate-100 shadow-sm font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <span>{f.label}</span>
            <span
              className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px]",
                isActive
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  : "bg-slate-200/70 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400"
              )}
            >
              {f.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
