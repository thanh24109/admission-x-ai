"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PendingHandoverItem } from "@/types/admin";
import { cn } from "@/lib/utils";

interface PendingHandoversCardProps {
  handovers: PendingHandoverItem[];
}

export function PendingHandoversCard({ handovers }: PendingHandoversCardProps) {
  return (
    <div className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-[#101F38] border border-[#E3ECF8] dark:border-[#253B5B] shadow-sm h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#F0F5FD] dark:border-[#1E3252]">
        <h2 className="text-base font-bold text-[#07164F] dark:text-white">
          Handover chờ xử lý
        </h2>
        <Link
          href="/admin/handovers"
          className="inline-flex items-center text-xs font-semibold text-[#0866F5] dark:text-[#238BFF] hover:underline"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </div>

      {/* Handover List (5 items) */}
      <div className="divide-y divide-[#F0F5FD] dark:divide-[#1E3252] flex-1 flex flex-col justify-around py-1">
        {handovers.map((item) => {
          const isHigh = item.priority === "high";
          const isMedium = item.priority === "medium";

          return (
            <div
              key={item.id}
              className="flex items-center justify-between py-2.5 px-1 hover:bg-[#F0F5FD]/60 dark:hover:bg-[#142640]/50 rounded-lg transition-colors group"
            >
              {/* Left: Avatar Initials & Name/Question */}
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-full bg-[#0866F5] dark:bg-[#238BFF] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                  {item.initials}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#07164F] dark:text-white truncate group-hover:text-[#0866F5] dark:group-hover:text-[#238BFF] transition-colors">
                    {item.candidateName}
                  </p>
                  <p className="text-[11px] text-[#667DAA] dark:text-[#9CB1D3] truncate mt-0.5">
                    {item.question}
                  </p>
                </div>
              </div>

              {/* Right: Priority Badge & Time */}
              <div className="flex flex-col items-end shrink-0 ml-2">
                <span
                  className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-md",
                    isHigh
                      ? "bg-[#F43F5E]/10 text-[#F43F5E] dark:bg-[#FF5577]/15 dark:text-[#FF5577]"
                      : isMedium
                      ? "bg-[#F59E0B]/10 text-[#F59E0B] dark:bg-[#FFB547]/15 dark:text-[#FFB547]"
                      : "bg-[#0866F5]/10 text-[#0866F5] dark:bg-[#238BFF]/15 dark:text-[#238BFF]"
                  )}
                >
                  {isHigh ? "Ưu tiên cao" : isMedium ? "Ưu tiên" : "Bình thường"}
                </span>
                <span className="text-[10px] text-[#667DAA] dark:text-[#9CB1D3] mt-1">
                  {item.timeAgo}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
