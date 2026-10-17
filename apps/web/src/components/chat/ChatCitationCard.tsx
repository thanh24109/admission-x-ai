"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ExternalLink, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { ChatCitation } from "@/types/chat";

interface ChatCitationCardProps {
  citation: ChatCitation;
  extraSources?: string[];
}

export function ChatCitationCard({ citation, extraSources = [] }: ChatCitationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasSafeUrl = Boolean(citation.url && citation.url.trim());
  const isExternalUrl = Boolean(citation.url && citation.url.startsWith("http"));

  // Format secondary metadata without manufacturing fake page or size labels
  const metaParts: string[] = [];
  if (citation.page && citation.page.trim()) {
    metaParts.push(citation.page.trim());
  }
  if (citation.fileSize && citation.fileSize.trim()) {
    metaParts.push(citation.fileSize.trim());
  }
  const secondaryMeta = metaParts.length > 0 ? metaParts.join(" • ") : citation.source;

  return (
    <div className="mt-3.5 space-y-2">
      {/* 1. Main Document Citation Card */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFD] dark:bg-[#12223C] border border-[#E3ECF8] dark:border-[#1E3250] hover:border-[#0866D9]/40 transition-all group">
        <div className="flex items-center gap-3 min-w-0">
          {/* PDF Badge Icon */}
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#EF4444] text-white font-bold text-[10px] tracking-wider uppercase shrink-0 shadow-2xs">
            {citation.fileType === "pdf" ? "PDF" : "DOC"}
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-sm font-semibold text-[#0B1D49] dark:text-white truncate group-hover:text-[#0866D9] transition-colors">
              {citation.title}
            </span>
            <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] truncate">
              {secondaryMeta}
            </span>
          </div>
        </div>

        {/* Action: Only render clickable link if an authentic URL is present */}
        {hasSafeUrl && citation.url ? (
          isExternalUrl ? (
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E3ECF8] dark:border-[#1E3250] bg-white dark:bg-[#0A1730] text-[#0866D9] dark:text-[#3B82F6] text-xs font-semibold hover:bg-[#EBF3FE] dark:hover:bg-[#152D52] shadow-2xs transition-colors shrink-0 ml-3"
            >
              <span>Xem tài liệu</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <Link
              href={citation.url}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E3ECF8] dark:border-[#1E3250] bg-white dark:bg-[#0A1730] text-[#0866D9] dark:text-[#3B82F6] text-xs font-semibold hover:bg-[#EBF3FE] dark:hover:bg-[#152D52] shadow-2xs transition-colors shrink-0 ml-3"
            >
              <span>Xem tài liệu</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )
        ) : (
          <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md shrink-0 ml-3 font-medium">
            Tài liệu đối chiếu
          </span>
        )}
      </div>

      {/* 2. Expandable Additional Sources */}
      {extraSources.length > 0 && (
        <div className="text-xs">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] hover:text-[#0866D9] dark:hover:text-[#3B82F6] transition-colors cursor-pointer py-1"
          >
            <span>Các nguồn tham khảo khác ({extraSources.length})</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {isExpanded && (
            <div className="mt-1.5 pl-3 border-l-2 border-blue-200 dark:border-blue-900 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
              {extraSources.map((source, index) => (
                <div key={index} className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                  <FileText className="w-3 h-3 text-[#0866D9] shrink-0" />
                  <span className="truncate">{source}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
