export type CandidateStatType = "conversations" | "interests" | "support" | "milestones" | "saved_documents";

export interface CandidateStatItem {
  id: CandidateStatType;
  title: string;
  value: number;
  icon: string;
  colorScheme: "blue" | "rose" | "emerald" | "orange" | "purple";
  badgeText?: string;
  badgeType?: "positive" | "warning" | "neutral";
  linkText?: string;
  href?: string;
}

export interface AdmissionMilestone {
  id: string;
  date: string;
  title: string;
  dotColor: string;
  isCompleted?: boolean;
}

export interface InterestedMajor {
  id: string;
  name: string;
  code: string;
  department: string;
  faculty: string;
  iconColor: string;
  href: string;
}

export interface SupportTicket {
  id: string;
  title: string;
  createdAt: string;
  status: "in_progress" | "responded" | "closed";
  statusLabel: string;
  statusVariant: "warning" | "success" | "muted";
  href: string;
}

export interface UsefulDocument {
  id: string;
  title: string;
  meta: string;
  fileType: "pdf" | "docx";
  fileSize: string;
  pageCount?: string;
  downloadUrl?: string;
}

export interface CandidateProfile {
  name: string;
  role: string;
  avatarUrl: string;
  unreadCount: number;
  activeCycle: string;
}
