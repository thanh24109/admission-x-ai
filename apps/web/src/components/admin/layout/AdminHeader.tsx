"use client";

import React, { useState } from "react";
import { Search, Bell, Menu, ChevronDown, Check, User, Shield, LogOut } from "lucide-react";
import { AdminThemeToggle } from "./AdminThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminHeaderProps {
  onToggleSidebar?: () => void;
  userName?: string;
  userRole?: string;
}

export function AdminHeader({
  onToggleSidebar,
  userName = "Nguyễn Văn A",
  userRole = "Quản trị viên",
}: AdminHeaderProps) {
  const [hasUnread, setHasUnread] = useState(true);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-[68px] px-6 bg-[#F8FBFF] dark:bg-[#0A1730] border-b border-[#E3ECF8] dark:border-[#253B5B] transition-colors duration-200">
      {/* Left section: Toggle & Global Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Thu gọn hoặc mở rộng thanh điều hướng"
          className="p-2 rounded-lg text-[#667DAA] dark:text-[#9CB1D3] hover:text-[#07164F] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#142640] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div className="relative w-full max-w-[420px]">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#667DAA] dark:text-[#9CB1D3]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm tài liệu, người dùng, hội thoại..."
            aria-label="Tìm kiếm trên hệ thống"
            className="w-full h-10 pl-10 pr-16 text-sm bg-white dark:bg-[#101F38] text-[#07164F] dark:text-[#F1F6FF] placeholder-[#667DAA] dark:placeholder-[#9CB1D3]/70 border border-[#E3ECF8] dark:border-[#253B5B] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0866F5] dark:focus:ring-[#238BFF] focus:border-transparent transition-all shadow-sm"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-[#667DAA] dark:text-[#9CB1D3] bg-[#F0F5FD] dark:bg-[#142640] border border-[#D5E3F7] dark:border-[#253B5B] rounded">
              Ctrl K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right section: Exactly [1. Bell] -> [2. Theme Toggle] -> [3. User Avatar/Name] */}
      <div className="flex items-center gap-4">
        {/* 1. Notification Bell with unread badge */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Thông báo hệ thống"
              className="relative p-2.5 rounded-full text-[#667DAA] dark:text-[#9CB1D3] hover:text-[#07164F] dark:hover:text-white hover:bg-white dark:hover:bg-[#101F38] border border-transparent hover:border-[#E3ECF8] dark:hover:border-[#253B5B] transition-colors"
            >
              <Bell className="w-5 h-5" />
              {hasUnread && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#F43F5E] text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-[#0A1730]">
                  1
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-2 bg-white dark:bg-[#101F38] border-[#E3ECF8] dark:border-[#253B5B] shadow-lg">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#E3ECF8] dark:border-[#253B5B]">
              <span className="font-semibold text-sm text-[#07164F] dark:text-white">Thông báo mới</span>
              <button
                type="button"
                onClick={() => setHasUnread(false)}
                className="text-xs text-[#0866F5] dark:text-[#238BFF] hover:underline"
              >
                Đánh dấu đã đọc
              </button>
            </div>
            <div className="py-2">
              <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-[#F0F5FD] dark:hover:bg-[#142640] transition-colors cursor-pointer">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-[#0866F5] shrink-0" />
                <div className="text-xs">
                  <p className="font-medium text-[#07164F] dark:text-white">
                    Có 1 yêu cầu tư vấn mới cần xử lý từ thí sinh
                  </p>
                  <p className="text-[#667DAA] dark:text-[#9CB1D3] mt-0.5">5 phút trước</p>
                </div>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 2. Theme Toggle Switch (Capsule) - Placed immediately right of bell, immediately left of avatar */}
        <AdminThemeToggle />

        {/* 3. User Avatar and Account Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-xl hover:bg-white dark:hover:bg-[#101F38] border border-transparent hover:border-[#E3ECF8] dark:hover:border-[#253B5B] transition-colors focus:outline-none"
            >
              {/* Avatar circle */}
              <div className="w-9 h-9 rounded-full bg-[#0866F5] dark:bg-[#238BFF] text-white font-semibold text-sm flex items-center justify-center shadow-sm">
                A
              </div>

              {/* Name & Role */}
              <div className="hidden md:flex flex-col text-left">
                <span className="text-sm font-semibold text-[#07164F] dark:text-[#F1F6FF] leading-tight">
                  {userName}
                </span>
                <span className="text-xs text-[#667DAA] dark:text-[#9CB1D3] leading-tight mt-0.5">
                  {userRole}
                </span>
              </div>

              <ChevronDown className="w-4 h-4 text-[#667DAA] dark:text-[#9CB1D3] ml-1" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-[#101F38] border-[#E3ECF8] dark:border-[#253B5B] shadow-lg">
            <div className="px-3 py-1.5 text-xs font-semibold text-[#667DAA] dark:text-[#9CB1D3]">
              Tài khoản quản trị
            </div>
            <div className="px-2 py-1.5 text-sm font-medium text-[#07164F] dark:text-white">
              {userName}
              <div className="text-xs text-[#667DAA] dark:text-[#9CB1D3] font-normal">admin@epu.edu.vn</div>
            </div>
            <DropdownMenuSeparator className="bg-[#E3ECF8] dark:bg-[#253B5B]" />
            <DropdownMenuItem className="text-xs flex items-center gap-2 cursor-pointer text-[#07164F] dark:text-[#F1F6FF] hover:bg-[#F0F5FD] dark:hover:bg-[#142640]">
              <User className="w-3.5 h-3.5 text-[#667DAA] dark:text-[#9CB1D3]" />
              <span>Hồ sơ cá nhân</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs flex items-center gap-2 cursor-pointer text-[#07164F] dark:text-[#F1F6FF] hover:bg-[#F0F5FD] dark:hover:bg-[#142640]">
              <Shield className="w-3.5 h-3.5 text-[#667DAA] dark:text-[#9CB1D3]" />
              <span>Bảo mật & Phân quyền</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#E3ECF8] dark:bg-[#253B5B]" />
            <DropdownMenuItem className="text-xs flex items-center gap-2 cursor-pointer text-[#F43F5E] dark:text-[#FF5577] hover:bg-rose-50 dark:hover:bg-rose-950/30">
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
