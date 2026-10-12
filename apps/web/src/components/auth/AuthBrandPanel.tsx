"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FileText,
  MessageSquare,
  Users,
  GraduationCap,
  Zap,
  Building2,
  CheckCircle2,
} from "lucide-react";

interface AuthBrandPanelProps {
  mode?: "login" | "register";
}

export function AuthBrandPanel({ mode = "login" }: AuthBrandPanelProps) {
  return (
    <div className="relative w-full h-full min-h-[680px] lg:min-h-[740px] flex flex-col justify-between overflow-hidden select-none bg-sky-50 dark:bg-slate-950">
      {/* 
        Background Campus Photo:
        Crisp official EPU campus photo with lush trees and blue sky
      */}
      <div className="absolute inset-0 pointer-events-none">
        <Image
          src="/asset/banner-2.jpg"
          alt="Khuôn viên Trường Đại học Điện lực"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover object-[center_36%] opacity-90 dark:opacity-40"
        />
        {/*
          Gradient overlays:
          - Top-left subtle white/sky wash so headline and features pop clearly
          - Bottom blue wave transition area
        */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/70 to-transparent dark:from-slate-950/95 dark:via-slate-950/75 dark:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/40 dark:to-transparent" />
      </div>

      {/* 1. TOP HEADER: Official EPU logo lockup */}
      <div className="relative z-10 p-8 sm:p-10 lg:p-12 pb-0">
        <Link href="/" className="inline-flex items-center gap-3.5 group">
          <div className="relative w-11 h-11 shrink-0">
            <Image
              src="/asset/logo-dark.svg"
              alt="Logo Đại học Điện lực"
              fill
              className="object-contain dark:hidden"
              priority
            />
            <Image
              src="/asset/logo-light.svg"
              alt="Logo Đại học Điện lực"
              fill
              className="object-contain hidden dark:block"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-[15px] sm:text-base text-[#002943] dark:text-white tracking-tight leading-tight uppercase">
              TRƯỜNG ĐẠI HỌC ĐIỆN LỰC
            </span>
            <span className="font-bold text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 tracking-wider uppercase leading-tight mt-0.5">
              ELECTRIC POWER UNIVERSITY
            </span>
          </div>
        </Link>
      </div>

      {/* 2. MIDDLE CONTENT: Badge + Headline + Description + Feature rows */}
      <div className="relative z-10 px-8 sm:p-10 lg:p-12 my-auto max-w-[540px]">
        {/* Badge: "Cổng thông tin tuyển sinh chính thức" with small blue check icon */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/90 dark:bg-blue-950/80 text-[#0866D9] dark:text-blue-300 text-xs font-semibold mb-4 shadow-2xs backdrop-blur-xs">
          <CheckCircle2 className="h-3.5 w-3.5 fill-[#0866D9] text-white dark:fill-blue-400" />
          <span>Cổng thông tin tuyển sinh chính thức</span>
        </div>

        {/* Big Bold Headline: 46px, Navy with Blue accent */}
        <div className="space-y-1 mb-3">
          <h1 className="text-[40px] sm:text-[46px] lg:text-[48px] font-extrabold text-[#0B1D49] dark:text-white tracking-tight leading-[1.08]">
            Cổng thông tin <br />
            <span className="text-[#0866D9] dark:text-blue-400">tuyển sinh</span>
          </h1>
          <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-[#0866D9] dark:text-blue-400 pt-1">
            TRƯỜNG ĐẠI HỌC ĐIỆN LỰC
          </h2>
        </div>

        {/* Short introduction paragraph */}
        <p className="text-[13px] sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-normal max-w-[460px]">
          Đồng hành cùng thí sinh trên hành trình chinh phục tri thức và kiến tạo tương lai trong lĩnh vực năng lượng, điện – điện tử và công nghệ.
        </p>

        {/* 3 Benefits with circular blue icon badges matching the reference */}
        <div className="space-y-3.5 mb-7">
          {/* Feature 1 */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#0866D9] text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/25">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-[14px] text-[#0B1D49] dark:text-white leading-tight">
                Thông tin chính xác
              </h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                Từ tài liệu tuyển sinh chính thức
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#0866D9] text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/25">
              <MessageSquare className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-[14px] text-[#0B1D49] dark:text-white leading-tight">
                Hỏi đáp nhanh chóng
              </h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                Hỗ trợ 24/7 bằng AI
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#0866D9] text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/25">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-[14px] text-[#0B1D49] dark:text-white leading-tight">
                Đồng hành cùng thí sinh
              </h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                Kết nối với cán bộ tuyển sinh khi cần
              </p>
            </div>
          </div>
        </div>

        {/* 3 Quick highlights cards on campus bottom */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-white/60 dark:border-slate-800 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#0866D9] flex items-center justify-center shrink-0">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <span className="font-bold text-[11px] text-[#0B1D49] dark:text-white block">Đa dạng</span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 block truncate">ngành đào tạo</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-white/60 dark:border-slate-800 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#0866D9] flex items-center justify-center shrink-0">
              <Zap className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <span className="font-bold text-[11px] text-[#0B1D49] dark:text-white block">Gắn với</span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 block truncate">thực tiễn năng lượng</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-white/60 dark:border-slate-800 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#0866D9] flex items-center justify-center shrink-0">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <span className="font-bold text-[11px] text-[#0B1D49] dark:text-white block">Môi trường</span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 block truncate">học tập hiện đại</span>
            </div>
          </div>
        </div>
      </div>

      {/* 
        3. BOTTOM BLUE WAVE SECTION:
        Blue wavy shape inspired by the reference with university title, slogan and watermark "EPU"
      */}
      <div className="relative z-10 mt-auto">
        {/* SVG Wave */}
        <div className="w-full leading-none overflow-hidden">
          <svg
            viewBox="0 0 700 85"
            fill="none"
            preserveAspectRatio="none"
            className="w-full h-14 sm:h-16 text-[#0866D9]"
          >
            <path
              d="M0 45C150 15 280 75 460 30C580 0 650 35 700 20V85H0V45Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Solid Blue Wave Footer */}
        <div className="bg-[#0866D9] text-white px-8 sm:px-10 lg:px-12 py-4 flex items-center justify-between relative overflow-hidden">
          {/* Subtle oversized watermark "EPU" */}
          <span className="absolute -right-2 -bottom-4 text-7xl font-black text-white/10 tracking-widest pointer-events-none select-none">
            EPU
          </span>

          <div className="space-y-0.5 relative z-10">
            <p className="font-bold text-xs tracking-wider uppercase">
              TRƯỜNG ĐẠI HỌC ĐIỆN LỰC
            </p>
            <p className="text-[11px] text-white/80 font-normal">
              Tri thức – Năng lượng – Vì tương lai
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
