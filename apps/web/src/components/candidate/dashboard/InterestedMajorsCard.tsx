"use client";

import React from "react";
import Link from "next/link";
import { Zap, Laptop, Briefcase, ChevronRight } from "lucide-react";
import { InterestedMajor } from "@/types/candidate";
import { cn } from "@/lib/utils";

interface InterestedMajorsCardProps {
  majors: InterestedMajor[];
}

export function InterestedMajorsCard({ majors }: InterestedMajorsCardProps) {
  const getIcon = (index: number) => {
    switch (index) {
      case 0:
        return {
          icon: Zap,
          bg: "bg-[#F3E8FF] dark:bg-purple-950/40",
          text: "text-[#7C3AED] dark:text-purple-400",
        };
      case 1:
        return {
          icon: Laptop,
          bg: "bg-[#FFE4E6] dark:bg-rose-950/40",
          text: "text-[#E11D48] dark:text-rose-400",
        };
      default:
        return {
          icon: Briefcase,
          bg: "bg-[#FEF3C7] dark:bg-amber-950/40",
          text: "text-[#D97706] dark:text-amber-400",
        };
    }
  };

  return (
    <div className="flex flex-col justify-between p-5 sm:p-6 bg-white dark:bg-[#0A1730] border border-[#E3ECF8] dark:border-[#1E3250] rounded-2xl shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
        <h3 className="text-base font-bold text-[#0B1D49] dark:text-white">
          Ngành quan tâm của bạn
        </h3>
        <Link
          href="/candidate/interests"
          className="text-xs font-semibold text-[#0866D9] dark:text-[#3B82F6] hover:underline"
        >
          Xem tất cả →
        </Link>
      </div>

      {/* Majors list */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 flex-1 flex flex-col justify-between">
        {majors.map((major, idx) => {
          const { icon: MajorIcon, bg, text } = getIcon(idx);

          return (
            <Link
              key={major.id}
              href={major.href}
              className="flex items-center justify-between py-3.5 px-1.5 -mx-1.5 rounded-xl hover:bg-[#F4F8FD] dark:hover:bg-[#12223C] transition-all group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-xl shrink-0 transition-transform group-hover:scale-105",
                    bg,
                    text
                  )}
                >
                  <MajorIcon className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs sm:text-sm font-semibold text-[#0B1D49] dark:text-white truncate group-hover:text-[#0866D9] transition-colors">
                    {major.name}
                  </span>
                  <span className="text-[11px] sm:text-xs text-[#64748B] dark:text-[#94A3B8] truncate mt-0.5">
                    Mã ngành: {major.code} | {major.department}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#94A3B8] shrink-0 group-hover:text-[#0866D9] group-hover:translate-x-0.5 transition-all" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
