"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  User,
  LogOut,
  Settings,
  HelpCircle,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CandidateProfile } from "@/types/candidate";

interface CandidateTopbarProps {
  profile: CandidateProfile;
  onToggleSidebar?: () => void;
}

export function CandidateTopbar({
  profile,
  onToggleSidebar,
}: CandidateTopbarProps) {
  const { theme, setTheme } = useTheme();
  const [hasUnread, setHasUnread] = useState(profile.unreadCount > 0);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-7 bg-white dark:bg-[#0A1730] border-b border-[#E3ECF8] dark:border-[#1E3250] transition-colors">
      {/* 1. Left: Hamburger & Search Input */}
      <div className="flex items-center gap-3 md:gap-5 flex-1 max-w-2xl">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 -ml-2 rounded-xl text-[#64748B] hover:text-[#07164F] dark:text-[#94A3B8] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#12223C] lg:hidden transition-colors"
          aria-label="Mở menu điều hướng"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Bar */}
        <div className="relative w-full max-w-md hidden sm:block">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#94A3B8]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm ngành học, thông tin tuyển sinh, học phí..."
            className="w-full pl-10 pr-16 py-2 text-xs md:text-sm bg-[#F4F8FD] dark:bg-[#12223C] border border-[#E3ECF8] dark:border-[#1E3250] rounded-xl text-[#0B1D49] dark:text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#0866D9] focus:bg-white dark:focus:bg-[#0F1E38] focus:ring-2 focus:ring-[#0866D9]/15 transition-all"
          />
          <kbd className="absolute inset-y-2 right-2.5 flex items-center px-2 py-0.5 text-[10px] font-semibold text-[#64748B] dark:text-[#94A3B8] bg-white dark:bg-[#1C3660] border border-[#E3ECF8] dark:border-[#253B5B] rounded-md shadow-2xs pointer-events-none">
            Ctrl K
          </kbd>
        </div>
      </div>

      {/* 2. Right: Notification, Theme, User Profile */}
      <div className="flex items-center gap-2.5 md:gap-4">
        {/* Mobile Search Button */}
        <button
          type="button"
          className="p-2 rounded-xl text-[#64748B] hover:text-[#07164F] hover:bg-slate-100 dark:text-[#94A3B8] dark:hover:text-white dark:hover:bg-[#12223C] sm:hidden"
          aria-label="Tìm kiếm"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Notification Bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="relative p-2 rounded-xl text-[#64748B] dark:text-[#94A3B8] hover:text-[#0866D9] dark:hover:text-white hover:bg-[#F4F8FD] dark:hover:bg-[#12223C] transition-colors focus:outline-none"
              aria-label="Thông báo"
            >
              <Bell className="w-5 h-5" />
              {hasUnread && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#EF4444] text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-[#0A1730]">
                  {profile.unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-80 p-2 bg-white dark:bg-[#0F1E38] border-[#E3ECF8] dark:border-[#1E3250] shadow-lg rounded-xl"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#E3ECF8] dark:border-[#1E3250]">
              <span className="font-semibold text-sm text-[#0B1D49] dark:text-white">
                Thông báo mới
              </span>
              <button
                type="button"
                onClick={() => setHasUnread(false)}
                className="text-xs text-[#0866D9] hover:underline"
              >
                Đánh dấu đã đọc
              </button>
            </div>
            <div className="py-1 divide-y divide-slate-100 dark:divide-slate-800">
              <div className="p-2.5 hover:bg-[#F4F8FD] dark:hover:bg-[#172D4D] rounded-lg transition-colors cursor-pointer">
                <p className="text-xs font-semibold text-[#0B1D49] dark:text-white">
                  Đã có thông báo tuyển sinh mới năm 2026
                </p>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  10 phút trước • Ban tuyển sinh EPU
                </p>
              </div>
              <div className="p-2.5 hover:bg-[#F4F8FD] dark:hover:bg-[#172D4D] rounded-lg transition-colors cursor-pointer">
                <p className="text-xs font-semibold text-[#0B1D49] dark:text-white">
                  Yêu cầu tư vấn của bạn đã được phản hồi
                </p>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  2 giờ trước • Ban tư vấn
                </p>
              </div>
              <div className="p-2.5 hover:bg-[#F4F8FD] dark:hover:bg-[#172D4D] rounded-lg transition-colors cursor-pointer">
                <p className="text-xs font-semibold text-[#0B1D49] dark:text-white">
                  Nhắc nhở: Mốc đăng ký xét tuyển đợt 1
                </p>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  1 ngày trước
                </p>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-xl text-[#64748B] dark:text-[#94A3B8] hover:text-[#0866D9] dark:hover:text-white hover:bg-[#F4F8FD] dark:hover:bg-[#12223C] transition-colors"
          aria-label="Chuyển chế độ sáng/tối"
        >
          <Sun className="w-5 h-5 hidden dark:block text-amber-400" />
          <Moon className="w-5 h-5 block dark:hidden text-[#64748B]" />
        </button>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-3 pl-1.5 pr-2 py-1 rounded-xl hover:bg-[#F4F8FD] dark:hover:bg-[#12223C] transition-colors focus:outline-none"
            >
              <div className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-[#0866D9]/20 shadow-xs shrink-0">
                <Image
                  src={profile.avatarUrl}
                  alt={profile.name}
                  width={36}
                  height={36}
                  className="object-cover w-full h-full"
                />
              </div>

              <div className="hidden md:flex flex-col text-left">
                <span className="text-sm font-bold text-[#0B1D49] dark:text-white leading-tight">
                  {profile.name}
                </span>
                <span className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-tight">
                  {profile.role}
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 p-1.5 bg-white dark:bg-[#0F1E38] border-[#E3ECF8] dark:border-[#1E3250] shadow-lg rounded-xl"
          >
            <div className="px-3 py-2 border-b border-[#E3ECF8] dark:border-[#1E3250]">
              <p className="text-sm font-bold text-[#0B1D49] dark:text-white">{profile.name}</p>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{profile.role} • EPU</p>
            </div>
            <div className="py-1">
              <DropdownMenuItem asChild>
                <Link
                  href="/candidate/profile"
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer hover:bg-[#F4F8FD] dark:hover:bg-[#172D4D]"
                >
                  <User className="w-4 h-4 text-[#64748B]" />
                  Hồ sơ cá nhân
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/candidate/support"
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer hover:bg-[#F4F8FD] dark:hover:bg-[#172D4D]"
                >
                  <HelpCircle className="w-4 h-4 text-[#64748B]" />
                  Trợ giúp & Hỗ trợ
                </Link>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator className="bg-[#E3ECF8] dark:bg-[#1E3250]" />
            <DropdownMenuItem asChild>
              <Link
                href="/login"
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 rounded-lg cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
