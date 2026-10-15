"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Info, FileText, ChevronRight } from "lucide-react";
import { TrainingProgram } from "@/types/training";
import { cn } from "@/lib/utils";

interface ProgramListItemProps {
  program: TrainingProgram;
  basePath?: string;
  defaultExpanded?: boolean;
}

export function ProgramListItem({
  program,
  basePath = "/dao-tao/dai-hoc",
  defaultExpanded = false,
}: ProgramListItemProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const isEngineer = program.degreeType === "ENGINEER";
  const detailHref = `${basePath}/${program.slug}`;

  const toggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  return (
    <article className="group bg-white dark:bg-slate-900 transition-colors duration-200">
      {/* 1. Main Row Header */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:px-6 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
        {/* Left: Sequential Index & Metadata */}
        <div className="min-w-0">
          <div className="flex items-start sm:items-center gap-3">
            {/* Number Index */}
            <span className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 font-mono text-[0.72rem] font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
              {program.displayOrder}
            </span>

            {/* Program Name & Code / Degree */}
            <div className="min-w-0">
              <Link
                href={detailHref}
                className="text-sm font-semibold text-school-navy dark:text-slate-100 hover:text-epu-orange dark:hover:text-amber-400 transition-colors leading-6 line-clamp-1"
                title={program.name}
              >
                {program.name}
              </Link>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Mã ngành:</span>
                  <span className="font-mono font-bold text-school-navy dark:text-slate-200 tabular-nums">
                    {program.code}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Bằng:</span>
                  <span
                    className={cn(
                      "font-medium px-2 py-0.5 rounded text-[11px]",
                      isEngineer
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold"
                        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold"
                    )}
                  >
                    {isEngineer ? "Kỹ sư" : "Cử nhân"}
                  </span>
                </div>

                {program.faculty && (
                  <span className="hidden md:inline text-slate-400 dark:text-slate-600">
                    • {program.faculty}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Toggle Accordion Info Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleExpand}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-lg border shadow-sm transition-all duration-200 cursor-pointer",
              isExpanded
                ? "bg-school-navy text-white border-school-navy dark:bg-slate-800 dark:text-amber-400 dark:border-slate-700 shadow-md"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-school-navy dark:text-slate-300 hover:-translate-y-0.5 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-epu-orange dark:hover:text-amber-400 hover:border-amber-400"
            )}
            aria-label={`Xem chi tiết nhanh ngành ${program.name}`}
            aria-expanded={isExpanded}
            aria-controls={`program-detail-${program.code}`}
            title={isExpanded ? "Đóng thông tin chi tiết" : "Xem thông tin chi tiết"}
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Expanded Accordion Drawer matching official EPU screenshot */}
      {isExpanded && (
        <div
          id={`program-detail-${program.code}`}
          className="px-6 py-5 bg-slate-50/70 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80 transition-all duration-200 animate-in fade-in-50 slide-in-from-top-2"
        >
          {/* Thời gian đào tạo */}
          <div className="mb-4">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">
              Thời gian đào tạo
            </span>
            <span className="text-sm font-semibold text-school-navy dark:text-slate-200 mt-1 block">
              {program.duration || (isEngineer ? "4,5 năm" : "4 năm")}
            </span>
          </div>

          {/* Chuyên ngành */}
          <div className="mb-4">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-2">
              Chuyên ngành
            </span>
            {program.specializations && program.specializations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                {program.specializations.map((spec, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-epu-orange shrink-0 mt-2" />
                    <span>{spec}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-epu-orange shrink-0 mt-2" />
                <span>{program.name}</span>
              </div>
            )}
          </div>

          {/* Tệp đính kèm button */}
          <div className="pt-2">
            <a
              href={program.attachmentUrl || program.originalAttachmentUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-colors group/btn"
            >
              <FileText className="w-4 h-4 text-rose-500 group-hover/btn:scale-110 transition-transform" />
              <span>Tệp đính kèm</span>
            </a>
          </div>
        </div>
      )}
    </article>
  );
}
