import React from "react";
import { CandidateLayout } from "@/components/candidate/layout/CandidateLayout";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { recentSupportTickets } from "@/data/candidateMockData";
import { RecentSupportTicketsCard } from "@/components/candidate/dashboard/RecentSupportTicketsCard";

export default function CandidateSupportPage() {
  return (
    <CandidateLayout>
      <div className="flex items-center gap-2 text-xs text-[#64748B] mb-2">
        <Link href="/candidate" className="hover:text-[#0866D9] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về Tổng quan</span>
        </Link>
        <span>/</span>
        <span className="text-[#0B1D49] dark:text-white font-medium">Yêu cầu tư vấn</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#0B1D49] dark:text-white">Yêu cầu tư vấn & Hỗ trợ</h1>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] mt-0.5">
            Quản lý các câu hỏi tư vấn tuyển sinh gửi tới cán bộ tư vấn EPU
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#0866D9] hover:bg-[#0756B5] transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo yêu cầu mới</span>
        </button>
      </div>

      <div className="max-w-2xl">
        <RecentSupportTicketsCard tickets={recentSupportTickets} />
      </div>
    </CandidateLayout>
  );
}
