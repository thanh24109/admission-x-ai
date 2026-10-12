"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  variant?: "ghost" | "outline" | "default";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({
  variant = "ghost",
  size = "icon",
  className,
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant={variant}
        size={size}
        className={cn("h-9 w-9 rounded-full", className)}
        aria-label="Chuyển đổi giao diện"
      >
        <Sun className="h-4 w-4 opacity-50" />
      </Button>
    );
  }

  const currentIcon = () => {
    if (theme === "system") {
      return <Laptop className="h-4 w-4" />;
    }
    return resolvedTheme === "dark" ? (
      <Moon className="h-4 w-4" />
    ) : (
      <Sun className="h-4 w-4" />
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(
            "rounded-full transition-colors",
            size === "icon" ? "h-9 w-9" : "",
            className
          )}
          aria-label="Chuyển đổi giao diện (Sáng / Tối / Hệ thống)"
          title="Giao diện: Sáng / Tối / Hệ thống"
        >
          {currentIcon()}
          {showLabel && (
            <span className="ml-2 text-xs font-medium">
              {theme === "light"
                ? "Sáng"
                : theme === "dark"
                ? "Tối"
                : "Hệ thống"}
            </span>
          )}
          <span className="sr-only">Chuyển đổi giao diện</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="flex items-center justify-between text-xs font-medium cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-amber-500" />
            <span>Sáng</span>
          </div>
          {theme === "light" && <Check className="h-3.5 w-3.5 text-epu-orange" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="flex items-center justify-between text-xs font-medium cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-sky-400" />
            <span>Tối</span>
          </div>
          {theme === "dark" && <Check className="h-3.5 w-3.5 text-epu-orange" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="flex items-center justify-between text-xs font-medium cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Laptop className="h-4 w-4 text-slate-400" />
            <span>Hệ thống</span>
          </div>
          {theme === "system" && <Check className="h-3.5 w-3.5 text-epu-orange" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
