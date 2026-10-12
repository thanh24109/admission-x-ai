"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HERO_SLIDES = [
  {
    id: 1,
    image: "/asset/banner-2.avif",
    alt: "Khuôn viên chính Trường Đại học Điện lực - Bộ Công Thương",
    title: "TRƯỜNG ĐẠI HỌC ĐIỆN LỰC",
    subtitle: "Tiên phong đào tạo nguồn nhân lực chất lượng cao trong lĩnh vực năng lượng và công nghệ",
  },
  {
    id: 2,
    image: "/asset/banner-2.jpg",
    alt: "Trường Đại học Điện lực - 60 năm xây dựng và phát triển",
    title: "60 NĂM XÂY DỰNG & PHÁT TRIỂN",
    subtitle: "1966 - 2026: Tự hào truyền thống đào tạo kỹ thuật, sẵn sàng bứt phá tương lai",
  },
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  return (
    <div className="relative w-full h-[360px] sm:h-[460px] md:h-[540px] lg:h-[620px] overflow-hidden bg-slate-950 select-none">
      {HERO_SLIDES.map((slide, idx) => (
        <div
          key={slide.id}
          className={cn(
            "absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out",
            idx === currentSlide ? "opacity-100 z-10 scale-100" : "opacity-0 z-0 scale-105 pointer-events-none"
          )}
          style={{ backgroundImage: `url('${slide.image}')` }}
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>
      ))}

      {/* Prev / Next controls with Shadcn Button */}
      <div className="absolute inset-y-0 left-4 sm:left-6 flex items-center z-20">
        <Button
          variant="outline"
          size="icon"
          onClick={prevSlide}
          className="rounded-full h-11 w-11 bg-black/35 hover:bg-black/65 text-white border-white/20 backdrop-blur-sm transition-all"
          aria-label="Slide trước"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </div>

      <div className="absolute inset-y-0 right-4 sm:right-6 flex items-center z-20">
        <Button
          variant="outline"
          size="icon"
          onClick={nextSlide}
          className="rounded-full h-11 w-11 bg-black/35 hover:bg-black/65 text-white border-white/20 backdrop-blur-sm transition-all"
          aria-label="Slide tiếp theo"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-5 inset-x-0 flex justify-center items-center gap-2.5 z-20">
        {HERO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            className={cn(
              "h-2.5 rounded-full transition-all duration-300",
              idx === currentSlide
                ? "w-8 bg-epu-orange shadow-md shadow-orange-500/50"
                : "w-2.5 bg-white/50 hover:bg-white/80"
            )}
            onClick={() => setCurrentSlide(idx)}
            aria-label={`Chuyển tới slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
