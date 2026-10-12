"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FACULTIES_DATA } from "../data/faculties";

export default function FacultiesSection() {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: -340, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: 340, behavior: "smooth" });
    }
  };

  return (
    <section className="py-14 md:py-20 bg-slate-50/70 border-t border-slate-200/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Title and Nav Arrows */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-school-navy tracking-tight">
            Các khoa đào tạo
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={scrollLeft}
              className="rounded-full h-10 w-10 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
              aria-label="Khoa trước"
              title="Khoa trước"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={scrollRight}
              className="rounded-full h-10 w-10 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
              aria-label="Khoa tiếp theo"
              title="Khoa tiếp theo"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Horizontal Carousel Track */}
        <div
          className="flex gap-6 overflow-x-auto pb-4 scroll-smooth no-scrollbar"
          ref={trackRef}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {FACULTIES_DATA.map((faculty) => (
            <Card
              key={faculty.name}
              className="min-w-[280px] sm:min-w-[320px] max-w-[320px] shrink-0 rounded-2xl overflow-hidden border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 bg-white flex flex-col group"
            >
              <div className="relative w-full h-44 overflow-hidden bg-slate-100">
                <Image
                  src={faculty.image}
                  alt={faculty.name}
                  fill
                  sizes="320px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-school-navy/90 via-school-navy/30 to-transparent flex items-end p-4">
                  <h3 className="font-bold text-sm sm:text-base text-white line-clamp-2 leading-snug">
                    {faculty.name}
                  </h3>
                </div>
              </div>

              <CardContent className="p-5 flex flex-col flex-grow justify-between">
                <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                  {faculty.description}
                </p>
                <a
                  href={faculty.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-school-navy hover:text-epu-orange uppercase tracking-wider transition-colors pt-2 border-t border-slate-100"
                >
                  <span>Khám phá khoa</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
