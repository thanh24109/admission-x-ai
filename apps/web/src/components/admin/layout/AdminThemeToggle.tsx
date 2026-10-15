"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminThemeToggleProps {
  className?: string;
}

export function AdminThemeToggle({ className }: AdminThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "flex items-center p-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-[#071326] w-[72px] h-[36px]",
          className
        )}
      >
        <div className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center">
          <Sun className="w-4 h-4 text-amber-500" />
        </div>
      </div>
    );
  }

  const isDark = resolvedTheme === "dark" || theme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Chuyển đổi giao diện Sáng / Tối"
      title={`Chuyển sang giao diện ${isDark ? "Sáng" : "Tối"}`}
      onClick={handleToggle}
      className={cn(
        "relative flex items-center justify-between p-1 rounded-full transition-colors duration-200 cursor-pointer select-none",
        "w-[76px] h-[36px]",
        // Outer capsule styling matching reference
        isDark
          ? "bg-[#071326] border border-[#253B5B] shadow-inner"
          : "bg-[#F0F5FD] border border-[#D5E3F7] shadow-inner",
        className
      )}
    >
      {/* Sliding Active Pill Indicator */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-1 bottom-1 w-[32px] rounded-full transition-all duration-200 ease-out flex items-center justify-center shadow-sm",
          isDark
            ? "translate-x-[36px] bg-[#238BFF] text-white shadow-[0_0_10px_rgba(35,139,255,0.4)]"
            : "translate-x-0 bg-white text-amber-500 shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
        )}
      />

      {/* Sun Icon (Left) */}
      <span
        className={cn(
          "relative z-10 flex items-center justify-center w-[32px] h-[28px] transition-colors duration-200",
          !isDark ? "text-amber-500" : "text-slate-400 hover:text-slate-200"
        )}
      >
        <Sun className="w-4 h-4" />
      </span>

      {/* Moon Icon (Right) */}
      <span
        className={cn(
          "relative z-10 flex items-center justify-center w-[32px] h-[28px] transition-colors duration-200",
          isDark ? "text-white" : "text-slate-400 hover:text-slate-600"
        )}
      >
        <Moon className="w-4 h-4" />
      </span>
    </button>
  );
}
