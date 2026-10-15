"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function ExploreProgramsHero() {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-[#0A1730] border border-[#E3ECF8] dark:border-[#1E3250] rounded-2xl shadow-2xs p-6 md:p-7 flex flex-col justify-between min-h-[270px] group">
      {/* Right Background Image with Authentic EPU Building */}
      <div className="absolute right-0 top-0 bottom-0 w-full sm:w-3/5 lg:w-1/2 overflow-hidden pointer-events-none">
        <Image
          src="/asset/epu.avif"
          alt="Trường Đại học Điện lực (EPU)"
          fill
          priority
          className="object-cover object-right sm:object-center transition-transform duration-700 group-hover:scale-105"
        />
        {/* Soft Left-to-Right Gradient mask for clear typography */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 sm:via-white/70 to-transparent dark:from-[#0A1730] dark:via-[#0A1730]/90 sm:dark:via-[#0A1730]/70 dark:to-transparent" />
      </div>

      {/* Left Content */}
      <div className="relative z-10 max-w-md">
        {/* Eyebrow Badge */}
        <span className="inline-block px-3 py-1 text-xs font-semibold text-[#0866D9] dark:text-[#3B82F6] bg-[#EBF3FE] dark:bg-[#152D52] rounded-full">
          Khám phá ngành học
        </span>

        {/* Heading */}
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#0B1D49] dark:text-white leading-tight mt-3">
          Tìm hiểu chương trình đào tạo phù hợp với định hướng của bạn
        </h2>

        {/* Description */}
        <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] mt-2 leading-relaxed max-w-sm">
          Xem chi tiết thông tin ngành học, cơ hội nghề nghiệp, phương thức xét tuyển và học phí.
        </p>
      </div>

      {/* Action Button */}
      <div className="relative z-10 mt-5">
        <Link
          href="/page/dai-hoc"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#0866D9] hover:bg-[#0756B5] shadow-xs hover:shadow-md transition-all active:scale-[0.98]"
        >
          <span>Khám phá ngành học</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
