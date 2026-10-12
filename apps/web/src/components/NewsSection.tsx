"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Newspaper } from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SPOTLIGHT_NEWS } from "@/data/news";

export default function NewsSection() {
  return (
    <section className="py-14 md:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="flex justify-between items-end mb-8 md:mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs uppercase font-bold tracking-wider">
                TIN TỨC SỰ KIỆN
              </Badge>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-school-navy tracking-tight">
              Tin nổi bật
            </h2>
          </div>

          <Button variant="outline" asChild className="rounded-full gap-2 border-slate-200 hover:bg-slate-50">
            <Link href="/tintuc/all">
              <span className="text-xs uppercase font-bold tracking-wider">Xem tất cả</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {/* 6 Cards Grid with Motion & Shadcn Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SPOTLIGHT_NEWS.map((item, index) => {
            const isFeaturedFirst = index === 0;

            if (isFeaturedFirst) {
              return (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <Card className="h-full relative min-h-[300px] overflow-hidden rounded-2xl border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                    <Link href={item.link} className="block w-full h-full relative">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Dark gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#001423]/95 via-[#001423]/45 to-transparent flex flex-col justify-end p-6">
                        <Badge variant="secondary" className="w-fit mb-2.5 text-[10px] font-bold">
                          {item.category}
                        </Badge>
                        <h3 className="text-lg md:text-xl font-bold text-white leading-snug drop-shadow-sm group-hover:text-amber-200 transition-colors">
                          {item.title}
                        </h3>
                      </div>
                    </Link>
                  </Card>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <Card className="h-full rounded-2xl border-slate-100 shadow-sm hover:shadow-xl transition-all overflow-hidden bg-white group flex flex-col">
                  <Link href={item.link} className="flex flex-col h-full">
                    <div className="relative w-full h-48 overflow-hidden bg-slate-100">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <CardContent className="p-5 flex flex-col flex-grow justify-between">
                      <div>
                        <span className="font-bold text-xs text-epu-orange mb-2 block uppercase tracking-wider">
                          {item.category}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-school-navy line-clamp-3 transition-colors leading-snug">
                          {item.title}
                        </h3>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
