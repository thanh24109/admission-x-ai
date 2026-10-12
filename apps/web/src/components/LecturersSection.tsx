"use client";

import React from "react";
import Image from "next/image";
import { Search, X, UserCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAppStore } from "@/store/useAppStore";
import { LECTURERS_DATA } from "@/data/lecturers";

export default function LecturersSection() {
  const { lecturerFilter, setLecturerFilter } = useAppStore();

  const filteredLecturers = LECTURERS_DATA.filter((lec) => {
    const term = lecturerFilter.toLowerCase().trim();
    if (!term) return true;
    return (
      lec.name.toLowerCase().includes(term) ||
      lec.role.toLowerCase().includes(term) ||
      lec.field.toLowerCase().includes(term)
    );
  });

  return (
    <section className="py-16 md:py-24 bg-white dark:bg-slate-950 border-t border-slate-200/60 dark:border-slate-800 transition-colors duration-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="default" className="text-xs uppercase font-bold tracking-wider">
                ĐỘI NGŨ EPU
              </Badge>
            </div>
            <h2 className="text-3xl md:text-4xl font-sans font-bold text-school-navy dark:text-slate-100 tracking-tight mb-2">
              Giảng viên xuất sắc
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xl">
              Tìm kiếm nhanh thông tin giảng viên, ban giám hiệu và lãnh đạo các đơn vị
            </p>
          </div>

          {/* Search Input wired to Zustand store */}
          <div className="w-full md:w-80 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <Input
              type="text"
              placeholder="Tìm theo tên, học vị, chức vụ..."
              value={lecturerFilter}
              onChange={(e) => setLecturerFilter(e.target.value)}
              className="pl-10 pr-9 h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 rounded-full shadow-xs focus-visible:ring-school-navy dark:focus-visible:ring-epu-orange"
            />
            {lecturerFilter && (
              <button
                onClick={() => setLecturerFilter("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1"
                aria-label="Xóa bộ lọc"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Lecturers Grid with Motion */}
        {filteredLecturers.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredLecturers.map((lec) => (
                <motion.div
                  key={lec.name}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="h-full border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 group">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="relative mb-4">
                        <Avatar className="w-24 h-24 md:w-28 md:h-28 ring-4 ring-slate-100 dark:ring-slate-800 shadow-md">
                          <AvatarImage src={lec.image} alt={lec.name} />
                          <AvatarFallback className="bg-school-navy text-white text-lg font-bold">
                            {lec.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-school-navy dark:bg-epu-orange text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                          <UserCheck className="h-3 w-3" />
                        </div>
                      </div>

                      <h3 className="font-bold text-base text-school-navy dark:text-slate-100 mb-1 line-clamp-1 group-hover:text-epu-orange dark:group-hover:text-amber-400 transition-colors">
                        {lec.name}
                      </h3>
                      <span className="text-xs font-semibold text-epu-orange dark:text-amber-400 mb-1">
                        {lec.field}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {lec.role}
                      </span>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="p-12 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 shadow-xs">
            Không tìm thấy giảng viên phù hợp với từ khóa &ldquo;{lecturerFilter}&rdquo;.
          </div>
        )}
      </div>
    </section>
  );
}
