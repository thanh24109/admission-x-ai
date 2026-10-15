import React from "react";
import type { Metadata } from "next";
import { CandidateLayout } from "@/components/candidate/layout/CandidateLayout";
import { CandidateWelcomeHeader } from "@/components/candidate/dashboard/CandidateWelcomeHeader";
import { CandidateStatCards } from "@/components/candidate/dashboard/CandidateStatCards";
import { ExploreProgramsHero } from "@/components/candidate/dashboard/ExploreProgramsHero";
import { AdmissionTimelineCard } from "@/components/candidate/dashboard/AdmissionTimelineCard";
import { InterestedMajorsCard } from "@/components/candidate/dashboard/InterestedMajorsCard";
import { RecentSupportTicketsCard } from "@/components/candidate/dashboard/RecentSupportTicketsCard";
import { UsefulDocumentsCard } from "@/components/candidate/dashboard/UsefulDocumentsCard";
import { AIChatCTA } from "@/components/candidate/dashboard/AIChatCTA";
import {
  candidateProfile,
  candidateStats,
  admissionMilestones,
  interestedMajors,
  recentSupportTickets,
  usefulDocuments,
} from "@/data/candidateMockData";

export const metadata: Metadata = {
  title: "Cổng thông tin tuyển sinh – Bảng điều khiển Thí sinh | Trường Đại học Điện lực (EPU)",
  description:
    "Bảng điều khiển cá nhân dành cho thí sinh đăng ký xét tuyển tại Trường Đại học Điện lực. Tra cứu ngành học, mốc thời gian, tài liệu và tư vấn tuyển sinh cùng AI.",
};

export default function CandidateDashboardPage() {
  return (
    <CandidateLayout>
      {/* 1. Welcome & Cycle Selector Header */}
      <CandidateWelcomeHeader
        name={candidateProfile.name}
        activeCycle={candidateProfile.activeCycle}
      />

      {/* 2. Five KPI Stat Cards */}
      <CandidateStatCards stats={candidateStats} />

      {/* 3. Hero Exploration (60%) & Admission Timeline (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 xl:col-span-7 flex">
          <div className="w-full">
            <ExploreProgramsHero />
          </div>
        </div>
        <div className="lg:col-span-5 xl:col-span-5 flex">
          <div className="w-full">
            <AdmissionTimelineCard milestones={admissionMilestones} />
          </div>
        </div>
      </div>

      {/* 4. Three Lower Equal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <InterestedMajorsCard majors={interestedMajors} />
        <RecentSupportTicketsCard tickets={recentSupportTickets} />
        <UsefulDocumentsCard documents={usefulDocuments} />
      </div>

      {/* 5. Bottom AI Chat Call-to-action */}
      <AIChatCTA />
    </CandidateLayout>
  );
}
