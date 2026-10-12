"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Globe, ChevronDown, ArrowLeft } from "lucide-react";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";

interface SplitAuthLayoutProps {
  children: React.ReactNode;
  mode?: "login" | "register";
}

export function SplitAuthLayout({ children, mode = "login" }: SplitAuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-[#EFF6FF] dark:bg-slate-950 flex items-center justify-center p-3 sm:p-6 lg:p-8 relative overflow-hidden select-none">
      {/* Subtle abstract soft blue shapes in background corners */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-200/40 dark:bg-blue-900/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-sky-200/40 dark:bg-sky-900/10 blur-3xl pointer-events-none" />

      {/* Main Container: 92-94% width, max 1460px, rounded-3xl (24px), soft shadow */}
      <div className="w-[96%] max-w-[1460px] bg-white dark:bg-slate-900 rounded-[24px] sm:rounded-[28px] shadow-[0_20px_60px_-15px_rgba(8,102,217,0.12)] dark:shadow-black/60 border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col lg:flex-row relative z-10 min-h-[740px]">
        {/* Left Panel: Hero Branding (~58-60% on desktop) */}
        <div className="w-full lg:w-[59%] xl:w-[60%] flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800">
          <AuthBrandPanel mode={mode} />
        </div>

        {/* Right Panel: Clean White Login/Auth Form (~40-42% on desktop) */}
        <div className="w-full lg:w-[41%] xl:w-[40%] bg-white dark:bg-slate-900 p-6 sm:p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Top-right Language indicator */}
          <div className="flex items-center justify-between lg:justify-end gap-3 text-xs z-10">
            <Link
              href="/"
              className="lg:hidden inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-blue-600"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Trang chủ</span>
            </Link>

            <div className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium px-2.5 py-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 cursor-default">
              <Globe className="h-3.5 w-3.5 text-[#0866D9] dark:text-blue-400" />
              <span>Tiếng Việt</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </div>
          </div>

          {/* Form Content: Vertically Centered */}
          <div className="my-auto py-4 z-10">{children}</div>

          {/* 
            Decorative bottom light-blue illustration (electricity pylons & campus)
            matching the reference image
          */}
          <div className="w-full pointer-events-none select-none opacity-40 dark:opacity-10 mt-auto pt-2">
            <svg
              viewBox="0 0 400 90"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-16 sm:h-20 text-sky-400 dark:text-sky-600"
            >
              {/* Transmission Tower (Cột điện cao thế) */}
              <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                {/* Pylon Legs */}
                <line x1="50" y1="85" x2="65" y2="15" />
                <line x1="90" y1="85" x2="75" y2="15" />
                {/* Cross bracings */}
                <line x1="53" y1="70" x2="87" y2="70" />
                <line x1="57" y1="52" x2="83" y2="52" />
                <line x1="61" y1="35" x2="79" y2="35" />
                <line x1="53" y1="70" x2="83" y2="52" />
                <line x1="87" y1="70" x2="57" y2="52" />
                <line x1="57" y1="52" x2="79" y2="35" />
                <line x1="83" y1="52" x2="61" y2="35" />
                {/* Pylon Arms */}
                <line x1="42" y1="35" x2="98" y2="35" />
                <line x1="48" y1="22" x2="92" y2="22" />
                {/* Top peak */}
                <line x1="65" y1="15" x2="70" y2="5" />
                <line x1="75" y1="15" x2="70" y2="5" />
                {/* Power lines dangling */}
                <path d="M42 35 C 100 45, 140 45, 200 40" strokeDasharray="3 3" />
                <path d="M98 35 C 150 48, 210 48, 280 42" strokeDasharray="3 3" />
              </g>

              {/* University Building Lineart (Tòa nhà trường & cây cối) */}
              <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                {/* Campus Main Hall */}
                <rect x="220" y="38" width="130" height="47" rx="3" />
                {/* Center entrance glass */}
                <rect x="265" y="55" width="40" height="30" />
                <line x1="285" y1="55" x2="285" y2="85" />
                {/* Roof cap */}
                <polygon points="215,38 285,25 355,38" fill="none" />
                {/* Windows rows */}
                <line x1="230" y1="48" x2="255" y2="48" />
                <line x1="315" y1="48" x2="340" y2="48" />
                <line x1="230" y1="65" x2="255" y2="65" />
                <line x1="315" y1="65" x2="340" y2="65" />

                {/* Decorative Trees */}
                <path d="M170 85 C 170 70, 185 70, 185 85" fill="currentColor" fillOpacity="0.2" />
                <path d="M190 85 C 190 65, 210 65, 210 85" fill="currentColor" fillOpacity="0.2" />
                <path d="M365 85 C 365 68, 385 68, 385 85" fill="currentColor" fillOpacity="0.2" />

                {/* Ground horizon */}
                <line x1="10" y1="85" x2="390" y2="85" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CenteredAuthLayoutProps {
  children: React.ReactNode;
}

export function CenteredAuthLayout({ children }: CenteredAuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-[#EFF6FF] dark:bg-slate-950 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl border border-slate-100 dark:border-slate-800 p-6 sm:p-8">
        <header className="flex items-center justify-between pb-6 mb-4 border-b border-slate-100 dark:border-slate-800">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/asset/logo-dark.svg"
              alt="Logo Đại học Điện lực"
              width={140}
              height={44}
              className="h-9 w-auto object-contain dark:hidden"
              priority
            />
            <Image
              src="/asset/logo-light.svg"
              alt="Logo Đại học Điện lực"
              width={140}
              height={44}
              className="h-9 w-auto object-contain hidden dark:block"
              priority
            />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Trang chủ</span>
          </Link>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
