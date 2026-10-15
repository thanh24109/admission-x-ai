"use client";

import React from "react";
import Link from "next/link";
import {
  MessageSquare,
  Heart,
  FileText,
  CalendarDays,
  Bookmark,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { CandidateStatItem } from "@/types/candidate";
import { cn } from "@/lib/utils";

interface CandidateStatCardsProps {
  stats: CandidateStatItem[];
}

export function CandidateStatCards({ stats }: CandidateStatCardsProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "MessageSquare":
        return MessageSquare;
      case "Heart":
        return Heart;
      case "FileText":
        return FileText;
      case "CalendarDays":
        return CalendarDays;
      case "Bookmark":
        return Bookmark;
      default:
        return MessageSquare;
    }
  };

  const getColorClasses = (scheme: CandidateStatItem["colorScheme"]) => {
    switch (scheme) {
      case "blue":
        return {
          bg: "bg-[#EBF3FE] dark:bg-[#152D52]",
          text: "text-[#0866D9] dark:text-[#3B82F6]",
        };
      case "rose":
        return {
          bg: "bg-[#FDF2F4] dark:bg-rose-950/40",
          text: "text-[#E11D48] dark:text-rose-400",
        };
      case "emerald":
        return {
          bg: "bg-[#EDFAF3] dark:bg-emerald-950/40",
          text: "text-[#059669] dark:text-emerald-400",
        };
      case "orange":
        return {
          bg: "bg-[#FFF6ED] dark:bg-amber-950/40",
          text: "text-[#EA580C] dark:text-amber-400",
        };
      case "purple":
        return {
          bg: "bg-[#F5F0FF] dark:bg-purple-950/40",
          text: "text-[#7C3AED] dark:text-purple-400",
        };
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
      {stats.map((stat) => {
        const Icon = getIcon(stat.icon);
        const color = getColorClasses(stat.colorScheme);

        return (
          <div
            key={stat.id}
            className="flex flex-col justify-between p-4 bg-white dark:bg-[#0A1730] border border-[#E3ECF8] dark:border-[#1E3250] rounded-2xl shadow-2xs hover:shadow-sm hover:border-[#0866D9]/30 transition-all group"
          >
            {/* Top row: Icon & Title/Value */}
            <div className="flex items-start gap-3.5">
              <div
                className={cn(
                  "flex items-center justify-center w-11 h-11 rounded-xl shrink-0 transition-transform group-hover:scale-105",
                  color.bg,
                  color.text
                )}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8] truncate leading-tight">
                  {stat.title}
                </span>
                <span className="text-2xl font-bold text-[#0B1D49] dark:text-white mt-1 leading-tight">
                  {stat.value}
                </span>
              </div>
            </div>

            {/* Bottom row: Badge or Link */}
            <div className="mt-3.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center text-xs">
              {stat.badgeText && (
                <div
                  className={cn(
                    "flex items-center gap-1 font-medium",
                    stat.badgeType === "positive"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {stat.badgeType === "positive" ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                  <span>{stat.badgeText}</span>
                </div>
              )}

              {stat.linkText && stat.href && (
                <Link
                  href={stat.href}
                  className="font-medium text-[#0866D9] dark:text-[#3B82F6] hover:underline flex items-center gap-0.5 group/link"
                >
                  <span>{stat.linkText}</span>
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
