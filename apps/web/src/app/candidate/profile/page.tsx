import React from "react";
import Image from "next/image";
import Link from "next/link";
import { CandidateLayout } from "@/components/candidate/layout/CandidateLayout";
import { candidateProfile } from "@/data/candidateMockData";
import { User, ArrowLeft, Mail, Phone, MapPin, Calendar } from "lucide-react";

export default function CandidateProfilePage() {
  return (
    <CandidateLayout>
      <div className="flex items-center gap-2 text-xs text-[#64748B] mb-2">
        <Link href="/candidate" className="hover:text-[#0866D9] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về Tổng quan</span>
        </Link>
        <span>/</span>
        <span className="text-[#0B1D49] dark:text-white font-medium">Hồ sơ cá nhân</span>
      </div>

      <div className="bg-white dark:bg-[#0A1730] border border-[#E3ECF8] dark:border-[#1E3250] rounded-2xl p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="relative w-20 h-20 rounded-full overflow-hidden ring-4 ring-[#0866D9]/20 shrink-0">
            <Image
              src={candidateProfile.avatarUrl}
              alt={candidateProfile.name}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0B1D49] dark:text-white">{candidateProfile.name}</h1>
            <p className="text-sm text-[#0866D9] font-medium mt-0.5">{candidateProfile.role} • Kỳ tuyển sinh {candidateProfile.activeCycle}</p>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">Mã thí sinh: TS-2026-9812</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-[#F4F8FD] dark:bg-[#12223C] border border-[#E3ECF8] dark:border-[#1E3250]">
            <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-[#94A3B8] mb-1">
              <Mail className="w-4 h-4 text-[#0866D9]" />
              <span>Email liên hệ</span>
            </div>
            <p className="text-sm font-semibold text-[#0B1D49] dark:text-white">nguyenvanan@gmail.com</p>
          </div>

          <div className="p-4 rounded-xl bg-[#F4F8FD] dark:bg-[#12223C] border border-[#E3ECF8] dark:border-[#1E3250]">
            <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-[#94A3B8] mb-1">
              <Phone className="w-4 h-4 text-[#0866D9]" />
              <span>Số điện thoại</span>
            </div>
            <p className="text-sm font-semibold text-[#0B1D49] dark:text-white">0987 654 321</p>
          </div>

          <div className="p-4 rounded-xl bg-[#F4F8FD] dark:bg-[#12223C] border border-[#E3ECF8] dark:border-[#1E3250]">
            <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-[#94A3B8] mb-1">
              <MapPin className="w-4 h-4 text-[#0866D9]" />
              <span>Trường THPT</span>
            </div>
            <p className="text-sm font-semibold text-[#0B1D49] dark:text-white">THPT Chuyên Hà Nội - Amsterdam</p>
          </div>

          <div className="p-4 rounded-xl bg-[#F4F8FD] dark:bg-[#12223C] border border-[#E3ECF8] dark:border-[#1E3250]">
            <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-[#94A3B8] mb-1">
              <Calendar className="w-4 h-4 text-[#0866D9]" />
              <span>Ngày sinh</span>
            </div>
            <p className="text-sm font-semibold text-[#0B1D49] dark:text-white">15/08/2008</p>
          </div>
        </div>
      </div>
    </CandidateLayout>
  );
}
