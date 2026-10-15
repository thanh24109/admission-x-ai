"use client";

import React from "react";
import Link from "next/link";
import {
  FileText,
  UserPlus,
  Sliders,
  MessageSquare,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { RecentActivityItem, ActivityType } from "@/types/admin";
import { cn } from "@/lib/utils";

interface RecentActivitiesCardProps {
  activities: RecentActivityItem[];
}

const activityConfig: Record<
  ActivityType,
  { icon: React.ElementType; bg: string; text: string }
> = {
  document: {
    icon: FileText,
    bg: "bg-emerald-50 dark:bg-emerald-950/60",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  user: {
    icon: UserPlus,
    bg: "bg-blue-50 dark:bg-blue-950/60",
    text: "text-[#0866F5] dark:text-[#238BFF]",
  },
  ai_config: {
    icon: Sliders,
    bg: "bg-purple-50 dark:bg-purple-950/60",
    text: "text-purple-600 dark:text-purple-400",
  },
  handover: {
    icon: MessageSquare,
    bg: "bg-amber-50 dark:bg-amber-950/60",
    text: "text-amber-600 dark:text-amber-400",
  },
  evaluation: {
    icon: BarChart3,
    bg: "bg-cyan-50 dark:bg-cyan-950/60",
    text: "text-cyan-600 dark:text-cyan-400",
  },
};

export function RecentActivitiesCard({ activities }: RecentActivitiesCardProps) {
  return (
    <div className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-[#101F38] border border-[#E3ECF8] dark:border-[#253B5B] shadow-sm h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#F0F5FD] dark:border-[#1E3252]">
        <h2 className="text-base font-bold text-[#07164F] dark:text-white">
          Hoạt động gần đây
        </h2>
        <Link
          href="/admin/logs/activities"
          className="inline-flex items-center text-xs font-semibold text-[#0866F5] dark:text-[#238BFF] hover:underline"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </div>

      {/* Activity List (5 items) */}
      <div className="divide-y divide-[#F0F5FD] dark:divide-[#1E3252] flex-1 flex flex-col justify-around py-1">
        {activities.map((item) => {
          const conf = activityConfig[item.type] || activityConfig.document;
          const Icon = conf.icon;

          return (
            <div
              key={item.id}
              className="flex items-center justify-between py-2.5 px-1 hover:bg-[#F0F5FD]/60 dark:hover:bg-[#142640]/50 rounded-lg transition-colors group"
            >
              {/* Left: Icon & Description */}
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className={cn("p-2 rounded-lg shrink-0", conf.bg, conf.text)}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#07164F] dark:text-white truncate group-hover:text-[#0866F5] dark:group-hover:text-[#238BFF] transition-colors">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-[#667DAA] dark:text-[#9CB1D3] truncate mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Right: Timestamp */}
              <div className="shrink-0 text-right">
                <span className="text-[10px] text-[#667DAA] dark:text-[#9CB1D3] font-medium whitespace-nowrap">
                  {item.timestamp}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
