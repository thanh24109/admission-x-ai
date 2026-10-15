"use client";

import React, { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F9FF] dark:bg-[#071326] text-[#07164F] dark:text-[#F1F6FF] flex flex-row transition-colors duration-200">
      {/* Sidebar */}
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Sticky Header */}
        <AdminHeader
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          userName="Nguyễn Văn A"
          userRole="Quản trị viên"
        />

        {/* Content Area */}
        <main className="flex-1 p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
