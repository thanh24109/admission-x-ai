"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
    <div className="epu-hero">
      {HERO_SLIDES.map((slide, idx) => (
        <div
          key={slide.id}
          className={`epu-hero-slide ${idx === currentSlide ? "active" : "inactive"}`}
          style={{ backgroundImage: `url('${slide.image}')` }}
        >
          {/* Subtle gradient overlay to match live EPU site */}
          <div className="epu-hero-overlay" />
        </div>
      ))}

      {/* Prev / Next controls */}
      <button
        onClick={prevSlide}
        className="epu-hero-nav-btn epu-hero-prev"
        aria-label="Slide trước"
      >
        <ChevronLeft size={24} />
      </button>

      <button
        onClick={nextSlide}
        className="epu-hero-nav-btn epu-hero-next"
        aria-label="Slide tiếp theo"
      >
        <ChevronRight size={24} />
      </button>

      {/* Indicators */}
      <div className="epu-hero-indicators">
        {HERO_SLIDES.map((_, idx) => (
          <div
            key={idx}
            className={`epu-hero-indicator ${idx === currentSlide ? "active" : ""}`}
            onClick={() => setCurrentSlide(idx)}
            role="button"
            tabIndex={0}
            aria-label={`Chuyển tới slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
