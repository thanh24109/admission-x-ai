"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Lightbulb,
  RotateCw,
  ChevronRight,
  FileText,
  Headphones,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { SuggestionTabKey, RelatedDocumentItem } from "@/types/chat";
import { suggestionSets, chatRelatedDocuments } from "@/data/chatMockData";

interface ChatContextSidebarProps {
  onSelectQuestion: (question: string) => void;
  className?: string;
}

export function ChatContextSidebar({
  onSelectQuestion,
  className = "",
}: ChatContextSidebarProps) {
  const [activeTab, setActiveTab] = useState<SuggestionTabKey>("popular");
  const [setIndex, setSetIndex] = useState(0);

  const tabs: { key: SuggestionTabKey; label: string }[] = [
    { key: "popular", label: "Phổ biến" },
    { key: "by_major", label: "Theo ngành" },
    { key: "admissions", label: "Tuyển sinh" },
    { key: "tuition", label: "Học phí" },
  ];

  const currentSetList = suggestionSets[activeTab] || suggestionSets.popular;
  const currentQuestions = currentSetList[setIndex % currentSetList.length] || [];

  const handleRotateSuggestions = () => {
    setSetIndex((prev) => prev + 1);
  };

  return (
    <div className={`flex flex-col gap-5 overflow-y-auto ${className}`}>
      {/* ========================================================= */}
      {/* Panel A — Gợi ý câu hỏi                                    */}
      {/* ========================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0A1730] border border-[#E3ECF8] dark:border-[#1E3250] shadow-2xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-[#0B1D49] dark:text-white">
              Gợi ý câu hỏi
            </h3>
          </div>
          <button
            type="button"
            onClick={handleRotateSuggestions}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0866D9] dark:text-[#3B82F6] hover:underline cursor-pointer"
          >
            <RotateCw className="w-3 h-3" />
            <span>Đổi gợi ý</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800/60 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                setSetIndex(0);
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === tab.key
                  ? "text-[#0866D9] dark:text-[#3B82F6] bg-[#EBF3FE] dark:bg-[#122A4E]"
                  : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#0B1D49] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Questions list */}
        <div className="mt-3 space-y-2">
          {currentQuestions.map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={() => onSelectQuestion(q.text)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFD] dark:bg-[#12223C] border border-[#EBF2FA] dark:border-[#1E3250] hover:border-[#0866D9]/40 hover:bg-[#EBF3FE] dark:hover:bg-[#172D4D] text-left text-xs font-medium text-[#0B1D49] dark:text-slate-200 transition-all group cursor-pointer"
            >
              <span className="truncate pr-2 group-hover:text-[#0866D9] transition-colors">
                {q.text}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] shrink-0 group-hover:text-[#0866D9] group-hover:translate-x-0.5 transition-all" />
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* Panel B — Tài liệu liên quan                               */}
      {/* ========================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0A1730] border border-[#E3ECF8] dark:border-[#1E3250] shadow-2xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0866D9]" />
            <h3 className="text-sm font-bold text-[#0B1D49] dark:text-white">
              Tài liệu liên quan
            </h3>
          </div>
          <Link
            href="/candidate/documents"
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#0866D9] dark:text-[#3B82F6] hover:underline"
          >
            <span>Xem thêm</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Document items */}
        <div className="mt-3 space-y-2.5">
          {chatRelatedDocuments.map((doc) => {
            const isPdf = doc.fileType === "pdf";

            return (
              <Link
                key={doc.id}
                href={doc.downloadUrl || "/tuyensinh"}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F4F8FD] dark:hover:bg-[#12223C] transition-colors group"
              >
                {/* File Badge */}
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded-md font-bold text-[9px] uppercase text-white shrink-0 shadow-2xs ${
                    isPdf ? "bg-[#EF4444]" : "bg-[#2563EB]"
                  }`}
                >
                  {isPdf ? "PDF" : "DOC"}
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold text-[#0B1D49] dark:text-white truncate group-hover:text-[#0866D9] transition-colors">
                    {doc.title}
                  </span>
                  <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] truncate">
                    {doc.source} • {doc.fileSize}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* Panel C — Counselor Handover CTA                           */}
      {/* ========================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#EBF3FE] via-[#F2F7FE] to-[#E3EFFE] dark:from-[#102342] dark:via-[#132A4E] dark:to-[#0C1A32] border border-[#D5E4F8] dark:border-[#1E365E] shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#DCEBFE] dark:bg-[#1A335C] text-[#0866D9] dark:text-[#3B82F6] shrink-0 shadow-2xs">
            <Headphones className="w-5 h-5" />
          </div>

          <div className="flex flex-col">
            <h4 className="text-sm font-bold text-[#0B1D49] dark:text-white leading-tight">
              Cần tư vấn chuyên sâu?
            </h4>
            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1 leading-relaxed">
              Nếu AI chưa thể giải đáp đầy đủ, bạn có thể tạo yêu cầu tư vấn để được cán bộ tuyển sinh hỗ trợ.
            </p>
          </div>
        </div>

        <Link
          href="/candidate/support"
          className="mt-3.5 inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl border border-[#0866D9] bg-white dark:bg-[#102340] text-[#0866D9] dark:text-[#3B82F6] hover:bg-[#0866D9] hover:text-white text-xs font-bold transition-all shadow-2xs group"
        >
          <span>Tạo yêu cầu tư vấn</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
