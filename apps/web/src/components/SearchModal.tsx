"use client";

import React from "react";
import Link from "next/link";
import { Search, FileText, Bell, GraduationCap, Building, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { SPOTLIGHT_NEWS } from "@/data/news";
import { GENERAL_ANNOUNCEMENTS, ADMISSION_ANNOUNCEMENTS } from "@/data/announcements";
import { FACULTIES_DATA } from "@/data/faculties";
import { TRAINING_PROGRAMS } from "@/data/training";

export default function SearchModal() {
  const { isSearchOpen, closeSearch, searchQuery, setSearchQuery } = useAppStore();

  const q = searchQuery.toLowerCase().trim();

  const newsResults = q
    ? SPOTLIGHT_NEWS.filter((n) => n.title.toLowerCase().includes(q))
    : [];

  const announcementResults = q
    ? [...GENERAL_ANNOUNCEMENTS, ...ADMISSION_ANNOUNCEMENTS].filter((a) =>
        a.title.toLowerCase().includes(q)
      )
    : [];

  const facultyResults = q
    ? FACULTIES_DATA.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q)
      )
    : [];

  const trainingResults = q
    ? TRAINING_PROGRAMS.filter((t) => t.name.toLowerCase().includes(q))
    : [];

  const totalResults =
    newsResults.length +
    announcementResults.length +
    facultyResults.length +
    trainingResults.length;

  return (
    <Dialog open={isSearchOpen} onOpenChange={(open) => !open && closeSearch()}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden bg-white rounded-2xl shadow-2xl border-slate-200">
        <DialogHeader className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-epu-orange shrink-0" />
            <DialogTitle className="text-base font-bold text-school-navy flex items-center gap-2">
              <span>Tìm kiếm cổng thông tin EPU</span>
              <Badge variant="secondary" className="text-[10px] uppercase font-bold py-0.5 px-2">
                Live Search
              </Badge>
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Search Input Box */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Nhập từ khóa (vd: tuyển sinh, học phí, công nghệ thông tin, thông báo)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 text-base bg-white border-slate-200 focus-visible:ring-school-navy rounded-xl"
              autoFocus
            />
          </div>
        </div>

        {/* Results Container */}
        <div className="max-h-[460px] overflow-y-auto p-4 space-y-4">
          {!q ? (
            <div className="text-center py-10 space-y-3">
              <div className="inline-flex p-3 rounded-full bg-slate-100 text-slate-400">
                <Sparkles className="h-6 w-6 text-epu-orange" />
              </div>
              <p className="text-sm text-slate-500">
                Nhập từ khóa như <strong>&ldquo;tuyển sinh&rdquo;</strong>, <strong>&ldquo;khoa&rdquo;</strong>, hoặc <strong>&ldquo;học phí&rdquo;</strong> để tra cứu nhanh thông tin EPU.
              </p>
            </div>
          ) : totalResults === 0 ? (
            <div className="text-center py-10 text-sm text-slate-500">
              Không tìm thấy kết quả nào khớp với từ khóa &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-4">
                {/* Khoa đào tạo */}
                {facultyResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-[10px]">
                        Khoa ({facultyResults.length})
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {facultyResults.map((f) => (
                        <a
                          key={f.name}
                          href={f.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={closeSearch}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                        >
                          <Building className="h-4 w-4 text-epu-orange shrink-0" />
                          <span className="text-sm font-semibold text-school-navy">
                            {f.name}
                          </span>
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Bậc đào tạo */}
                {trainingResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        Bậc đào tạo ({trainingResults.length})
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {trainingResults.map((t) => (
                        <Link
                          key={t.name}
                          href={t.href}
                          onClick={closeSearch}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                        >
                          <GraduationCap className="h-4 w-4 text-epu-orange shrink-0" />
                          <span className="text-sm font-semibold text-school-navy">
                            {t.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Tin tức */}
                {newsResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        Tin tức ({newsResults.length})
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {newsResults.map((n) => (
                        <Link
                          key={n.id}
                          href={n.link}
                          onClick={closeSearch}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm text-slate-800"
                        >
                          <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="line-clamp-1">{n.title}</span>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Thông báo */}
                {announcementResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        Thông báo ({announcementResults.length})
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {announcementResults.map((a) => (
                        <Link
                          key={a.id}
                          href={a.postLink || a.link}
                          onClick={closeSearch}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm text-slate-800"
                        >
                          <Bell className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="line-clamp-1">{a.title}</span>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </AnimatePresence>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
