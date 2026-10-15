"use client";

import React, { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CandidateWelcomeHeaderProps {
  name: string;
  activeCycle?: string;
}

export function CandidateWelcomeHeader({
  name,
  activeCycle = "Năm 2026",
}: CandidateWelcomeHeaderProps) {
  const [selectedCycle, setSelectedCycle] = useState(activeCycle);
  const cycles = ["Năm 2026", "Năm 2025 (Đã kết thúc)", "Năm 2024 (Lưu trữ)"];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* 1. Left Welcome Title & Subtitle */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0B1D49] dark:text-white tracking-tight flex items-center gap-2">
          Chào {name} <span>👋</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] mt-1 leading-relaxed">
          Khám phá ngành học, thông tin tuyển sinh và nhận tư vấn cùng AI của Trường Đại học Điện lực.
        </p>
      </div>

      {/* 2. Right Cycle Selector */}
      <div className="self-start sm:self-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-[#0A1730] border border-[#E3ECF8] dark:border-[#1E3250] rounded-2xl shadow-2xs hover:border-[#0866D9]/40 hover:bg-[#F4F8FD] dark:hover:bg-[#12223C] transition-all text-left focus:outline-none"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#EBF3FE] dark:bg-[#152D52] text-[#0866D9] dark:text-[#3B82F6] shrink-0">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] leading-tight">
                  Kỳ tuyển sinh
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#0B1D49] dark:text-white leading-tight">
                  {selectedCycle}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 ml-1 text-[#94A3B8]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-52 p-1.5 bg-white dark:bg-[#0F1E38] border-[#E3ECF8] dark:border-[#1E3250] shadow-lg rounded-xl"
          >
            {cycles.map((cycle) => (
              <DropdownMenuItem
                key={cycle}
                onClick={() => setSelectedCycle(cycle)}
                className="text-xs font-medium text-[#0B1D49] dark:text-slate-200 cursor-pointer rounded-lg hover:bg-[#F4F8FD] dark:hover:bg-[#172D4D]"
              >
                {cycle}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
