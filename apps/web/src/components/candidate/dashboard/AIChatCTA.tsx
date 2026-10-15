"use client";

import React from "react";
import Link from "next/link";
import { Bot, ArrowRight } from "lucide-react";

export function AIChatCTA() {
  return (
    <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#EBF3FE] via-[#F2F7FE] to-[#E4EFFE] dark:from-[#0F2242] dark:via-[#132B52] dark:to-[#0F2242] border border-[#D4E5FA] dark:border-[#1F3D6B] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
      {/* Decorative Wave/Glow in Background */}
      <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-blue-300/20 dark:bg-blue-600/10 blur-2xl pointer-events-none" />

      {/* Left Icon & Text */}
      <div className="relative z-10 flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-[#1A335C] text-[#0866D9] dark:text-[#3B82F6] shadow-xs shrink-0 ring-4 ring-white/60 dark:ring-blue-900/30">
          <Bot className="w-6 h-6" />
        </div>

        <div className="flex flex-col">
          <h3 className="text-base sm:text-lg font-bold text-[#0B1D49] dark:text-white leading-tight">
            Bắt đầu trò chuyện với AI
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
            Đặt câu hỏi về ngành học, phương thức xét tuyển, học phí, học bổng...
          </p>
        </div>
      </div>

      {/* Right Action Button */}
      <div className="relative z-10 sm:self-center shrink-0">
        <Link
          href="/candidate/chat"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0866D9] hover:bg-[#0756B5] shadow-xs hover:shadow-md transition-all active:scale-[0.98] w-full sm:w-auto"
        >
          <span>Chat ngay</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
