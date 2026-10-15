"use client";

import React, { useState } from "react";
import { Calendar, ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardWelcomeProps {
  userName?: string;
  onDateRangeChange?: (range: string) => void;
}

export function DashboardWelcome({
  userName = "Nguyễn Văn A",
  onDateRangeChange,
}: DashboardWelcomeProps) {
  const [selectedRange, setSelectedRange] = useState("Tháng 10, 2026");

  const ranges = [
    { id: "today", label: "Hôm nay" },
    { id: "7days", label: "7 ngày qua" },
    { id: "30days", label: "30 ngày qua" },
    { id: "this_month", label: "Tháng 10, 2026" },
    { id: "custom", label: "Tùy chỉnh khoảng thời gian..." },
  ];

  const handleSelect = (range: { id: string; label: string }) => {
    setSelectedRange(range.label);
    if (onDateRangeChange) {
      onDateRangeChange(range.id);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      {/* Title & Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#07164F] dark:text-white flex items-center gap-2">
          Chào mừng trở lại, {userName} <span className="inline-block animate-wave">👋</span>
        </h1>
        <p className="text-sm text-[#667DAA] dark:text-[#9CB1D3] mt-1">
          Tổng quan tình hình hoạt động của Cổng thông tin tuyển sinh Trường Đại học Điện lực.
        </p>
      </div>

      {/* Date Filter Control matching reference */}
      <div className="shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-[#101F38] border border-[#E3ECF8] dark:border-[#253B5B] rounded-xl hover:border-[#0866F5] dark:hover:border-[#238BFF] shadow-sm transition-all text-left"
            >
              <div className="p-1.5 rounded-lg bg-[#F0F5FD] dark:bg-[#142640] text-[#0866F5] dark:text-[#238BFF]">
                <Calendar className="w-4 h-4" />
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-semibold text-[#667DAA] dark:text-[#9CB1D3] leading-none">
                  Thời gian
                </span>
                <span className="text-xs font-bold text-[#07164F] dark:text-white mt-1 leading-none">
                  {selectedRange}
                </span>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-[#667DAA] dark:text-[#9CB1D3] ml-1" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-[#101F38] border-[#E3ECF8] dark:border-[#253B5B] shadow-lg">
            {ranges.map((range) => (
              <DropdownMenuItem
                key={range.id}
                onClick={() => handleSelect(range)}
                className="flex items-center justify-between text-xs py-2 cursor-pointer text-[#07164F] dark:text-[#F1F6FF] hover:bg-[#F0F5FD] dark:hover:bg-[#142640]"
              >
                <span>{range.label}</span>
                {selectedRange === range.label && (
                  <Check className="w-3.5 h-3.5 text-[#0866F5] dark:text-[#238BFF]" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
