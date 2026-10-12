"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Bell, GraduationCap, Layers } from "lucide-react";
import { motion } from "motion/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { GENERAL_ANNOUNCEMENTS, ADMISSION_ANNOUNCEMENTS } from "@/data/announcements";

export default function AnnouncementSection() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <section className="epu-announcements-section relative overflow-hidden">
      <div className="epu-container relative z-10">
        {/* Section Header with Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
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
            <TabsList className="bg-white/10 text-white/80 border border-white/15">
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
            className="epu-announcements-grid"
          >
            {/* Column 1: Thông báo mới */}
            <div>
              <Link href="/tintuc/thongbao" className="epu-announcements-header group">
                <span className="group-hover:text-amber-200 transition-colors">Thông báo mới</span>
                <ArrowUpRight size={26} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Link>

              <div className="epu-announcement-list">
                {GENERAL_ANNOUNCEMENTS.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06 }}
                  >
                    <Link
                      href={item.postLink || item.link}
                      className="epu-announcement-item group"
                    >
                      <div className="epu-announcement-content">
                        <div className="epu-orange-dot" />
                        <div>
                          <div className="epu-announcement-title group-hover:text-amber-200 transition-colors">
                            {item.title}
                          </div>
                          {item.date && (
                            <div className="epu-announcement-date">{item.date}</div>
                          )}
                        </div>
                      </div>
                      <div className="epu-arrow-btn group-hover:bg-white group-hover:text-school-navy">
                        <ArrowUpRight size={18} />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Column 2: Thông báo tuyển sinh */}
            <div>
              <Link href="/tintuc/thongbao?tags=tuyen-sinh" className="epu-announcements-header group">
                <span className="group-hover:text-amber-200 transition-colors">Thông báo tuyển sinh</span>
                <ArrowUpRight size={26} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Link>

              <div className="epu-announcement-list">
                {ADMISSION_ANNOUNCEMENTS.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06 }}
                  >
                    <Link
                      href={item.postLink || item.link}
                      className="epu-announcement-item group"
                    >
                      <div className="epu-announcement-content">
                        <div className="epu-orange-dot" />
                        <div>
                          <div className="epu-announcement-title group-hover:text-amber-200 transition-colors">
                            {item.title}
                          </div>
                          {item.date && (
                            <div className="epu-announcement-date">{item.date}</div>
                          )}
                        </div>
                      </div>
                      <div className="epu-arrow-btn group-hover:bg-white group-hover:text-school-navy">
                        <ArrowUpRight size={18} />
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
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {GENERAL_ANNOUNCEMENTS.map((item) => (
              <Link
                key={item.id}
                href={item.postLink || item.link}
                className="epu-announcement-item group"
              >
                <div className="epu-announcement-content">
                  <div className="epu-orange-dot" />
                  <div>
                    <div className="epu-announcement-title group-hover:text-amber-200 transition-colors">
                      {item.title}
                    </div>
                    {item.date && (
                      <div className="epu-announcement-date">{item.date}</div>
                    )}
                  </div>
                </div>
                <div className="epu-arrow-btn group-hover:bg-white group-hover:text-school-navy">
                  <ArrowUpRight size={18} />
                </div>
              </Link>
            ))}
          </motion.div>
        )}

        {/* Tab 3: Admissions Only */}
        {activeTab === "admissions" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {ADMISSION_ANNOUNCEMENTS.map((item) => (
              <Link
                key={item.id}
                href={item.postLink || item.link}
                className="epu-announcement-item group"
              >
                <div className="epu-announcement-content">
                  <div className="epu-orange-dot" />
                  <div>
                    <div className="epu-announcement-title group-hover:text-amber-200 transition-colors">
                      {item.title}
                    </div>
                    {item.date && (
                      <div className="epu-announcement-date">{item.date}</div>
                    )}
                  </div>
                </div>
                <div className="epu-arrow-btn group-hover:bg-white group-hover:text-school-navy">
                  <ArrowUpRight size={18} />
                </div>
              </Link>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
