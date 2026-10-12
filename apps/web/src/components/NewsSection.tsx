"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Newspaper } from "lucide-react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SPOTLIGHT_NEWS } from "@/data/news";

export default function NewsSection() {
  return (
    <section className="epu-section bg-white">
      <div className="epu-container">
        {/* Section Heading */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs uppercase font-bold tracking-wider">
                TIN TỨC SỰ KIỆN
              </Badge>
            </div>
            <h2 className="section-title mb-0">Tin nổi bật</h2>
          </div>

          <Button variant="outline" asChild className="rounded-full gap-2 border-slate-200 hover:bg-slate-50">
            <Link href="/tintuc/all">
              <span className="text-xs uppercase font-bold tracking-wider">Xem tất cả</span>
              <ArrowRight size={14} />
            </Link>
          </Button>
        </div>

        {/* 6 Cards Grid with Motion */}
        <div className="epu-spotlight-grid">
          {SPOTLIGHT_NEWS.map((item, index) => {
            const isFeaturedFirst = index === 0;

            if (isFeaturedFirst) {
              return (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="epu-news-card relative min-h-[290px] overflow-hidden rounded-2xl border-slate-100 shadow-sm hover:shadow-xl"
                >
                  <Link href={item.link} className="block w-full h-full relative">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="epu-news-card-img object-cover"
                    />
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#001423]/95 via-[#001423]/40 to-transparent flex flex-col justify-end p-5">
                      <Badge variant="secondary" className="w-fit mb-2 text-[10px] font-bold">
                        {item.category}
                      </Badge>
                      <h3 className="text-base md:text-lg font-bold text-white leading-snug drop-shadow-sm">
                        {item.title}
                      </h3>
                    </div>
                  </Link>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.2 }}
                className="epu-news-card rounded-2xl border-slate-100 shadow-sm hover:shadow-xl overflow-hidden"
              >
                <Link href={item.link} className="flex flex-col h-full">
                  <div className="epu-news-card-img-wrap relative">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="epu-news-card-img object-cover"
                    />
                  </div>
                  <div className="epu-news-card-body p-5 flex flex-col flex-grow">
                    <span className="epu-category-tag font-bold text-xs text-epu-orange mb-1">
                      {item.category}
                    </span>
                    <h3 className="epu-news-card-title text-base font-bold text-slate-900 group-hover:text-school-navy line-clamp-3">
                      {item.title}
                    </h3>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
