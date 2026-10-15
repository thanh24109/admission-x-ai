import React from "react";
import { CandidateLayout } from "@/components/candidate/layout/CandidateLayout";
import Link from "next/link";
import { Bot, ArrowLeft } from "lucide-react";

export default function CandidateChatPage() {
  return (
    <CandidateLayout>
      <div className="flex items-center gap-2 text-xs text-[#64748B] mb-2">
        <Link href="/candidate" className="hover:text-[#0866D9] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về Tổng quan</span>
        </Link>
        <span>/</span>
        <span className="text-[#0B1D49] dark:text-white font-medium">Chat AI</span>
      </div>

      <div className="bg-white dark:bg-[#0A1730] border border-[#E3ECF8] dark:border-[#1E3250] rounded-2xl p-8 text-center max-w-xl mx-auto my-12 shadow-2xs">
        <div className="w-16 h-16 rounded-full bg-[#EBF3FE] dark:bg-[#122A4E] text-[#0866D9] dark:text-[#388BFD] flex items-center justify-center mx-auto mb-4">
          <Bot className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#0B1D49] dark:text-white">
          Trợ lý Tuyển sinh AI — EPU
        </h2>
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-2 leading-relaxed">
          Không gian hội thoại thông minh hỗ trợ giải đáp phương thức xét tuyển, điểm chuẩn các năm, ngành đào tạo và học phí.
        </p>
        <div className="mt-6">
          <Link
            href="/chat"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0866D9] hover:bg-[#0756B5] transition-all shadow-xs"
          >
            Mở cửa sổ Chat công khai →
          </Link>
        </div>
      </div>
    </CandidateLayout>
  );
}
