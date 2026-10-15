"use client";

import React from "react";
import Link from "next/link";
import { FileText, Users, BarChart3, ArrowRight } from "lucide-react";
import { QuickActionItem } from "@/types/admin";
import { cn } from "@/lib/utils";

interface QuickActionCardsProps {
  actions: QuickActionItem[];
}

export function QuickActionCards({ actions }: QuickActionCardsProps) {
  const getThemeClasses = (accent: "blue" | "green" | "purple") => {
    switch (accent) {
      case "blue":
        return {
          wrapper:
            "bg-[#F0F6FF] dark:bg-[#0C2142] border-[#D5E5FF] dark:border-[#1E3B68] hover:border-[#0866F5] dark:hover:border-[#238BFF]",
          iconBg: "bg-[#0866F5] dark:bg-[#238BFF] text-white shadow-sm",
          arrowBg: "bg-[#0866F5] dark:bg-[#238BFF] text-white",
          title: "text-[#07164F] dark:text-white",
          desc: "text-[#667DAA] dark:text-[#9CB1D3]",
        };
      case "green":
        return {
          wrapper:
            "bg-[#F0FDF7] dark:bg-[#092B21] border-[#D1F7E5] dark:border-[#134F3D] hover:border-[#10B981] dark:hover:border-[#00D49A]",
          iconBg: "bg-[#10B981] dark:bg-[#00D49A] text-white dark:text-[#062018] shadow-sm",
          arrowBg: "bg-[#10B981] dark:bg-[#00D49A] text-white dark:text-[#062018]",
          title: "text-[#07164F] dark:text-white",
          desc: "text-[#667DAA] dark:text-[#9CB1D3]",
        };
      case "purple":
        return {
          wrapper:
            "bg-[#F8F5FF] dark:bg-[#201538] border-[#EAE0FF] dark:border-[#3D2866] hover:border-[#8B5CF6] dark:hover:border-[#A855F7]",
          iconBg: "bg-[#8B5CF6] dark:bg-[#A855F7] text-white shadow-sm",
          arrowBg: "bg-[#8B5CF6] dark:bg-[#A855F7] text-white",
          title: "text-[#07164F] dark:text-white",
          desc: "text-[#667DAA] dark:text-[#9CB1D3]",
        };
    }
  };

  const getIcon = (accent: "blue" | "green" | "purple") => {
    switch (accent) {
      case "blue":
        return FileText;
      case "green":
        return Users;
      case "purple":
        return BarChart3;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {actions.map((action) => {
        const theme = getThemeClasses(action.accent);
        const Icon = getIcon(action.accent);

        return (
          <Link
            key={action.id}
            href={action.href}
            className={cn(
              "flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 group shadow-sm hover:shadow-md",
              theme.wrapper
            )}
          >
            {/* Left: Icon & Text */}
            <div className="flex items-center gap-3.5 min-w-0 pr-2">
              <div
                className={cn(
                  "p-3 rounded-xl shrink-0 transition-transform duration-200 group-hover:scale-105",
                  theme.iconBg
                )}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <h3 className={cn("text-sm font-bold truncate", theme.title)}>
                  {action.title}
                </h3>
                <p className={cn("text-xs mt-0.5 truncate", theme.desc)}>
                  {action.description}
                </p>
              </div>
            </div>

            {/* Right: Round Arrow Button */}
            <div
              className={cn(
                "p-2 rounded-full shrink-0 transition-transform duration-200 group-hover:translate-x-1",
                theme.arrowBg
              )}
            >
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
