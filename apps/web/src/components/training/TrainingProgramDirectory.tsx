"use client";

import React, { useState, useMemo } from "react";
import { TrainingProgram, DegreeFilterType } from "@/types/training";
import { ProgramSearch } from "./ProgramSearch";
import { DegreeFilter } from "./DegreeFilter";
import { ProgramListItem } from "./ProgramListItem";
import { ProgramEmptyState } from "./ProgramEmptyState";
import { ProgramPagination } from "./ProgramPagination";
import { matchesVietnameseSearch } from "@/lib/vietnamese";

interface TrainingProgramDirectoryProps {
  programs: TrainingProgram[];
  basePath?: string;
  pageSize?: number;
}

export function TrainingProgramDirectory({
  programs,
  basePath = "/dao-tao/dai-hoc",
  pageSize = 10,
}: TrainingProgramDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [degreeFilter, setDegreeFilter] = useState<DegreeFilterType>("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Compute filter counts
  const counts = useMemo(() => {
    return {
      all: programs.length,
      engineer: programs.filter((p) => p.degreeType === "ENGINEER").length,
      bachelor: programs.filter((p) => p.degreeType === "BACHELOR").length,
    };
  }, [programs]);

  // Filter programs based on search query and degree filter
  const filteredPrograms = useMemo(() => {
    return programs.filter((program) => {
      // 1. Degree filter
      if (degreeFilter !== "ALL" && program.degreeType !== degreeFilter) {
        return false;
      }

      // 2. Search query (supports code, name, and diacritic-insensitive)
      if (searchQuery.trim()) {
        const query = searchQuery.trim();
        const matchesName = matchesVietnameseSearch(program.name, query);
        const matchesCode = program.code.includes(query);
        const matchesFaculty = program.faculty ? matchesVietnameseSearch(program.faculty, query) : false;

        return matchesName || matchesCode || matchesFaculty;
      }

      return true;
    });
  }, [programs, degreeFilter, searchQuery]);

  // Reset page when filter or search changes
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleFilterChange = (filter: DegreeFilterType) => {
    setDegreeFilter(filter);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchQuery("");
    setDegreeFilter("ALL");
    setCurrentPage(1);
  };

  // Pagination calculation
  const totalPages = Math.ceil(filteredPrograms.length / pageSize) || 1;
  const paginatedPrograms = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPrograms.slice(start, start + pageSize);
  }, [filteredPrograms, currentPage, pageSize]);

  return (
    <section
      className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
      aria-labelledby="training-directory-title"
    >
      {/* Directory Header with Title, Counts, Search & Filters */}
      <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2
              id="training-directory-title"
              className="text-lg font-bold text-school-navy dark:text-slate-100"
            >
              Danh mục ngành đào tạo đại học
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {filteredPrograms.length === programs.length
                ? `${programs.length} ngành/chương trình hệ chính quy`
                : `Tìm thấy ${filteredPrograms.length} trên tổng số ${programs.length} ngành/chương trình`}
            </p>
          </div>

          {/* Degree Filter Tabs */}
          <DegreeFilter
            selected={degreeFilter}
            onChange={handleFilterChange}
            counts={counts}
          />
        </div>

        {/* Search Bar */}
        <div>
          <ProgramSearch
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Tìm kiếm theo tên ngành, mã ngành hoặc khoa..."
          />
        </div>
      </div>

      {/* Program List or Empty State */}
      {paginatedPrograms.length > 0 ? (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {paginatedPrograms.map((program) => (
            <ProgramListItem
              key={program.id}
              program={program}
              basePath={basePath}
            />
          ))}
        </div>
      ) : (
        <ProgramEmptyState
          onReset={handleReset}
          searchQuery={searchQuery}
        />
      )}

      {/* Pagination Controls */}
      <ProgramPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredPrograms.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </section>
  );
}
