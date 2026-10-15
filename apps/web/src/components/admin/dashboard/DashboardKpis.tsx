"use client";

import React from "react";
import { Users, MessageSquare, Headphones, FileText, BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { DashboardKpis as DashboardKpisType } from "@/types/admin";
import { cn } from "@/lib/utils";

interface DashboardKpisProps {
  data: DashboardKpisType;
}

export function DashboardKpis({ data }: DashboardKpisProps) {
  const cards = [
    {
      id: "users",
      title: "Tổng người dùng",
      value: data.totalUsers.total.toLocaleString("vi-VN"),
      growth: data.totalUsers.growth,
      isPositive: true,
      subtext: `Thí sinh: ${data.totalUsers.candidates.toLocaleString("vi-VN")}  •  Cán bộ: ${data.totalUsers.counselors}  •  Quản trị: ${data.totalUsers.admins}`,
      icon: Users,
      iconBg: "bg-blue-50 text-[#0866F5] dark:bg-blue-950/60 dark:text-[#238BFF]",
    },
    {
      id: "conversations",
      title: "Tổng hội thoại AI",
      value: data.aiConversations.total.toLocaleString("vi-VN"),
      growth: data.aiConversations.growth,
      isPositive: true,
      subtext: `Trả lời thành công: ${data.aiConversations.successful.toLocaleString("vi-VN")} (${data.aiConversations.successRate})`,
      icon: MessageSquare,
      iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
    },
    {
      id: "consultation",
      title: "Yêu cầu tư vấn",
      value: data.consultationRequests.total.toLocaleString("vi-VN"),
      growth: data.consultationRequests.growth,
      isPositive: true,
      subtext: `Đã xử lý: ${data.consultationRequests.resolved} (${data.consultationRequests.resolutionRate})`,
      icon: Headphones,
      iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
    },
    {
      id: "documents",
      title: "Tài liệu tuyển sinh",
      value: data.admissionsDocuments.total.toLocaleString("vi-VN"),
      growth: data.admissionsDocuments.growth,
      isPositive: true,
      subtext: `Đã xuất bản: ${data.admissionsDocuments.published}  •  Chờ duyệt: ${data.admissionsDocuments.pending}`,
      icon: FileText,
      iconBg: "bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400",
    },
    {
      id: "accuracy",
      title: "Độ chính xác AI",
      value: data.aiAccuracy.rate,
      growth: data.aiAccuracy.growth,
      isPositive: true,
      subtext: data.aiAccuracy.evaluatedDescription,
      icon: BarChart3,
      iconBg: "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="flex flex-col justify-between p-4 rounded-2xl bg-white dark:bg-[#101F38] border border-[#E3ECF8] dark:border-[#253B5B] shadow-sm hover:shadow-md transition-all duration-200"
          >
            {/* Top row: Icon + Title */}
            <div className="flex items-center gap-3">
              <div className={cn("p-2.5 rounded-xl shrink-0", card.iconBg)}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-[#667DAA] dark:text-[#9CB1D3] truncate">
                {card.title}
              </span>
            </div>

            {/* Middle: Big Value + Growth */}
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-2xl font-bold tracking-tight text-[#07164F] dark:text-white">
                {card.value}
              </span>
              <span
                className={cn(
                  "inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded",
                  card.isPositive
                    ? "text-[#10B981] dark:text-[#00D49A] bg-emerald-50/80 dark:bg-emerald-950/40"
                    : "text-[#F43F5E] dark:text-[#FF5577] bg-rose-50/80 dark:bg-rose-950/40"
                )}
              >
                {card.isPositive ? (
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                )}
                {card.growth}
              </span>
            </div>

            {/* Bottom: Subtext */}
            <div className="mt-3 pt-2.5 border-t border-[#F0F5FD] dark:border-[#1E3252]">
              <p className="text-[11px] text-[#667DAA] dark:text-[#9CB1D3] leading-tight truncate">
                {card.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
