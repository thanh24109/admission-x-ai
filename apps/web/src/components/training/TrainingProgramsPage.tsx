"use client";

import React from "react";
import { TrainingProgram } from "@/types/training";
import { TrainingBreadcrumb } from "./TrainingBreadcrumb";
import { TrainingPageHeader } from "./TrainingPageHeader";
import { TrainingProgramDirectory } from "./TrainingProgramDirectory";
import { TrainingNavigation } from "./TrainingNavigation";

interface TrainingProgramsPageProps {
  programs: TrainingProgram[];
  basePath?: string;
}

export function TrainingProgramsPage({
  programs,
  basePath = "/dao-tao/dai-hoc",
}: TrainingProgramsPageProps) {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 max-w-7xl">
      {/* 1. Breadcrumb */}
      <TrainingBreadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Đào tạo", href: basePath },
          { label: "Đại học", current: true },
        ]}
      />

      {/* 2. Main Two-Column Layout (Left 72%, Right 28%) */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start mt-2">
        {/* Left Column: Heading + Directory */}
        <article className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
          <TrainingPageHeader totalPrograms={programs.length} />
          <TrainingProgramDirectory programs={programs} basePath={basePath} pageSize={10} />
        </article>

        {/* Right Column: Training Navigation Sidebar */}
        <div className="xl:sticky xl:top-24">
          <TrainingNavigation currentSlug="dai-hoc" />
        </div>
      </div>
    </div>
  );
}
