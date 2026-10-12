"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Bell, GraduationCap, Layers } from "lucide-react";
import { motion } from "motion/react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { GENERAL_ANNOUNCEMENTS, ADMISSION_ANNOUNCEMENTS } from "@/data/announcements";

export default function AnnouncementSection() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-br from-school-navy via-[#002238] to-[#001726] text-white">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header with Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs uppercase font-bold tracking-wider">
                BẢNG TIN EPU
              </Badge>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight">
              Thông báo chính thức
            </h2>
          </div>

          {/* Radix Tabs switcher */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList className="bg-white/10 text-white/80 border border-white/15 backdrop-blur-md">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-white data-[state=active]:text-school-navy flex items-center gap-1.5"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Tất cả</span>
              </TabsTrigger>
              <TabsTrigger
                value="general"
                className="data-[state=active]:bg-white data-[state=active]:text-school-navy flex items-center gap-1.5"
              >
                <Bell className="h-3.5 w-3.5" />
                <span>Thông báo chung</span>
              </TabsTrigger>
              <TabsTrigger
                value="admissions"
                className="data-[state=active]:bg-white data-[state=active]:text-school-navy flex items-center gap-1.5"
              >
                <GraduationCap className="h-3.5 w-3.5" />
                <span>Tuyển sinh</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tab 1: ALL (Side-by-side standard EPU view) */}
        {activeTab === "all" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12"
          >
            {/* Column 1: Thông báo mới */}
            <div>
              <Link
                href="/tintuc/thongbao"
                className="flex items-center justify-between pb-4 mb-6 border-b border-white/15 text-xl font-bold text-white group"
              >
                <span className="group-hover:text-amber-200 transition-colors">Thông báo mới</span>
                <ArrowUpRight className="h-6 w-6 text-epu-orange group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Link>

              <div className="space-y-3.5">
                {GENERAL_ANNOUNCEMENTS.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link
                      href={item.postLink || item.link}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 transition-all group"
                    >
                      <div className="flex items-start gap-3.5 pr-4">
                        <div className="w-2 h-2 rounded-full bg-epu-orange mt-2 shrink-0 group-hover:scale-125 transition-transform" />
                        <div>
                          <div className="text-sm font-semibold text-white/90 group-hover:text-amber-200 transition-colors line-clamp-2 leading-relaxed">
                            {item.title}
                          </div>
                          {item.date && (
                            <div className="text-xs text-white/50 mt-1">{item.date}</div>
                          )}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-white/10 text-white group-hover:bg-epu-orange transition-colors shrink-0">
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Column 2: Thông báo tuyển sinh */}
            <div>
              <Link
                href="/tuyensinh/thongbaotuyensinh"
                className="flex items-center justify-between pb-4 mb-6 border-b border-white/15 text-xl font-bold text-white group"
              >
                <span className="group-hover:text-amber-200 transition-colors">Thông báo tuyển sinh</span>
                <ArrowUpRight className="h-6 w-6 text-epu-orange group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Link>

              <div className="space-y-3.5">
                {ADMISSION_ANNOUNCEMENTS.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link
                      href={item.postLink || item.link}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 transition-all group"
                    >
                      <div className="flex items-start gap-3.5 pr-4">
                        <div className="w-2 h-2 rounded-full bg-epu-orange mt-2 shrink-0 group-hover:scale-125 transition-transform" />
                        <div>
                          <div className="text-sm font-semibold text-white/90 group-hover:text-amber-200 transition-colors line-clamp-2 leading-relaxed">
                            {item.title}
                          </div>
                          {item.date && (
                            <div className="text-xs text-white/50 mt-1">{item.date}</div>
                          )}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-white/10 text-white group-hover:bg-epu-orange transition-colors shrink-0">
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 2: General Only */}
        {activeTab === "general" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {GENERAL_ANNOUNCEMENTS.map((item) => (
              <Link
                key={item.id}
                href={item.postLink || item.link}
                className="flex items-center justify-between p-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 transition-all group"
              >
                <div className="flex items-start gap-3 pr-4">
                  <div className="w-2 h-2 rounded-full bg-epu-orange mt-2 shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-white/90 group-hover:text-amber-200 transition-colors line-clamp-2">
                      {item.title}
                    </div>
                    {item.date && <div className="text-xs text-white/50 mt-1">{item.date}</div>}
                  </div>
                </div>
                <ArrowUpRight className="h-5 w-5 text-white/60 group-hover:text-white shrink-0" />
              </Link>
            ))}
          </motion.div>
        )}

        {/* Tab 3: Admissions Only */}
        {activeTab === "admissions" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {ADMISSION_ANNOUNCEMENTS.map((item) => (
              <Link
                key={item.id}
                href={item.postLink || item.link}
                className="flex items-center justify-between p-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 transition-all group"
              >
                <div className="flex items-start gap-3 pr-4">
                  <div className="w-2 h-2 rounded-full bg-epu-orange mt-2 shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-white/90 group-hover:text-amber-200 transition-colors line-clamp-2">
                      {item.title}
                    </div>
                    {item.date && <div className="text-xs text-white/50 mt-1">{item.date}</div>}
                  </div>
                </div>
                <ArrowUpRight className="h-5 w-5 text-white/60 group-hover:text-white shrink-0" />
              </Link>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
