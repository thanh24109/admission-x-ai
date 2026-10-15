"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Database,
  Users,
  Headphones,
  PieChart,
  Sliders,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

interface NavGroup {
  id: string;
  title: string;
  icon: React.ElementType;
  href?: string;
  children?: { title: string; href: string }[];
}

export function AdminSidebar({
  collapsed = false,
  onToggleCollapse,
  className,
}: AdminSidebarProps) {
  const pathname = usePathname();

  // State for expanded menu groups
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    rag: true,
    users: false,
    consultation: false,
    analytics: false,
    ai_config: false,
    system_log: false,
  });

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const navGroups: NavGroup[] = [
    {
      id: "rag",
      title: "Kho tài liệu RAG",
      icon: Database,
      children: [
        { title: "Tài liệu tuyển sinh", href: "/admin/documents" },
        { title: "Kiểm duyệt tài liệu", href: "/admin/documents/moderation" },
        { title: "Danh mục", href: "/admin/documents/categories" },
        { title: "Lịch sử cập nhật", href: "/admin/documents/history" },
      ],
    },
    {
      id: "users",
      title: "Người dùng",
      icon: Users,
      children: [
        { title: "Danh sách người dùng", href: "/admin/users" },
        { title: "Phân quyền", href: "/admin/users/permissions" },
      ],
    },
    {
      id: "consultation",
      title: "Giám sát tư vấn",
      icon: Headphones,
      children: [
        { title: "Handover từ AI", href: "/admin/handovers" },
        { title: "Thống kê xử lý", href: "/admin/handovers/stats" },
        { title: "Đánh giá chất lượng", href: "/admin/handovers/quality" },
      ],
    },
    {
      id: "analytics",
      title: "Phân tích & Báo cáo",
      icon: PieChart,
      children: [
        { title: "Tổng quan", href: "/admin/reports" },
        { title: "Xu hướng câu hỏi", href: "/admin/reports/questions" },
        { title: "Hiệu suất AI", href: "/admin/reports/ai-performance" },
      ],
    },
    {
      id: "ai_config",
      title: "Cấu hình AI",
      icon: Sliders,
      children: [
        { title: "Mô hình & tham số", href: "/admin/ai-config" },
        { title: "Ngưỡng chuyển tư vấn", href: "/admin/ai-config/thresholds" },
        { title: "Prompt & hướng dẫn", href: "/admin/ai-config/prompts" },
      ],
    },
    {
      id: "system_log",
      title: "Nhật ký hệ thống",
      icon: FileSpreadsheet,
      children: [
        { title: "Lịch sử hoạt động", href: "/admin/logs/activities" },
        { title: "Thao tác quản trị", href: "/admin/logs/admin-actions" },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out z-40 border-r select-none",
        "bg-white dark:bg-[#0B1930] border-[#E3ECF8] dark:border-[#253B5B]",
        collapsed ? "w-[72px]" : "w-[260px]",
        className
      )}
    >
      {/* 1. Header / Logo Section */}
      <div className="flex flex-col px-5 py-4 border-b border-[#E3ECF8] dark:border-[#253B5B]">
        <Link href="/admin" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 shrink-0">
            {/* Light Mode Logo */}
            <Image
              src="/asset/logo-dark.svg"
              alt="Logo Trường Đại học Điện lực"
              width={36}
              height={36}
              className="object-contain block dark:hidden"
              priority
            />
            {/* Dark Mode Logo */}
            <Image
              src="/asset/logo-light.svg"
              alt="Logo Trường Đại học Điện lực"
              width={36}
              height={36}
              className="object-contain hidden dark:block"
              priority
            />
          </div>

          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-[12px] font-bold text-[#07164F] dark:text-white leading-tight uppercase tracking-tight">
                TRƯỜNG ĐẠI HỌC ĐIỆN LỰC
              </span>
              <span className="text-[10px] text-[#667DAA] dark:text-[#9CB1D3] leading-tight">
                ELECTRIC POWER UNIVERSITY
              </span>
            </div>
          )}
        </Link>

        {!collapsed && (
          <div className="mt-3">
            <div className="text-xs font-medium text-[#667DAA] dark:text-[#9CB1D3]">
              Cổng thông tin tuyển sinh
            </div>
            <span className="inline-block mt-1.5 px-2.5 py-0.5 text-[11px] font-semibold bg-[#0866F5] text-white rounded-md shadow-sm">
              Quản trị hệ thống
            </span>
          </div>
        )}
      </div>

      {/* 2. Navigation items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 no-scrollbar">
        {/* Tổng quan (Single Active Item) */}
        <div>
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
              pathname === "/admin"
                ? "bg-[#0866F5] text-white shadow-sm font-semibold"
                : "text-[#667DAA] dark:text-[#9CB1D3] hover:text-[#07164F] dark:hover:text-white hover:bg-[#F0F5FD] dark:hover:bg-[#142640]"
            )}
            title="Tổng quan"
          >
            <Home className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Tổng quan</span>}
          </Link>
        </div>

        {/* Collapsible Menu Groups */}
        {navGroups.map((group) => {
          const Icon = group.icon;
          const isOpen = openGroups[group.id];

          return (
            <div key={group.id} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                  "text-[#07164F] dark:text-[#F1F6FF] hover:bg-[#F0F5FD] dark:hover:bg-[#142640]"
                )}
                title={collapsed ? group.title : undefined}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <Icon className="w-4 h-4 text-[#667DAA] dark:text-[#9CB1D3] shrink-0" />
                  {!collapsed && (
                    <span className="truncate text-xs font-semibold">{group.title}</span>
                  )}
                </div>

                {!collapsed && (
                  <div className="text-[#667DAA] dark:text-[#9CB1D3] shrink-0">
                    {isOpen ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                )}
              </button>

              {/* Sub-items */}
              {!collapsed && isOpen && group.children && (
                <div className="pl-9 pr-2 space-y-1">
                  {group.children.map((child) => {
                    const isChildActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "block py-1.5 px-2 rounded-md text-xs transition-colors",
                          isChildActive
                            ? "text-[#0866F5] dark:text-[#238BFF] font-semibold bg-[#F0F5FD] dark:bg-[#142640]"
                            : "text-[#667DAA] dark:text-[#9CB1D3] hover:text-[#07164F] dark:hover:text-white hover:bg-[#F0F5FD]/60 dark:hover:bg-[#142640]/50"
                        )}
                      >
                        {child.title}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Bottom collapse toggle */}
      <div className="p-3 border-t border-[#E3ECF8] dark:border-[#253B5B]">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-[#667DAA] dark:text-[#9CB1D3] hover:text-[#07164F] dark:hover:text-white hover:bg-[#F0F5FD] dark:hover:bg-[#142640] transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 mx-auto" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Thu gọn menu</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
