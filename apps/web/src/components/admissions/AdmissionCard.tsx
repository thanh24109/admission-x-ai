"use client";

import React from "react";
import Link from "next/link";
import { AdmissionArticle } from "@/types/admissions";
import { cn } from "@/lib/utils";

interface AdmissionCardProps {
  article: AdmissionArticle;
}

export function AdmissionCard({ article }: AdmissionCardProps) {
  return (
    <Link
      href={`/post/${article.slug}`}
      className="group block rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-[0_2px_12px_rgba(15,23,42,0.03)] hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
    >
      {/* Title */}
      <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 group-hover:text-school-navy dark:group-hover:text-amber-400 transition-colors leading-relaxed">
        {article.title}
      </h3>

      {/* Footer info: Category Badge on left, Date on right */}
      <div className="mt-4 flex items-center justify-between gap-3">
        {/* Category Badge Pill */}
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ring-1 ring-slate-200/80 dark:ring-slate-700/80">
          {article.category}
        </span>

        {/* Formatted Date */}
        <span className="text-xs font-mono font-medium text-slate-400 dark:text-slate-500 tabular-nums">
          {article.displayDate}
        </span>
      </div>
    </Link>
  );
}
