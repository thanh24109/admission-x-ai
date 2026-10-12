"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ADMISSION_DATA } from "@/data/admissions";

export default function AdmissionSection() {
  return (
    <section className="bg-slate-50/80 dark:bg-slate-900/50 py-16 md:py-24 border-t border-slate-200/50 dark:border-slate-800 transition-colors duration-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column: Image with floating animated card */}
          <div className="relative flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative w-full max-w-[460px] aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10"
            >
              <Image
                src={ADMISSION_DATA.image}
                alt="Sinh viên Trường Đại học Điện lực"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </motion.div>

            {/* Floating badge card with Motion float */}
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              animate={{ y: [0, -8, 0] }}
              transition={{
                y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
                opacity: { duration: 0.6 },
              }}
              className="absolute -bottom-6 -right-2 sm:right-4 z-20"
            >
              <Card className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 max-w-[240px]">
                <Badge variant="secondary" className="text-[10px] font-extrabold uppercase tracking-wider mb-1">
                  {ADMISSION_DATA.yearTag}
                </Badge>
                <div className="text-3xl sm:text-4xl font-extrabold text-school-navy dark:text-slate-100 leading-none my-1.5">
                  {ADMISSION_DATA.year}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {ADMISSION_DATA.tagline}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Right Column: Admission info & Levels */}
          <div className="space-y-6 lg:pl-6">
            <div>
              <div className="text-xs font-bold text-epu-orange tracking-widest uppercase mb-2">
                {ADMISSION_DATA.subTitle}
              </div>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-school-navy dark:text-slate-100 leading-tight">
                {ADMISSION_DATA.title} <span className="text-epu-orange">{ADMISSION_DATA.highlight}</span>
              </h2>
            </div>

            <p className="text-slate-600 dark:text-slate-300 text-base md:text-lg leading-relaxed">
              {ADMISSION_DATA.description}
            </p>

            {/* Program Levels */}
            <div className="space-y-3 pt-2">
              {ADMISSION_DATA.levels.map((level, idx) => (
                <motion.div
                  key={level.title}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08 }}
                  className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700 shadow-xs hover:border-epu-orange/40 dark:hover:border-epu-orange/50 hover:shadow-sm transition-all"
                >
                  <CheckCircle2 className="h-5 w-5 text-epu-orange shrink-0" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {level.title}
                    </div>
                    {level.desc && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {level.desc}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA button with Shadcn Button */}
            <div className="pt-4">
              <Button
                size="lg"
                asChild
                className="rounded-full bg-school-navy dark:bg-epu-orange hover:bg-epu-orange dark:hover:bg-orange-600 text-white font-bold px-8 h-12 shadow-lg hover:shadow-orange-500/25 transition-all text-sm gap-2"
              >
                <a
                  href={ADMISSION_DATA.portalHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>{ADMISSION_DATA.portalLabel}</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
