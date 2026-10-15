import {
  DashboardKpis,
  ConversationTrendPoint,
  QuestionCategoryItem,
  RecentDocumentItem,
  PendingHandoverItem,
  RecentActivityItem,
  QuickActionItem,
} from "@/types/admin";

export const MOCK_ADMIN_KPIS: DashboardKpis = {
  totalUsers: {
    total: 12846,
    growth: "+12,5%",
    candidates: 11982,
    counselors: 62,
    admins: 5,
  },
  aiConversations: {
    total: 8532,
    growth: "+18,4%",
    successful: 7965,
    successRate: "93,4%",
  },
  consultationRequests: {
    total: 486,
    growth: "-8,2%",
    resolved: 412,
    resolutionRate: "84,8%",
  },
  admissionsDocuments: {
    total: 124,
    growth: "+4,5%",
    published: 102,
    pending: 22,
  },
  aiAccuracy: {
    rate: "92,3%",
    growth: "+2,1%",
    evaluatedDescription: "Đánh giá từ feedback người dùng",
  },
};

export const MOCK_CONVERSATION_TRENDS: ConversationTrendPoint[] = [
  { date: "01/10", total: 240, handovers: 18 },
  { date: "05/10", total: 310, handovers: 22 },
  { date: "10/10", total: 285, handovers: 25 },
  { date: "15/10", total: 420, handovers: 32 },
  { date: "20/10", total: 390, handovers: 28 },
  { date: "25/10", total: 450, handovers: 35 },
  { date: "31/10", total: 495, handovers: 38 },
];

export const MOCK_QUESTION_CATEGORIES: QuestionCategoryItem[] = [
  {
    id: "info",
    name: "Thông tin tuyển sinh",
    percentage: 32.4,
    count: 2764,
    color: "#2563EB", // Blue
  },
  {
    id: "majors",
    name: "Ngành học & chương trình",
    percentage: 24.1,
    count: 2056,
    color: "#059669", // Emerald Green
  },
  {
    id: "methods",
    name: "Phương thức xét tuyển",
    percentage: 18.6,
    count: 1587,
    color: "#D97706", // Amber / Orange
  },
  {
    id: "tuition",
    name: "Học phí & học bổng",
    percentage: 12.3,
    count: 1049,
    color: "#7C3AED", // Purple
  },
  {
    id: "dorm",
    name: "Ký túc xá & đời sống SV",
    percentage: 8.9,
    count: 759,
    color: "#0891B2", // Cyan / Teal
  },
  {
    id: "other",
    name: "Khác",
    percentage: 3.7,
    count: 317,
    color: "#E11D48", // Rose / Red
  },
];

export const MOCK_RECENT_DOCUMENTS: RecentDocumentItem[] = [
  {
    id: "doc-1",
    title: "Đề án tuyển sinh đại học 2026.pdf",
    fileType: "pdf",
    updatedDate: "Cập nhật 12/10/2026",
    status: "published",
  },
  {
    id: "doc-2",
    title: "Thông tin ngành học hệ đại học.pdf",
    fileType: "pdf",
    updatedDate: "Cập nhật 10/10/2026",
    status: "published",
  },
  {
    id: "doc-3",
    title: "Hướng dẫn đăng ký xét tuyển.pdf",
    fileType: "pdf",
    updatedDate: "Cập nhật 08/10/2026",
    status: "pending",
  },
  {
    id: "doc-4",
    title: "Câu hỏi thường gặp năm 2026.docx",
    fileType: "docx",
    updatedDate: "Cập nhật 05/10/2026",
    status: "published",
  },
  {
    id: "doc-5",
    title: "Chính sách học bổng.pdf",
    fileType: "pdf",
    updatedDate: "Cập nhật 01/10/2026",
    status: "published",
  },
];

export const MOCK_PENDING_HANDOVERS: PendingHandoverItem[] = [
  {
    id: "ho-1",
    initials: "NT",
    candidateName: "Nguyễn Thị Thu Hà",
    question: "Câu hỏi về xét tuyển bằng học bạ",
    priority: "high",
    timeAgo: "5 phút trước",
  },
  {
    id: "ho-2",
    initials: "PL",
    candidateName: "Phạm Lê Minh",
    question: "Tư vấn ngành Công nghệ kỹ thuật điện",
    priority: "high",
    timeAgo: "12 phút trước",
  },
  {
    id: "ho-3",
    initials: "TT",
    candidateName: "Trần Thị Thanh",
    question: "Học phí và chính sách học bổng",
    priority: "medium",
    timeAgo: "28 phút trước",
  },
  {
    id: "ho-4",
    initials: "HL",
    candidateName: "Hoàng Long",
    question: "Điều kiện xét tuyển thẳng",
    priority: "normal",
    timeAgo: "35 phút trước",
  },
  {
    id: "ho-5",
    initials: "NK",
    candidateName: "Nguyễn Khang",
    question: "Tư vấn ký túc xá cho tân sinh viên",
    priority: "normal",
    timeAgo: "1 giờ trước",
  },
];

export const MOCK_RECENT_ACTIVITIES: RecentActivityItem[] = [
  {
    id: "act-1",
    title: "Đã xuất bản tài liệu mới",
    description: "Đề án tuyển sinh đại học 2026.pdf",
    timestamp: "12/10/2026 09:24",
    type: "document",
  },
  {
    id: "act-2",
    title: "Thêm người dùng mới",
    description: "Nguyễn Thị Mai (Thí sinh)",
    timestamp: "12/10/2026 08:15",
    type: "user",
  },
  {
    id: "act-3",
    title: "Cập nhật cấu hình AI",
    description: "Thay đổi ngưỡng confidence",
    timestamp: "11/10/2026 16:42",
    type: "ai_config",
  },
  {
    id: "act-4",
    title: "Handover được xử lý",
    description: "Ticket #HD-2536 đã hoàn tất",
    timestamp: "11/10/2026 14:30",
    type: "handover",
  },
  {
    id: "act-5",
    title: "Chạy đánh giá chất lượng AI",
    description: "Evaluation run #EV-2026-10",
    timestamp: "11/10/2026 09:12",
    type: "evaluation",
  },
];

export const MOCK_QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: "qa-1",
    title: "Quản lý tài liệu tuyển sinh",
    description: "Thêm, cập nhật và xuất bản tài liệu RAG",
    href: "/admin/documents",
    accent: "blue",
  },
  {
    id: "qa-2",
    title: "Quản lý người dùng",
    description: "Xem và phân quyền người dùng",
    href: "/admin/users",
    accent: "green",
  },
  {
    id: "qa-3",
    title: "Xem báo cáo chi tiết",
    description: "Thống kê, xu hướng và đánh giá AI",
    href: "/admin/reports",
    accent: "purple",
  },
];
