"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrainingNavigationProps {
  currentSlug?: string;
}

export function TrainingNavigation({ currentSlug = "dai-hoc" }: TrainingNavigationProps) {
  const navItems = [
    {
      id: "dai-hoc",
      label: "Đại học",
      href: "/dao-tao/dai-hoc",
      isActive: currentSlug === "dai-hoc",
      isExternal: false,
    },
    {
      id: "thac-si",
      label: "Thạc sĩ",
      href: "/#training-section",
      isActive: currentSlug === "thac-si",
      isExternal: false,
    },
    {
      id: "tien-si",
      label: "Tiến sĩ",
      href: "/#training-section",
      isActive: currentSlug === "tien-si",
      isExternal: false,
    },
    {
      id: "dao-tao-thuong-xuyen",
      label: "Đào tạo thường xuyên",
      href: "https://ctc.epu.edu.vn/",
      isActive: false,
      isExternal: true,
    },
    {
      id: "tra-cuu-van-bang",
      label: "Tra cứu văn bằng",
      href: "https://sv.epu.edu.vn/",
      isActive: false,
      isExternal: true,
    },
  ];

  return (
    <aside className="space-y-4">
      {/* Top Back & Category Tag pill */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-sm backdrop-blur-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 hover:text-school-navy dark:hover:text-amber-400 uppercase transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại</span>
        </Link>

        <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">
          Đào tạo
        </span>
      </div>

      {/* Navigation Card */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h2 className="text-base font-bold text-school-navy dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-800">
          Đào tạo
        </h2>

        <nav className="mt-4 space-y-1.5" aria-label="Danh mục hệ đào tạo">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              target={item.isExternal ? "_blank" : undefined}
              rel={item.isExternal ? "noopener noreferrer" : undefined}
              className={cn(
                "group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                item.isActive
                  ? "text-epu-orange font-bold bg-amber-50/60 dark:bg-amber-950/20"
                  : "text-slate-600 dark:text-slate-300 hover:text-school-navy dark:hover:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              )}
            >
              <div className="flex items-center gap-2">
                {item.isActive && (
                  <ChevronRight className="w-4 h-4 text-epu-orange shrink-0 animate-pulse" />
                )}
                <span>{item.label}</span>
              </div>

              {!item.isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* Quick admissions support card */}
      <div className="rounded-3xl border border-blue-100 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 dark:from-slate-900 dark:to-blue-950/30 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-school-navy dark:text-blue-300">
          Tư vấn tuyển sinh 24/7
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
          Bạn cần hỗ trợ chọn ngành hoặc tìm hiểu phương thức xét tuyển? Trợ lý AI EPU luôn sẵn sàng tư vấn trực tiếp.
        </p>
        <Link
          href="/chat"
          className="mt-3.5 inline-flex items-center justify-center w-full px-3.5 py-2 text-xs font-semibold text-white bg-school-navy hover:bg-epu-orange dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl shadow-sm transition-all duration-200"
        >
          Hỏi đáp cùng AI Tuyển sinh
        </Link>
      </div>
    </aside>
  );
}
