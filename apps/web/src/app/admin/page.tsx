import React from "react";
import {
  MOCK_ADMIN_KPIS,
  MOCK_CONVERSATION_TRENDS,
  MOCK_QUESTION_CATEGORIES,
  MOCK_RECENT_DOCUMENTS,
  MOCK_PENDING_HANDOVERS,
  MOCK_RECENT_ACTIVITIES,
  MOCK_QUICK_ACTIONS,
} from "@/data/adminMockData";
import { DashboardWelcome } from "@/components/admin/dashboard/DashboardWelcome";
import { DashboardKpis } from "@/components/admin/dashboard/DashboardKpis";
import { ConversationTrendChart } from "@/components/admin/dashboard/ConversationTrendChart";
import { QuestionCategoryChart } from "@/components/admin/dashboard/QuestionCategoryChart";
import { RecentDocumentsCard } from "@/components/admin/dashboard/RecentDocumentsCard";
import { PendingHandoversCard } from "@/components/admin/dashboard/PendingHandoversCard";
import { RecentActivitiesCard } from "@/components/admin/dashboard/RecentActivitiesCard";
import { QuickActionCards } from "@/components/admin/dashboard/QuickActionCards";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* 1. Welcome Greeting & Date Range Filter */}
      <DashboardWelcome userName="Nguyễn Văn A" />

      {/* 2. Five KPI Cards in Single Row */}
      <DashboardKpis data={MOCK_ADMIN_KPIS} />

      {/* 3. Analytics Charts: 60% / 40% Desktop Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7">
          <ConversationTrendChart data={MOCK_CONVERSATION_TRENDS} />
        </div>
        <div className="lg:col-span-5">
          <QuestionCategoryChart data={MOCK_QUESTION_CATEGORIES} />
        </div>
      </div>

      {/* 4. Three Recent Data Cards in Single Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        <RecentDocumentsCard documents={MOCK_RECENT_DOCUMENTS} />
        <PendingHandoversCard handovers={MOCK_PENDING_HANDOVERS} />
        <RecentActivitiesCard activities={MOCK_RECENT_ACTIVITIES} />
      </div>

      {/* 5. Three Quick Action Shortcut Cards */}
      <QuickActionCards actions={MOCK_QUICK_ACTIONS} />
    </div>
  );
}
