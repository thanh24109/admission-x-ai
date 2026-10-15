"use client";

import React from "react";
import { Search, X } from "lucide-react";

interface ProgramSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ProgramSearch({
  value,
  onChange,
  placeholder = "Tìm kiếm theo tên ngành hoặc mã ngành...",
}: ProgramSearchProps) {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
        <Search className="w-4 h-4" />
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 pl-10 pr-9 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-school-navy dark:focus:ring-amber-400 focus:border-transparent transition-all shadow-sm"
        aria-label="Tìm kiếm chương trình đào tạo"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          aria-label="Xóa nội dung tìm kiếm"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
