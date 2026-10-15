import React from "react";
import { CandidateLayout } from "@/components/candidate/layout/CandidateLayout";
import Link from "next/link";
import { Clock, ArrowLeft, MessageSquare } from "lucide-react";

export default function CandidateConversationsPage() {
  return (
    <CandidateLayout>
      <div className="flex items-center gap-2 text-xs text-[#64748B] mb-2">
        <Link href="/candidate" className="hover:text-[#0866D9] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về Tổng quan</span>
        </Link>
        <span>/</span>
        <span className="text-[#0B1D49] dark:text-white font-medium">Lịch sử hội thoại</span>
      </div>

      <div className="bg-white dark:bg-[#0A1730] border border-[#E3ECF8] dark:border-[#1E3250] rounded-2xl p-6 sm:p-8 shadow-2xs">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-[#EBF3FE] dark:bg-[#122A4E] text-[#0866D9] dark:text-[#388BFD] flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#0B1D49] dark:text-white">Lịch sử hội thoại với AI</h1>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">12 phiên trao đổi đã lưu trong kỳ tuyển sinh 2026</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {[
            { title: "Hỏi về điểm chuẩn ngành Công nghệ thông tin 2024 - 2025", date: "Hôm nay, 14:30", count: "8 tin nhắn" },
            { title: "Phương thức xét tuyển bằng học bạ THPT kỳ 1", date: "Hôm qua, 09:15", count: "14 tin nhắn" },
            { title: "Chính sách học bổng khuyến khích học tập tại EPU", date: "12/04/2026", count: "6 tin nhắn" },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-[#F4F8FD] dark:hover:bg-[#12223C] transition-all">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-[#0866D9]" />
                <div>
                  <h4 className="text-sm font-semibold text-[#0B1D49] dark:text-white">{item.title}</h4>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{item.date} • {item.count}</p>
                </div>
              </div>
              <Link href="/candidate/chat" className="text-xs font-semibold text-[#0866D9] hover:underline">
                Xem lại →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </CandidateLayout>
  );
}
