"use client";

import React from "react";
import Link from "next/link";
import { AdmissionMilestone } from "@/types/candidate";

interface AdmissionTimelineCardProps {
  milestones: AdmissionMilestone[];
}

export function AdmissionTimelineCard({ milestones }: AdmissionTimelineCardProps) {
  return (
    <div className="flex flex-col justify-between p-6 bg-white dark:bg-[#0A1730] border border-[#E3ECF8] dark:border-[#1E3250] rounded-2xl shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <h3 className="text-base font-bold text-[#0B1D49] dark:text-white">
          Mốc thời gian tuyển sinh 2026
        </h3>
        <Link
          href="/tuyensinh"
          className="text-xs font-semibold text-[#0866D9] dark:text-[#3B82F6] hover:underline"
        >
          Xem tất cả →
        </Link>
      </div>

      {/* Timeline items with vertical line */}
      <div className="relative py-3 flex-1 flex flex-col justify-around">
        {/* Continuous vertical connecting line */}
        <div className="absolute left-[7px] top-6 bottom-6 w-[2px] bg-slate-200 dark:bg-slate-700" />

        <div className="space-y-4">
          {milestones.map((milestone) => (
            <div key={milestone.id} className="relative flex items-center gap-3.5 group">
              {/* Dot with colored ring */}
              <div
                className="relative z-10 w-4 h-4 rounded-full border-2 border-white dark:border-[#0A1730] shadow-xs shrink-0 transition-transform group-hover:scale-125"
                style={{ backgroundColor: milestone.dotColor }}
              />

              {/* Date & Title */}
              <div className="flex items-center gap-4 flex-1">
                <span className="text-xs sm:text-sm font-bold text-[#0B1D49] dark:text-white min-w-[85px]">
                  {milestone.date}
                </span>
                <span className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] font-medium leading-tight">
                  {milestone.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
