"use client";

import React from "react";
import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";
import { RecentDocumentItem } from "@/types/admin";
import { cn } from "@/lib/utils";

interface RecentDocumentsCardProps {
  documents: RecentDocumentItem[];
}

export function RecentDocumentsCard({ documents }: RecentDocumentsCardProps) {
  return (
    <div className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-[#101F38] border border-[#E3ECF8] dark:border-[#253B5B] shadow-sm h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#F0F5FD] dark:border-[#1E3252]">
        <h2 className="text-base font-bold text-[#07164F] dark:text-white">
          Tài liệu tuyển sinh
        </h2>
        <Link
          href="/admin/documents"
          className="inline-flex items-center text-xs font-semibold text-[#0866F5] dark:text-[#238BFF] hover:underline"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </div>

      {/* Document List (5 items) */}
      <div className="divide-y divide-[#F0F5FD] dark:divide-[#1E3252] flex-1 flex flex-col justify-around py-1">
        {documents.map((doc) => {
          const isPdf = doc.fileType === "pdf";
          const isPublished = doc.status === "published";

          return (
            <div
              key={doc.id}
              className="flex items-center justify-between py-2.5 px-1 hover:bg-[#F0F5FD]/60 dark:hover:bg-[#142640]/50 rounded-lg transition-colors group"
            >
              {/* Left: Icon & Title */}
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div
                  className={cn(
                    "p-2 rounded-lg shrink-0",
                    isPdf
                      ? "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
                      : "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"
                  )}
                >
                  <FileText className="w-4 h-4" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-[#07164F] dark:text-white truncate group-hover:text-[#0866F5] dark:group-hover:text-[#238BFF] transition-colors">
                      {doc.title}
                    </p>
                    <span
                      className={cn(
                        "text-[9px] font-bold px-1 rounded uppercase shrink-0",
                        isPdf
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
                      )}
                    >
                      {doc.fileType}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#667DAA] dark:text-[#9CB1D3] mt-0.5">
                    {doc.updatedDate}
                  </p>
                </div>
              </div>

              {/* Right: Status Badge */}
              <div className="shrink-0">
                <span
                  className={cn(
                    "inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-md",
                    isPublished
                      ? "bg-[#10B981]/10 text-[#10B981] dark:bg-[#00D49A]/15 dark:text-[#00D49A]"
                      : "bg-[#F59E0B]/10 text-[#F59E0B] dark:bg-[#FFB547]/15 dark:text-[#FFB547]"
                  )}
                >
                  {isPublished ? "Đã xuất bản" : "Chờ duyệt"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
