"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Download, FileText, Check } from "lucide-react";
import { UsefulDocument } from "@/types/candidate";

interface UsefulDocumentsCardProps {
  documents: UsefulDocument[];
}

export function UsefulDocumentsCard({ documents }: UsefulDocumentsCardProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = (doc: UsefulDocument) => {
    setDownloadingId(doc.id);
    setTimeout(() => {
      setDownloadingId(null);
    }, 1200);
  };

  return (
    <div className="flex flex-col justify-between p-5 sm:p-6 bg-white dark:bg-[#0A1730] border border-[#E3ECF8] dark:border-[#1E3250] rounded-2xl shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
        <h3 className="text-base font-bold text-[#0B1D49] dark:text-white">
          Tài liệu hữu ích dành cho bạn
        </h3>
        <Link
          href="/candidate/documents"
          className="text-xs font-semibold text-[#0866D9] dark:text-[#3B82F6] hover:underline"
        >
          Xem tất cả →
        </Link>
      </div>

      {/* Documents list */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 flex-1 flex flex-col justify-between">
        {documents.map((doc) => {
          const isPdf = doc.fileType === "pdf";
          const isDownloading = downloadingId === doc.id;

          return (
            <div
              key={doc.id}
              className="flex items-center justify-between py-2.5 px-1.5 -mx-1.5 rounded-xl hover:bg-[#F4F8FD] dark:hover:bg-[#12223C] transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* File Type Badge (Red for PDF, Blue for DOCX) */}
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 font-bold text-[10px] uppercase shadow-2xs ${
                    isPdf
                      ? "bg-[#EF4444] text-white"
                      : "bg-[#2563EB] text-white"
                  }`}
                >
                  {doc.fileType}
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-xs sm:text-sm font-semibold text-[#0B1D49] dark:text-white truncate group-hover:text-[#0866D9] transition-colors">
                    {doc.title}
                  </span>
                  <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] truncate mt-0.5">
                    {doc.meta}
                  </span>
                </div>
              </div>

              {/* Download Action */}
              <button
                type="button"
                onClick={() => handleDownload(doc)}
                className="p-2 rounded-lg text-slate-400 hover:text-[#0866D9] dark:hover:text-[#3B82F6] hover:bg-white dark:hover:bg-[#172D4D] transition-colors shrink-0 ml-2"
                title={`Tải về ${doc.title}`}
                aria-label={`Tải xuống tài liệu ${doc.title}`}
              >
                {isDownloading ? (
                  <Check className="w-4 h-4 text-emerald-600 animate-in fade-in" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
