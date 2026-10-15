"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useTheme } from "next-themes";
import { QuestionCategoryItem } from "@/types/admin";
import { ArrowRight } from "lucide-react";

interface QuestionCategoryChartProps {
  data: QuestionCategoryItem[];
  totalCount?: number;
}

export function QuestionCategoryChart({
  data,
  totalCount = 8532,
}: QuestionCategoryChartProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <div className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-[#101F38] border border-[#E3ECF8] dark:border-[#253B5B] shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-bold text-[#07164F] dark:text-white">
          Phân loại câu hỏi thường gặp
        </h2>
        <Link
          href="/admin/reports/questions"
          className="inline-flex items-center text-xs font-semibold text-[#0866F5] dark:text-[#238BFF] hover:underline"
        >
          <span>Xem chi tiết</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </div>

      {/* Content: Left Donut + Right Legend */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-[260px]">
        {/* Left: Donut Chart with center label */}
        <div className="relative w-[180px] h-[220px] shrink-0 flex items-center justify-center">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as QuestionCategoryItem;
                      return (
                        <div
                          className={`px-2.5 py-1.5 rounded-lg border text-xs shadow-md ${
                            isDark
                              ? "bg-[#0B1930] border-[#253B5B] text-white"
                              : "bg-white border-[#E3ECF8] text-[#07164F]"
                          }`}
                        >
                          <span className="font-semibold">{item.name}: </span>
                          <span>{item.percentage}% ({item.count.toLocaleString("vi-VN")} câu)</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={82}
                  paddingAngle={3}
                  dataKey="count"
                  strokeWidth={0}
                >
                  {data.map((entry) => (
                    <Cell key={`cell-${entry.id}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-[160px] h-[160px] rounded-full border-4 border-slate-200 dark:border-slate-800 animate-pulse" />
          )}

          {/* Donut Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold tracking-tight text-[#07164F] dark:text-white leading-none">
              {totalCount.toLocaleString("vi-VN")}
            </span>
            <span className="text-[11px] font-medium text-[#667DAA] dark:text-[#9CB1D3] mt-1 leading-none">
              hội thoại
            </span>
          </div>
        </div>

        {/* Right: Category Legend */}
        <div className="flex-1 w-full space-y-2 py-1 pr-1 overflow-y-auto no-scrollbar max-h-[220px]">
          {data.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between text-xs py-1 px-1 rounded-md hover:bg-[#F0F5FD] dark:hover:bg-[#142640] transition-colors"
            >
              <div className="flex items-center gap-2 overflow-hidden pr-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-[#07164F] dark:text-[#F1F6FF] truncate font-medium">
                  {category.name}
                </span>
              </div>
              <span className="text-[#667DAA] dark:text-[#9CB1D3] font-semibold shrink-0">
                {category.percentage.toFixed(1).replace(".", ",")}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
