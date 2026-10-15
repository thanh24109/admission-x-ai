"use client";

import React from "react";
import Link from "next/link";
import { User, FileText, Briefcase } from "lucide-react";
import { SupportTicket } from "@/types/candidate";
import { cn } from "@/lib/utils";

interface RecentSupportTicketsCardProps {
  tickets: SupportTicket[];
}

export function RecentSupportTicketsCard({ tickets }: RecentSupportTicketsCardProps) {
  const getIcon = (index: number) => {
    switch (index) {
      case 0:
        return {
          icon: User,
          bg: "bg-[#F3E8FF] dark:bg-purple-950/40",
          text: "text-[#7C3AED] dark:text-purple-400",
        };
      case 1:
        return {
          icon: FileText,
          bg: "bg-[#EBF3FE] dark:bg-blue-950/40",
          text: "text-[#0866D9] dark:text-[#3B82F6]",
        };
      default:
        return {
          icon: Briefcase,
          bg: "bg-[#FEF3C7] dark:bg-amber-950/40",
          text: "text-[#D97706] dark:text-amber-400",
        };
    }
  };

  const getStatusBadge = (variant: SupportTicket["statusVariant"], label: string) => {
    switch (variant) {
      case "warning":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF3C7] dark:bg-amber-950/60 text-[#D97706] dark:text-amber-300">
            {label}
          </span>
        );
      case "success":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#D1FAE5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-300">
            {label}
          </span>
        );
      case "muted":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {label}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col justify-between p-5 sm:p-6 bg-white dark:bg-[#0A1730] border border-[#E3ECF8] dark:border-[#1E3250] rounded-2xl shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
        <h3 className="text-base font-bold text-[#0B1D49] dark:text-white">
          Yêu cầu tư vấn gần đây
        </h3>
        <Link
          href="/candidate/support"
          className="text-xs font-semibold text-[#0866D9] dark:text-[#3B82F6] hover:underline"
        >
          Xem tất cả →
        </Link>
      </div>

      {/* Tickets list */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 flex-1 flex flex-col justify-between">
        {tickets.map((ticket, idx) => {
          const { icon: TicketIcon, bg, text } = getIcon(idx);

          return (
            <Link
              key={ticket.id}
              href={ticket.href}
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
                  <TicketIcon className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs sm:text-sm font-semibold text-[#0B1D49] dark:text-white truncate group-hover:text-[#0866D9] transition-colors">
                    {ticket.title}
                  </span>
                  <span className="text-[11px] sm:text-xs text-[#64748B] dark:text-[#94A3B8] truncate mt-0.5">
                    {ticket.createdAt}
                  </span>
                </div>
              </div>

              <div className="shrink-0 ml-2">
                {getStatusBadge(ticket.statusVariant, ticket.statusLabel)}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
