"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  FileText,
  GraduationCap,
  Bell,
  Image as ImageIcon,
  ExternalLink,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CmsArticle {
  id: string;
  title: string;
  category: "news" | "program" | "announcement" | "banner";
  categoryLabel: string;
  author: string;
  updatedAt: string;
  status: "published" | "draft" | "pending";
  views: number;
}

const MOCK_CMS_ITEMS: CmsArticle[] = [
  {
    id: "cms-1",
    title: "Đề án tuyển sinh trình độ đại học chính quy năm 2026",
    category: "announcement",
    categoryLabel: "Thông báo tuyển sinh",
    author: "Ban Tuyển sinh",
    updatedAt: "15/10/2026",
    status: "published",
    views: 4520,
  },
  {
    id: "cms-2",
    title: "Chương trình đào tạo chất lượng cao ngành Công nghệ thông tin",
    category: "program",
    categoryLabel: "Thông tin ngành học",
    author: "Khoa CNTT",
    updatedAt: "12/10/2026",
    status: "published",
    views: 3180,
  },
  {
    id: "cms-3",
    title: "Ngày hội tư vấn tuyển sinh và hướng nghiệp EPU Open Day 2026",
    category: "news",
    categoryLabel: "Bài viết & Tin tức",
    author: "Phòng Truyền thông",
    updatedAt: "08/10/2026",
    status: "published",
    views: 1890,
  },
  {
    id: "cms-4",
    title: "Chính sách học bổng khuyến khích học tập và tài trợ doanh nghiệp 2026",
    category: "news",
    categoryLabel: "Bài viết & Tin tức",
    author: "Phòng Đào tạo",
    updatedAt: "04/10/2026",
    status: "published",
    views: 2450,
  },
  {
    id: "cms-5",
    title: "Banner tuyển sinh đại học chính quy đợt 1 năm 2026",
    category: "banner",
    categoryLabel: "Banner & Trang tĩnh",
    author: "Phòng Truyền thông",
    updatedAt: "01/10/2026",
    status: "draft",
    views: 320,
  },
];

export default function AdminCmsPage() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const tabs = [
    { id: "all", label: "Tất cả nội dung", icon: FileText, count: MOCK_CMS_ITEMS.length },
    {
      id: "news",
      label: "Bài viết & Tin tức",
      icon: FileText,
      count: MOCK_CMS_ITEMS.filter((i) => i.category === "news").length,
    },
    {
      id: "program",
      label: "Thông tin ngành học",
      icon: GraduationCap,
      count: MOCK_CMS_ITEMS.filter((i) => i.category === "program").length,
    },
    {
      id: "announcement",
      label: "Thông báo tuyển sinh",
      icon: Bell,
      count: MOCK_CMS_ITEMS.filter((i) => i.category === "announcement").length,
    },
    {
      id: "banner",
      label: "Banner & Trang tĩnh",
      icon: ImageIcon,
      count: MOCK_CMS_ITEMS.filter((i) => i.category === "banner").length,
    },
  ];

  const filteredItems = MOCK_CMS_ITEMS.filter((item) => {
    const matchesTab = activeTab === "all" || item.category === activeTab;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#0866F5]/10 dark:bg-[#0866F5]/20 text-[#0866F5] rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#07164F] dark:text-white">
                Quản lý nội dung CMS
              </h1>
              <p className="text-xs text-[#667DAA] dark:text-[#9CB1D3]">
                Quản lý bài viết, thông báo tuyển sinh, chương trình đào tạo và trang tĩnh EPU
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0866F5] hover:bg-[#0756B5] rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm bài viết mới</span>
          </button>
        </div>
      </div>

      {/* Tabs bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E3ECF8] dark:border-[#253B5B]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                isActive
                  ? "bg-[#0866F5] text-white shadow-sm"
                  : "text-[#667DAA] dark:text-[#9CB1D3] hover:text-[#07164F] dark:hover:text-white hover:bg-[#F0F5FD] dark:hover:bg-[#142640]"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px]",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-[#E3ECF8] dark:bg-[#253B5B] text-[#667DAA] dark:text-[#9CB1D3]"
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and filters bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#0B1930] p-4 rounded-xl border border-[#E3ECF8] dark:border-[#253B5B] shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#667DAA] dark:text-[#9CB1D3]" />
          <input
            type="text"
            placeholder="Tìm kiếm nội dung..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#E3ECF8] dark:border-[#253B5B] bg-[#F8FAFC] dark:bg-[#142640] text-[#07164F] dark:text-white placeholder-[#667DAA] focus:outline-none focus:ring-2 focus:ring-[#0866F5]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#667DAA] dark:text-[#9CB1D3] hover:text-[#07164F] dark:hover:text-white bg-[#F8FAFC] dark:bg-[#142640] border border-[#E3ECF8] dark:border-[#253B5B] rounded-lg transition-colors"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Bộ lọc trạng thái</span>
          </button>
        </div>
      </div>

      {/* Content table */}
      <div className="bg-white dark:bg-[#0B1930] rounded-xl border border-[#E3ECF8] dark:border-[#253B5B] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] dark:bg-[#142640] border-b border-[#E3ECF8] dark:border-[#253B5B] text-[#667DAA] dark:text-[#9CB1D3] font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Tiêu đề bài viết</th>
                <th className="px-4 py-3.5">Danh mục</th>
                <th className="px-4 py-3.5">Tác giả</th>
                <th className="px-4 py-3.5">Cập nhật</th>
                <th className="px-4 py-3.5">Lượt xem</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3ECF8] dark:divide-[#253B5B] text-[#07164F] dark:text-[#F1F6FF]">
              {filteredItems.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-[#F0F5FD]/50 dark:hover:bg-[#142640]/50 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-sm text-[#07164F] dark:text-white line-clamp-1 hover:text-[#0866F5] cursor-pointer">
                      {item.title}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="px-2 py-1 rounded-md text-[11px] font-medium bg-[#E3ECF8] dark:bg-[#1E3048] text-[#0866F5] dark:text-[#238BFF]">
                      {item.categoryLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-[#667DAA] dark:text-[#9CB1D3]">
                    {item.author}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-[#667DAA] dark:text-[#9CB1D3]">
                    {item.updatedAt}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-[#667DAA] dark:text-[#9CB1D3]">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{item.views.toLocaleString("vi-VN")}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {item.status === "published" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#DCFCE7] dark:bg-[#064E3B] text-[#16A34A] dark:text-[#4ADE80]">
                        <CheckCircle2 className="w-3 h-3" />
                        Xuất bản
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF3C7] dark:bg-[#78350F] text-[#D97706] dark:text-[#FBBF24]">
                        <Clock className="w-3 h-3" />
                        Bản nháp
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2 text-[#667DAA] dark:text-[#9CB1D3]">
                      <button
                        type="button"
                        className="p-1.5 hover:text-[#0866F5] hover:bg-[#F0F5FD] dark:hover:bg-[#142640] rounded-md transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
