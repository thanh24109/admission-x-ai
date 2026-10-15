export interface UserDistribution {
  candidates: number;
  counselors: number;
  admins: number;
}

export interface KpiMetric {
  value: string | number;
  growth: string;
  isPositive?: boolean;
}

export interface DashboardKpis {
  totalUsers: {
    total: number;
    growth: string;
    candidates: number;
    counselors: number;
    admins: number;
  };
  aiConversations: {
    total: number;
    growth: string;
    successful: number;
    successRate: string;
  };
  consultationRequests: {
    total: number;
    growth: string;
    resolved: number;
    resolutionRate: string;
  };
  admissionsDocuments: {
    total: number;
    growth: string;
    published: number;
    pending: number;
  };
  aiAccuracy: {
    rate: string;
    growth: string;
    evaluatedDescription: string;
  };
}

export interface ConversationTrendPoint {
  date: string;
  total: number;
  handovers: number;
}

export interface QuestionCategoryItem {
  id: string;
  name: string;
  percentage: number;
  count: number;
  color: string;
}

export type DocumentStatus = "published" | "pending" | "draft";

export interface RecentDocumentItem {
  id: string;
  title: string;
  fileType: "pdf" | "docx";
  fileSize?: string;
  updatedDate: string;
  status: DocumentStatus;
}

export type HandoverPriority = "high" | "medium" | "normal";

export interface PendingHandoverItem {
  id: string;
  initials: string;
  candidateName: string;
  question: string;
  priority: HandoverPriority;
  timeAgo: string;
}

export type ActivityType = "document" | "user" | "ai_config" | "handover" | "evaluation";

export interface RecentActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: ActivityType;
}

export interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  href: string;
  accent: "blue" | "green" | "purple";
}
