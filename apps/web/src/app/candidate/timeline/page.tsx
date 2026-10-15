import React from "react";
import { CandidateLayout } from "@/components/candidate/layout/CandidateLayout";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { admissionMilestones } from "@/data/candidateMockData";
import { AdmissionTimelineCard } from "@/components/candidate/dashboard/AdmissionTimelineCard";

export default function CandidateTimelinePage() {
  return (
    <CandidateLayout>
      <div className="flex items-center gap-2 text-xs text-[#64748B] mb-2">
        <Link href="/candidate" className="hover:text-[#0866D9] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về Tổng quan</span>
        </Link>
        <span>/</span>
        <span className="text-[#0B1D49] dark:text-white font-medium">Mốc thời gian tuyển sinh</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#0B1D49] dark:text-white">Lộ trình Tuyển sinh Năm 2026</h1>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] mt-0.5">
            Các mốc quan trọng từ công bố đề án, nộp hồ sơ, công bố kết quả đến nhập học chính thức
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <AdmissionTimelineCard milestones={admissionMilestones} />
      </div>
    </CandidateLayout>
  );
}
