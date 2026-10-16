"use client";

import React, { useState } from "react";
import { Bot, RotateCcw, Share2, MoreHorizontal, Check, Trash2, Copy, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatHeaderProps {
  onNewConversation: () => void;
  onClearHistory?: () => void;
}

export function ChatHeader({ onNewConversation, onClearHistory }: ChatHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-[#0A1730] border-b border-[#E3ECF8] dark:border-[#1E3250] transition-colors">
      {/* 1. Left: Robot Icon, Title, Status & Subtitle */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#EBF3FE] dark:bg-[#122A4E] text-[#0866D9] dark:text-[#3B82F6] shrink-0 shadow-2xs">
          <Bot className="w-5 h-5" />
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-sm sm:text-base font-bold text-[#0B1D49] dark:text-white truncate">
              Trợ lý Tuyển sinh AI — EPU
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Đang hoạt động</span>
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-[#64748B] dark:text-[#94A3B8] truncate mt-0.5">
            Trả lời dựa trên thông tin chính thức của Trường Đại học Điện lực
          </p>
        </div>
      </div>

      {/* 2. Right: Action Buttons */}
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {/* New Conversation Button */}
        <button
          type="button"
          onClick={onNewConversation}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E3ECF8] dark:border-[#1E3250] bg-white dark:bg-[#12223C] hover:bg-[#F4F8FD] dark:hover:bg-[#172D4D] text-[#0B1D49] dark:text-white text-xs font-semibold shadow-2xs transition-colors"
          title="Bắt đầu phiên hội thoại mới"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#0866D9] dark:text-[#3B82F6]" />
          <span>Hội thoại mới</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E3ECF8] dark:border-[#1E3250] bg-white dark:bg-[#12223C] hover:bg-[#F4F8FD] dark:hover:bg-[#172D4D] text-[#0B1D49] dark:text-white text-xs font-semibold shadow-2xs transition-colors"
          title="Sao chép liên kết đoạn hội thoại"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600">Đã chép</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8]" />
              <span>Chia sẻ</span>
            </>
          )}
        </button>

        {/* More Options Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="p-2 rounded-xl border border-[#E3ECF8] dark:border-[#1E3250] bg-white dark:bg-[#12223C] hover:bg-[#F4F8FD] dark:hover:bg-[#172D4D] text-[#64748B] dark:text-[#94A3B8] hover:text-[#0B1D49] dark:hover:text-white transition-colors"
              aria-label="Tùy chọn khác"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 p-1.5 bg-white dark:bg-[#0F1E38] border-[#E3ECF8] dark:border-[#1E3250] shadow-lg rounded-xl text-xs"
          >
            <DropdownMenuItem
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 cursor-pointer rounded-lg hover:bg-[#F4F8FD] dark:hover:bg-[#172D4D]"
            >
              <Copy className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Sao chép liên kết</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onNewConversation}
              className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 cursor-pointer rounded-lg hover:bg-[#F4F8FD] dark:hover:bg-[#172D4D]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0866D9]" />
              <span>Làm mới hội thoại</span>
            </DropdownMenuItem>
            {onClearHistory && (
              <DropdownMenuItem
                onClick={onClearHistory}
                className="flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 cursor-pointer rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa lịch sử chat</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
