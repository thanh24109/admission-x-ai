"use client";

import React from "react";
import Image from "next/image";

export default function HeroSlider() {
  return (
    <div className="sticky top-[58px] lg:top-[70px] z-0 w-full h-[calc(100dvh-110px)] lg:h-[calc(100dvh-126px)] min-h-[520px] overflow-hidden select-none bg-slate-950">
      <Image
        src="/asset/banner-2.avif"
        alt="Khuôn viên chính Trường Đại học Điện lực - Bộ Công Thương"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_28%] sm:object-center"
      />
      {/* Subtle gradient overlay to provide natural depth and contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent pointer-events-none" />
    </div>
  );
}
