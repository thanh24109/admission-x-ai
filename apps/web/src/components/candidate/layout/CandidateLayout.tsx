"use client";

import React, { useState } from "react";
import { CandidateSidebar } from "./CandidateSidebar";
import { CandidateTopbar } from "./CandidateTopbar";
import { candidateProfile } from "@/data/candidateMockData";

interface CandidateLayoutProps {
  children: React.ReactNode;
}

export function CandidateLayout({ children }: CandidateLayoutProps) {
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F8FD] dark:bg-[#071328] text-[#10203D] dark:text-[#E2E8F0] antialiased">
      {/* 1. Sidebar */}
      <CandidateSidebar
        isOpenOnMobile={sidebarOpenMobile}
        onCloseMobile={() => setSidebarOpenMobile(false)}
      />

      {/* 2. Main Wrapper */}
      <div className="flex flex-col lg:pl-[260px] min-h-screen transition-all">
        {/* Topbar */}
        <CandidateTopbar
          profile={candidateProfile}
          onToggleSidebar={() => setSidebarOpenMobile((prev) => !prev)}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-7 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
