"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Bot,
  Clock,
  User,
  Boxes,
  FileText,
  Bell,
  Headphones,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CandidateSidebarProps {
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
  className?: string;
}

interface NavItem {
  id: string;
  title: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: "dashboard", title: "Tổng quan", href: "/candidate", icon: Home },
  { id: "chat", title: "Chat AI", href: "/candidate/chat", icon: Bot },
  { id: "conversations", title: "Lịch sử hội thoại", href: "/candidate/conversations", icon: Clock },
  { id: "profile", title: "Hồ sơ cá nhân", href: "/candidate/profile", icon: User },
  { id: "interests", title: "Ngành quan tâm", href: "/candidate/interests", icon: Boxes },
  { id: "support", title: "Yêu cầu tư vấn", href: "/candidate/support", icon: FileText },
  { id: "notifications", title: "Thông báo", href: "/candidate/notifications", icon: Bell },
];

export function CandidateSidebar({
  isOpenOnMobile = false,
  onCloseMobile,
  className,
}: CandidateSidebarProps) {
  const pathname = usePathname();

  const isItemActive = (href: string) => {
    if (href === "/candidate") {
      return pathname === "/candidate";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenOnMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col w-[260px] bg-white dark:bg-[#0A1730] border-r border-[#E3ECF8] dark:border-[#1E3250] transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpenOnMobile ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        {/* 1. Header / Logo Branding */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E3ECF8] dark:border-[#1E3250]">
          <Link href="/candidate" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 shrink-0">
              <Image
                src="/asset/logo-dark.svg"
                alt="Logo Đại học Điện lực"
                width={36}
                height={36}
                className="object-contain block dark:hidden"
                priority
              />
              <Image
                src="/asset/logo-light.svg"
                alt="Logo Đại học Điện lực"
                width={36}
                height={36}
                className="object-contain hidden dark:block"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-[#07164F] dark:text-white leading-tight uppercase tracking-tight">
                TRƯỜNG ĐẠI HỌC ĐIỆN LỰC
              </span>
              <span className="text-[9.5px] font-medium text-[#64748B] dark:text-[#9CB1D3] leading-tight tracking-wider">
                ELECTRIC POWER UNIVERSITY
              </span>
            </div>
          </Link>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Navigation items */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1.5 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                  active
                    ? "bg-[#EBF3FE] dark:bg-[#122A4E] text-[#0866D9] dark:text-[#3B82F6] font-semibold shadow-xs"
                    : "text-[#5A6F96] dark:text-[#94A3B8] hover:text-[#07164F] dark:hover:text-white hover:bg-[#F4F8FD] dark:hover:bg-[#112340]"
                )}
              >
                {/* Active Indicator Bar on Left */}
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#0866D9] rounded-r-full" />
                )}

                <Icon
                  className={cn(
                    "w-5 h-5 shrink-0 transition-colors",
                    active
                      ? "text-[#0866D9] dark:text-[#3B82F6]"
                      : "text-[#64748B] dark:text-[#94A3B8] group-hover:text-[#0866D9] dark:group-hover:text-[#3B82F6]"
                  )}
                />
                <span className="truncate">{item.title}</span>
              </Link>
            );
          })}
        </div>

        {/* 3. Bottom Support Card */}
        <div className="p-3.5 border-t border-[#E3ECF8] dark:border-[#1E3250]">
          <Link
            href="/candidate/support"
            className="flex items-center justify-between p-3 rounded-2xl bg-[#F4F8FD] dark:bg-[#12223C] border border-[#E3ECF8] dark:border-[#1E3250] hover:border-[#0866D9]/40 hover:bg-[#EBF3FE] dark:hover:bg-[#172D4D] transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#EBF3FE] dark:bg-[#1C3660] text-[#0866D9] dark:text-[#3B82F6] shrink-0">
                <Headphones className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-[#07164F] dark:text-white leading-tight">
                  Cần hỗ trợ?
                </span>
                <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] leading-tight">
                  Liên hệ bộ phận tuyển sinh
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0866D9] transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </aside>
    </>
  );
}
