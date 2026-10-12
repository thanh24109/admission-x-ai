"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ADMISSION_DATA } from "@/data/admissions";

export default function AdmissionSection() {
  return (
    <section className="epu-admission-section bg-slate-50/80 py-20 border-t border-slate-200/50">
      <div className="epu-container">
        <div className="epu-admission-grid">
          {/* Left Column: Image with floating animated card */}
          <div className="epu-admission-img-wrapper relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Image
                src={ADMISSION_DATA.image}
                alt="Sinh viên Trường Đại học Điện lực"
                width={480}
                height={580}
                className="epu-admission-img rounded-3xl shadow-xl"
              />
            </motion.div>

            {/* Floating badge card with Motion float */}
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              animate={{ y: [0, -6, 0] }}
              transition={{
                y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
                opacity: { duration: 0.6 },
              }}
              className="epu-admission-float-card bg-white p-6 rounded-2xl shadow-2xl border border-slate-100"
            >
              <Badge variant="secondary" className="text-[10px] font-extrabold uppercase tracking-wider mb-1">
                {ADMISSION_DATA.yearTag}
              </Badge>
              <div className="epu-admission-year text-4xl font-extrabold text-school-navy leading-none my-1">
                {ADMISSION_DATA.year}
              </div>
              <div className="epu-admission-summary text-xs text-slate-500 leading-relaxed">
                {ADMISSION_DATA.tagline}
              </div>
            </motion.div>
          </div>

          {/* Right Column: Admission info & Levels */}
          <div className="space-y-6">
            <div>
              <div className="epu-admission-subheading text-xs font-bold text-epu-orange tracking-widest uppercase mb-2">
                {ADMISSION_DATA.subTitle}
              </div>
              <h2 className="epu-admission-main-title text-3xl md:text-5xl font-serif font-bold text-school-navy leading-tight">
                {ADMISSION_DATA.title} <span className="text-epu-orange">{ADMISSION_DATA.highlight}</span>
              </h2>
            </div>

            <p className="epu-admission-desc text-slate-600 text-base leading-relaxed">
              {ADMISSION_DATA.description}
            </p>

            {/* Program Levels */}
            <div className="epu-admission-highlights space-y-3">
              {ADMISSION_DATA.levels.map((level, idx) => (
                <motion.div
                  key={level.title}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08 }}
                  className="epu-highlight-item flex items-center gap-3 p-3 rounded-xl bg-white/70 border border-slate-200/60 shadow-xs"
                >
                  <CheckCircle2 className="h-5 w-5 text-epu-orange shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">
                      {level.title}
                    </div>
                    {level.desc && (
                      <div className="text-xs text-slate-500">
                        {level.desc}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA button with Shadcn Button */}
            <div className="pt-2">
              <Button
                size="lg"
                asChild
                className="rounded-full bg-school-navy hover:bg-epu-orange text-white font-bold px-8 shadow-lg hover:shadow-orange-500/25 transition-all"
              >
                <a
                  href={ADMISSION_DATA.portalHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <span>{ADMISSION_DATA.portalLabel}</span>
                  <ArrowRight size={18} />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
