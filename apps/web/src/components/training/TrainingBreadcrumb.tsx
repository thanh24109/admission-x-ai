"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface TrainingBreadcrumbProps {
  items?: BreadcrumbItem[];
}

export function TrainingBreadcrumb({
  items = [
    { label: "Trang chủ", href: "/" },
    { label: "Đào tạo", href: "/#training-section" },
    { label: "Đại học", current: true },
  ],
}: TrainingBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center flex-wrap gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
        <li className="inline-flex items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1 hover:text-school-navy dark:hover:text-amber-400 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="sr-only">Trang chủ</span>
          </Link>
        </li>

        {items.map((item, index) => (
          <li key={item.label} className="inline-flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
            {item.current || !item.href ? (
              <span className="text-school-navy dark:text-slate-100 font-semibold" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-school-navy dark:hover:text-amber-400 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
