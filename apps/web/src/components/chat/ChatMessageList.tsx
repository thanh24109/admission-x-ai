"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Bot,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  MoreHorizontal,
  Sparkles,
} from "lucide-react";
import { ChatMessage } from "@/types/chat";
import { ChatCitationCard } from "./ChatCitationCard";
import { candidateProfile } from "@/data/candidateMockData";
import { useMockAuth } from "@/lib/mockAuth";

interface ChatMessageListProps {
  messages: ChatMessage[];
  isGenerating?: boolean;
  onSelectChip: (chip: string) => void;
  onFeedback?: (messageId: string, type: "like" | "dislike") => void;
}

export function ChatMessageList({
  messages,
  isGenerating = false,
  onSelectChip,
  onFeedback,
}: ChatMessageListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isMock, user } = useMockAuth();

  const userAvatar = isMock && user?.avatarUrl ? user.avatarUrl : candidateProfile.avatarUrl;
  const userName = isMock && user?.name ? user.name : candidateProfile.name;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  const handleCopy = (message: ChatMessage) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(message.content);
      setCopiedId(message.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      {messages.map((message) => {
        const isAssistant = message.role === "assistant";

        if (isAssistant) {
          return (
            <div key={message.id} className="flex items-start gap-3 max-w-3xl group">
              {/* Robot Avatar */}
              <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#EBF3FE] dark:bg-[#122A4E] text-[#0866D9] dark:text-[#3B82F6] shrink-0 shadow-2xs mt-1">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>

              {/* Message Bubble + Actions */}
              <div className="flex flex-col min-w-0 flex-1">
                <div className="p-4 sm:p-5 rounded-2xl rounded-tl-xs bg-white dark:bg-[#0A1730] border border-[#E3ECF8] dark:border-[#1E3250] shadow-2xs text-xs sm:text-sm text-[#0B1D49] dark:text-slate-100 leading-relaxed space-y-3">
                  {/* Message paragraphs */}
                  <div className="whitespace-pre-line leading-relaxed font-normal">
                    {message.content}
                  </div>

                  {/* Citations Card */}
                  {message.citations && message.citations.length > 0 && (
                    <ChatCitationCard
                      citation={message.citations[0]}
                      extraSources={message.extraSources}
                    />
                  )}
                </div>

                {/* Question Chips if present */}
                {message.chips && message.chips.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap mt-3">
                    {message.chips.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => onSelectChip(chip)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F0F6FD] dark:bg-[#122440] hover:bg-[#EBF3FE] dark:hover:bg-[#172D4D] text-[#0866D9] dark:text-[#3B82F6] border border-[#D8E6F8] dark:border-[#1F3A66] hover:border-[#0866D9]/50 shadow-2xs transition-all active:scale-95 cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}

                {/* Message Actions Row (Like, Dislike, Copy, Time) */}
                <div className="flex items-center gap-3 mt-2 px-1 text-slate-400 dark:text-slate-500">
                  <span className="text-[11px]">{message.timestamp}</span>

                  <div className="flex items-center gap-1.5 ml-2">
                    <button
                      type="button"
                      onClick={() => onFeedback?.(message.id, "like")}
                      className={`p-1 rounded-md transition-colors ${
                        message.feedback === "like"
                          ? "text-[#0866D9] bg-blue-50 dark:bg-blue-950/40"
                          : "hover:text-[#0B1D49] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                      title="Hữu ích"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onFeedback?.(message.id, "dislike")}
                      className={`p-1 rounded-md transition-colors ${
                        message.feedback === "dislike"
                          ? "text-rose-600 bg-rose-50 dark:bg-rose-950/40"
                          : "hover:text-[#0B1D49] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                      title="Chưa hữu ích"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(message)}
                      className="p-1 rounded-md hover:text-[#0B1D49] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Sao chép nội dung"
                    >
                      {copiedId === message.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        // User message
        return (
          <div key={message.id} className="flex items-start justify-end gap-3 max-w-2xl ml-auto">
            <div className="flex flex-col items-end min-w-0">
              <div className="p-3.5 sm:p-4 rounded-2xl rounded-tr-xs bg-[#EBF3FE] dark:bg-[#122A4E] text-[#0B1D49] dark:text-white text-xs sm:text-sm font-medium shadow-2xs leading-relaxed max-w-xl">
                {message.content}
              </div>
              <span className="text-[11px] text-[#94A3B8] mt-1 px-1">
                {message.timestamp}
              </span>
            </div>

            {/* Candidate User Avatar */}
            <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 ring-2 ring-[#0866D9]/20 shadow-2xs mt-1">
              <Image
                src={userAvatar}
                alt={userName}
                width={32}
                height={32}
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        );
      })}

      {/* AI Generating Indicator */}
      {isGenerating && (
        <div className="flex items-start gap-3 max-w-2xl animate-in fade-in duration-200">
          <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#EBF3FE] dark:bg-[#122A4E] text-[#0866D9] dark:text-[#3B82F6] shrink-0 shadow-2xs">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="p-4 rounded-2xl rounded-tl-xs bg-white dark:bg-[#0A1730] border border-[#E3ECF8] dark:border-[#1E3250] shadow-2xs text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0866D9] animate-spin" />
            <span>Trợ lý AI đang tra cứu cơ sở dữ liệu tuyển sinh EPU...</span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
