"use client";

import React from "react";
import Image from "next/image";
import { Search, X, UserCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
    <section className="epu-lecturers-section py-20 bg-slate-50/70 border-t border-slate-200/60">
      <div className="epu-container">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="default" className="text-xs uppercase font-bold tracking-wider">
                ĐỘI NGŨ EPU
              </Badge>
            </div>
            <h2 className="section-title mb-1">
              Giảng viên xuất sắc
            </h2>
            <p className="text-slate-600 text-sm">
              Tìm kiếm nhanh thông tin giảng viên, ban giám hiệu và lãnh đạo các đơn vị
            </p>
          </div>

          {/* Search Input wired to Zustand store */}
          <div className="w-full md:w-80 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Tìm theo tên, học vị, chức vụ..."
              value={lecturerFilter}
              onChange={(e) => setLecturerFilter(e.target.value)}
              className="pl-10 pr-9 h-11 bg-white rounded-full border-slate-200 shadow-sm focus-visible:ring-school-navy"
            />
            {lecturerFilter && (
              <button
                onClick={() => setLecturerFilter("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Xóa bộ lọc"
              >
                <X size={16} />
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
                  <Card className="h-full border-slate-100 shadow-sm hover:shadow-xl transition-shadow rounded-2xl overflow-hidden bg-white">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="relative mb-4">
                        <Image
                          src={lec.image}
                          alt={lec.name}
                          width={110}
                          height={110}
                          className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-4 border-slate-50 shadow-md"
                        />
                        <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-school-navy text-white shadow-sm">
                          <UserCheck size={12} />
                        </div>
                      </div>

                      <h3 className="font-bold text-base text-school-navy mb-1 line-clamp-1">
                        {lec.name}
                      </h3>
                      <span className="text-xs font-semibold text-epu-orange mb-1">
                        {lec.field}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {lec.role}
                      </span>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 shadow-sm">
            Không tìm thấy giảng viên phù hợp với từ khóa &ldquo;{lecturerFilter}&rdquo;.
          </div>
        )}
      </div>
    </section>
  );
}
