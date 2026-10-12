"use client";

import React from "react";
import Header from "@/components/Header";
import HeroSlider from "@/components/HeroSlider";
import NewsSection from "@/components/NewsSection";
import AnnouncementSection from "@/components/AnnouncementSection";
import AdmissionSection from "@/components/AdmissionSection";
import TrainingSection from "@/components/TrainingSection";
import FacultiesSection from "@/components/FacultiesSection";
import LecturersSection from "@/components/LecturersSection";
import StudentActivities from "@/components/StudentActivities";
import MediaSection from "@/components/MediaSection";
import Footer from "@/components/Footer";
import SearchModal from "@/components/SearchModal";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* 1. Header with Topbar & Nav (Zustand wired) */}
      <Header />

      {/* 2. Main Hero Banner Carousel */}
      <HeroSlider />

      {/* Main Content Area - Slides over the fixed hero banner as you scroll */}
      <main className="relative z-10 bg-white dark:bg-slate-950 shadow-[0_-20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_-20px_50px_rgba(0,0,0,0.6)]">
        {/* 3. Tin nổi bật */}
        <NewsSection />

        {/* 4. Thông báo mới & Thông báo tuyển sinh (Navy Section with Radix Tabs) */}
        <AnnouncementSection />

        {/* 5. Thông tin tuyển sinh - Bắt đầu học tập tại EPU */}
        <AdmissionSection />

        {/* 6. Đào tạo (4 Degrees) */}
        <TrainingSection />

        {/* 7. Các khoa đào tạo (Carousel 13 Khoa) */}
        <FacultiesSection />

        {/* 8. Giảng viên xuất sắc (Zustand live filter & Shadcn Card) */}
        <LecturersSection />

        {/* 9. Hoạt động sinh viên */}
        <StudentActivities />

        {/* 10. Media / Videos (Radix Dialog video modal) */}
        <MediaSection />
      </main>

      {/* 11. Official Footer */}
      <Footer />

      {/* 12. Interactive Global Search Modal (Zustand + Radix Dialog + Motion) */}
      <SearchModal />
    </div>
  );
}
