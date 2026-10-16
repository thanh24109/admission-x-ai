"use client";

import React, { useState, useRef, useEffect } from "react";
import { SendHorizonal, Paperclip, BookOpen, Mic, Loader2 } from "lucide-react";

interface ChatComposerProps {
  onSendMessage: (text: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  initialValue?: string;
}

export function ChatComposer({
  onSendMessage,
  isLoading = false,
  disabled = false,
  initialValue = "",
}: ChatComposerProps) {
  const [text, setText] = useState(initialValue);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialValue) {
      setText(initialValue);
      textareaRef.current?.focus();
    }
  }, [initialValue]);

  // Auto-resize textarea height as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  }, [text]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading || disabled) return;
    onSendMessage(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showDisabledTooltip = (msg: string) => {
    setTooltip(msg);
    setTimeout(() => setTooltip(null), 2500);
  };

  return (
    <div className="p-3 sm:p-4 bg-white dark:bg-[#0A1730] border-t border-[#E3ECF8] dark:border-[#1E3250]">
      {/* Tooltip feedback for in-progress features */}
      {tooltip && (
        <div className="mb-2 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 px-3 py-1.5 rounded-lg inline-block animate-in fade-in duration-150">
          {tooltip}
        </div>
      )}

      {/* Main Composer Box */}
      <div className="relative rounded-2xl border border-[#E3ECF8] dark:border-[#1E3250] bg-white dark:bg-[#071328] focus-within:border-[#0866D9] focus-within:ring-2 focus-within:ring-[#0866D9]/15 transition-all p-2.5 sm:p-3 shadow-xs">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập câu hỏi của bạn về tuyển sinh..."
          rows={1}
          disabled={disabled || isLoading}
          className="w-full resize-none bg-transparent text-xs sm:text-sm text-[#0B1D49] dark:text-white placeholder-[#94A3B8] focus:outline-none min-h-[38px] max-h-[140px] leading-relaxed pr-10"
        />

        {/* Toolbar & Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-1">
          {/* Left tools */}
          <div className="flex items-center gap-1 text-[#64748B] dark:text-[#94A3B8]">
            <button
              type="button"
              onClick={() => showDisabledTooltip("Tính năng tải đính kèm tệp sẽ sớm khả dụng.")}
              className="p-1.5 rounded-lg hover:text-[#0866D9] hover:bg-[#F4F8FD] dark:hover:bg-[#12223C] transition-colors"
              title="Đính kèm tệp tin"
              aria-label="Đính kèm tệp tin"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => showDisabledTooltip("Kho tài liệu tham khảo chính thức EPU.")}
              className="p-1.5 rounded-lg hover:text-[#0866D9] hover:bg-[#F4F8FD] dark:hover:bg-[#12223C] transition-colors"
              title="Tra cứu danh mục tài liệu"
              aria-label="Tra cứu danh mục tài liệu"
            >
              <BookOpen className="w-4 h-4" />
            </button>
          </div>

          {/* Right tools: Voice & Send */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => showDisabledTooltip("Tính năng nhận diện giọng nói đang phát triển.")}
              className="p-1.5 rounded-lg text-[#64748B] dark:text-[#94A3B8] hover:text-[#0866D9] hover:bg-[#F4F8FD] dark:hover:bg-[#12223C] transition-colors"
              title="Nhập bằng giọng nói"
              aria-label="Nhập bằng giọng nói"
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleSend}
              disabled={!text.trim() || isLoading || disabled}
              className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0866D9] hover:bg-[#0756B5] disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 shadow-xs hover:shadow-md transition-all active:scale-95 disabled:cursor-not-allowed"
              title="Gửi câu hỏi"
              aria-label="Gửi câu hỏi"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <SendHorizonal className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Helper Footer Hint */}
      <div className="mt-1.5 text-right">
        <span className="text-[11px] text-[#94A3B8]">
          Nhấn Enter để gửi, Shift + Enter để xuống dòng
        </span>
      </div>
    </div>
  );
}
