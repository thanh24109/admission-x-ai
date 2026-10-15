import React from "react";
import { CandidateLayout } from "@/components/candidate/layout/CandidateLayout";
import Link from "next/link";
import { Bell, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function CandidateNotificationsPage() {
  return (
    <CandidateLayout>
      <div className="flex items-center gap-2 text-xs text-[#64748B] mb-2">
        <Link href="/candidate" className="hover:text-[#0866D9] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về Tổng quan</span>
        </Link>
        <span>/</span>
        <span className="text-[#0B1D49] dark:text-white font-medium">Thông báo</span>
      </div>

      <div className="bg-white dark:bg-[#0A1730] border border-[#E3ECF8] dark:border-[#1E3250] rounded-2xl p-6 sm:p-8 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF3FE] dark:bg-[#122A4E] text-[#0866D9] dark:text-[#388BFD] flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#0B1D49] dark:text-white">Thông báo tuyển sinh</h1>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Cập nhật thông tin quan trọng từ Ban Tuyển sinh EPU</p>
            </div>
          </div>
          <button type="button" className="text-xs text-[#0866D9] font-medium hover:underline">
            Đánh dấu tất cả đã đọc
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {[
            {
              title: "Đã có đề án tuyển sinh chính thức Đại học chính quy năm 2026",
              time: "10 phút trước",
              unread: true,
              desc: "Nhà trường đã ban hành đề án tuyển sinh đại học chính quy năm 2026 với 25 ngành đào tạo mũi nhọn.",
            },
            {
              title: "Yêu cầu tư vấn của bạn về Học bổng đã được cán bộ phản hồi",
              time: "2 giờ trước",
              unread: true,
              desc: "Cán bộ tư vấn đã gửi phản hồi chi tiết về điều kiện và mức học bổng khuyến khích học tập.",
            },
            {
              title: "Nhắc nhở: Chuẩn bị hồ sơ đăng ký xét tuyển đợt 1",
              time: "1 ngày trước",
              unread: false,
              desc: "Hệ thống xét tuyển trực tuyến sẽ chính thức mở cổng tiếp nhận từ ngày 15/04/2026.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all ${
                item.unread
                  ? "bg-[#F4F8FD] dark:bg-[#12223C] border-[#0866D9]/30"
                  : "bg-white dark:bg-[#0A1730] border-slate-100 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#0B1D49] dark:text-white flex items-center gap-2">
                  {item.unread && <span className="w-2 h-2 rounded-full bg-[#0866D9]" />}
                  {item.title}
                </h4>
                <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">{item.time}</span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1.5 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </CandidateLayout>
  );
}
