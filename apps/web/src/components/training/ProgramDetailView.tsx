"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  FileText,
  ExternalLink,
  Building2,
  CheckCircle2,
  Download,
  Sparkles,
} from "lucide-react";
import { TrainingProgram } from "@/types/training";
import { TrainingBreadcrumb } from "./TrainingBreadcrumb";
import { TrainingNavigation } from "./TrainingNavigation";
import { Button } from "@/components/ui/button";

interface ProgramDetailViewProps {
  program: TrainingProgram;
  basePath?: string;
}

export function ProgramDetailView({
  program,
  basePath = "/dao-tao/dai-hoc",
}: ProgramDetailViewProps) {
  const isEngineer = program.degreeType === "ENGINEER";

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 max-w-7xl">
      {/* Breadcrumb */}
      <TrainingBreadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Đào tạo", href: basePath },
          { label: "Đại học", href: basePath },
          { label: program.name, current: true },
        ]}
      />

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start mt-4">
        {/* Left Column: Detail Content */}
        <article className="space-y-6">
          {/* Header Card */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
            <Link
              href={basePath}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-school-navy dark:hover:text-amber-400 mb-4 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại danh mục ngành</span>
            </Link>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-epu-orange border border-amber-200/60 dark:border-amber-900/40">
                Đại học chính quy
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                Mã ngành: {program.code}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                Bằng: {isEngineer ? "Kỹ sư" : "Cử nhân"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-school-navy dark:text-white tracking-tight leading-tight">
              {program.name}
            </h1>

            {program.faculty && (
              <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>Khoa phụ trách: {program.faculty}</span>
              </p>
            )}

            {/* Quick Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                  Thời gian đào tạo
                </span>
                <span className="text-sm font-bold text-school-navy dark:text-slate-200 mt-0.5 block">
                  {program.duration || (isEngineer ? "4,5 năm" : "4,0 năm")}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                  Hình thức đào tạo
                </span>
                <span className="text-sm font-bold text-school-navy dark:text-slate-200 mt-0.5 block">
                  Chính quy tập trung
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                  Cơ sở cấp bằng
                </span>
                <span className="text-sm font-bold text-school-navy dark:text-slate-200 mt-0.5 block">
                  Trường Đại học Điện lực
                </span>
              </div>
            </div>
          </div>

          {/* Program Overview & Description */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-school-navy dark:text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-school-navy dark:text-amber-400" />
              <span>Mục tiêu và giới thiệu chương trình</span>
            </h2>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {program.description}
            </p>

            {program.curriculumContent && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Cấu trúc khung chương trình
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  {program.curriculumContent}
                </p>
              </div>
            )}
          </div>

          {/* Career Opportunities */}
          {program.careerOpportunities && program.careerOpportunities.length > 0 && (
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-school-navy dark:text-slate-100 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Cơ hội việc làm sau tốt nghiệp</span>
              </h2>

              <ul className="space-y-2.5">
                {program.careerOpportunities.map((career, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{career}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Attachments & Documentation */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-school-navy dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-school-navy dark:text-amber-400" />
              <span>Tài liệu & Đề án chương trình</span>
            </h2>

            {program.attachmentUrl ? (
              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-school-navy dark:text-slate-200 block">
                      Khung chương trình đào tạo {program.name}.pdf
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Tài liệu chính thức do EPU ban hành
                    </span>
                  </div>
                </div>

                <a
                  href={program.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-school-navy hover:bg-epu-orange text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xem tài liệu</span>
                </a>
              </div>
            ) : program.originalAttachmentUrl ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <div>
                  <span className="text-sm font-semibold text-school-navy dark:text-slate-200 block">
                    Cổng thông tin đào tạo Đại học – EPU
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Xem thông tin gốc tại trang chủ đào tạo Trường Đại học Điện lực
                  </span>
                </div>

                <a
                  href={program.originalAttachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-school-navy dark:text-slate-200 hover:text-epu-orange hover:border-amber-400 text-xs font-semibold rounded-xl shadow-sm transition-colors shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Xem tại epu.edu.vn</span>
                </a>
              </div>
            ) : (
              <div className="p-4 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-center">
                Tài liệu chi tiết đang được cập nhật từ Phòng Đào tạo EPU.
              </div>
            )}
          </div>
        </article>

        {/* Right Column: Training Navigation Sidebar */}
        <div className="xl:sticky xl:top-24">
          <TrainingNavigation currentSlug="dai-hoc" />
        </div>
      </div>
    </div>
  );
}
