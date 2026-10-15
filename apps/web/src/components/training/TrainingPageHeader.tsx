"use client";

import React, { useState } from "react";
import { Share2, Check, BookOpen, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrainingPageHeaderProps {
  totalPrograms?: number;
}

export function TrainingPageHeader({ totalPrograms = 38 }: TrainingPageHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      if (typeof window !== "undefined") {
        if (navigator.share) {
          await navigator.share({
            title: "Chương trình đào tạo Đại học - Trường Đại học Điện lực",
            url: window.location.href,
          });
        } else {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }
    } catch {
      // User cancelled share or clipboard error
    }
  };

  return (
    <div className="pb-6 border-b border-slate-200/80 dark:border-slate-800">
      {/* Top action row: Share button */}
      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-school-navy dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400">Đã sao chép liên kết</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>Chia sẻ</span>
            </>
          )}
        </button>
      </div>

      {/* Main Page Title */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-epu-orange border border-amber-200/60 dark:border-amber-900/40">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Hệ chính quy</span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <BookOpen className="w-3.5 h-3.5 text-school-navy dark:text-blue-400" />
            <span>{totalPrograms} Ngành đào tạo</span>
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-school-navy dark:text-white leading-tight">
          Chương trình đào tạo Đại học – Trường Đại học Điện lực
        </h1>

        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
          Khám phá danh sách các ngành và chương trình đào tạo hệ chính quy tại Trường Đại học Điện lực. Tìm hiểu mã ngành, loại bằng cấp và thông tin chương trình đào tạo.
        </p>
      </div>
    </div>
  );
}
