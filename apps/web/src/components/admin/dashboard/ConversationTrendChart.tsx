"use client";

import React, { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "next-themes";
import { ConversationTrendPoint } from "@/types/admin";

interface ConversationTrendChartProps {
  data: ConversationTrendPoint[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  isDark?: boolean;
}

function CustomTooltip({ active, payload, label, isDark }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div
        className={`px-3 py-2.5 rounded-xl border text-xs shadow-lg transition-all ${
          isDark
            ? "bg-[#0B1930] border-[#253B5B] text-white"
            : "bg-white border-[#0866F5]/30 text-[#07164F]"
        }`}
      >
        <p className="font-bold mb-1.5 text-center border-b pb-1 border-slate-200 dark:border-slate-700">
          {label}/10/2026
        </p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0866F5]" />
            <span className="text-[#667DAA] dark:text-[#9CB1D3]">Tổng hội thoại:</span>
            <span className="font-bold">{payload[0]?.value}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
            <span className="text-[#667DAA] dark:text-[#9CB1D3]">Chuyển tư vấn:</span>
            <span className="font-bold">{payload[1]?.value}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function ConversationTrendChart({ data }: ConversationTrendChartProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <div className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-[#101F38] border border-[#E3ECF8] dark:border-[#253B5B] shadow-sm">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <h2 className="text-base font-bold text-[#07164F] dark:text-white">
          Lượt hội thoại AI theo thời gian
        </h2>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-[#07164F] dark:text-[#F1F6FF]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0866F5]" />
            <span>Tổng hội thoại</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#667DAA] dark:text-[#9CB1D3]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]" />
            <span>Hội thoại chuyển tư vấn</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-[260px]">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                {/* Blue Area Gradient for Total Conversations */}
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0866F5" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0866F5" stopOpacity={0.0} />
                </linearGradient>
                {/* Light Blue Area Gradient for Handovers */}
                <linearGradient id="colorHandovers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={true}
                horizontal={true}
                stroke={isDark ? "#1C2E4A" : "#EDF2F9"}
              />

              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={{ stroke: isDark ? "#253B5B" : "#E2E8F0" }}
                tick={{
                  fill: isDark ? "#9CB1D3" : "#667DAA",
                  fontSize: 11,
                  fontWeight: 500,
                }}
              />

              <YAxis
                domain={[0, 500]}
                ticks={[0, 100, 200, 300, 400, 500]}
                tickLine={false}
                axisLine={{ stroke: isDark ? "#253B5B" : "#E2E8F0" }}
                tick={{
                  fill: isDark ? "#9CB1D3" : "#667DAA",
                  fontSize: 11,
                  fontWeight: 500,
                }}
              />

              <Tooltip
                content={<CustomTooltip isDark={isDark} />}
                cursor={{
                  stroke: isDark ? "#253B5B" : "#CBD5E1",
                  strokeWidth: 1,
                  strokeDasharray: "3 3",
                }}
              />

              {/* Total Conversations Area */}
              <Area
                type="monotone"
                dataKey="total"
                stroke="#0866F5"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorTotal)"
                activeDot={{ r: 5, fill: "#0866F5", stroke: "#FFFFFF", strokeWidth: 2 }}
              />

              {/* Handovers Area */}
              <Area
                type="monotone"
                dataKey="handovers"
                stroke="#38BDF8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorHandovers)"
                activeDot={{ r: 4, fill: "#38BDF8", stroke: "#FFFFFF", strokeWidth: 1.5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900/20 rounded-xl animate-pulse">
            <span className="text-xs text-muted-foreground">Đang tải biểu đồ xu hướng...</span>
          </div>
        )}
      </div>
    </div>
  );
}
