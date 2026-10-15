import {
  CandidateProfile,
  CandidateStatItem,
  AdmissionMilestone,
  InterestedMajor,
  SupportTicket,
  UsefulDocument,
} from "@/types/candidate";

export const candidateProfile: CandidateProfile = {
  name: "Nguyễn Văn An",
  role: "Thí sinh",
  avatarUrl: "/asset/candidate-avatar.jpg",
  unreadCount: 3,
  activeCycle: "Năm 2026",
};

export const candidateStats: CandidateStatItem[] = [
  {
    id: "conversations",
    title: "Hội thoại của bạn",
    value: 12,
    icon: "MessageSquare",
    colorScheme: "blue",
    badgeText: "2 hôm nay",
    badgeType: "positive",
  },
  {
    id: "interests",
    title: "Ngành quan tâm",
    value: 3,
    icon: "Heart",
    colorScheme: "rose",
    linkText: "Xem chi tiết →",
    href: "/candidate/interests",
  },
  {
    id: "support",
    title: "Yêu cầu tư vấn",
    value: 2,
    icon: "FileText",
    colorScheme: "emerald",
    badgeText: "1 đang xử lý",
    badgeType: "warning",
  },
  {
    id: "milestones",
    title: "Mốc quan trọng",
    value: 4,
    icon: "CalendarDays",
    colorScheme: "orange",
    linkText: "Xem mốc thời gian →",
    href: "/candidate/timeline",
  },
  {
    id: "saved_documents",
    title: "Tài liệu đã lưu",
    value: 8,
    icon: "Bookmark",
    colorScheme: "purple",
    linkText: "Xem danh sách →",
    href: "/candidate/documents",
  },
];

export const admissionMilestones: AdmissionMilestone[] = [
  {
    id: "m-1",
    date: "10/03/2026",
    title: "Công bố đề án tuyển sinh",
    dotColor: "#0866D9",
    isCompleted: true,
  },
  {
    id: "m-2",
    date: "15/04/2026",
    title: "Mở đăng ký xét tuyển",
    dotColor: "#8B5CF6",
    isCompleted: false,
  },
  {
    id: "m-3",
    date: "20/06/2026",
    title: "Công bố kết quả đợt 1",
    dotColor: "#F97316",
    isCompleted: false,
  },
  {
    id: "m-4",
    date: "10/07/2026",
    title: "Nhập học",
    dotColor: "#EA580C",
    isCompleted: false,
  },
];

export const interestedMajors: InterestedMajor[] = [
  {
    id: "major-1",
    name: "Công nghệ kỹ thuật điện, điện tử",
    code: "7510301",
    department: "Khoa Điện",
    faculty: "Khoa Điện",
    iconColor: "purple",
    href: "/dao-tao/cong-nghe-ky-thuat-dien-dien-tu",
  },
  {
    id: "major-2",
    name: "Công nghệ thông tin",
    code: "7480201",
    department: "Khoa CNTT",
    faculty: "Khoa Công nghệ thông tin",
    iconColor: "rose",
    href: "/dao-tao/cong-nghe-thong-tin",
  },
  {
    id: "major-3",
    name: "Quản trị kinh doanh",
    code: "7340101",
    department: "Khoa Kinh tế",
    faculty: "Khoa Quản trị kinh doanh & Quản trị",
    iconColor: "amber",
    href: "/dao-tao/quan-tri-kinh-doanh",
  },
];

export const recentSupportTickets: SupportTicket[] = [
  {
    id: "ticket-1",
    title: "Tư vấn về học bổng",
    createdAt: "Tạo ngày 10/04/2025",
    status: "in_progress",
    statusLabel: "Đang xử lý",
    statusVariant: "warning",
    href: "/candidate/support/1",
  },
  {
    id: "ticket-2",
    title: "Điều kiện xét tuyển",
    createdAt: "Tạo ngày 05/04/2025",
    status: "responded",
    statusLabel: "Đã phản hồi",
    statusVariant: "success",
    href: "/candidate/support/2",
  },
  {
    id: "ticket-3",
    title: "Cơ hội việc làm",
    createdAt: "Tạo ngày 28/03/2025",
    status: "closed",
    statusLabel: "Đã đóng",
    statusVariant: "muted",
    href: "/candidate/support/3",
  },
];

export const usefulDocuments: UsefulDocument[] = [
  {
    id: "doc-1",
    title: "Đề án tuyển sinh năm 2026.pdf",
    meta: "Trang 1 - 52 • 4.2 MB",
    fileType: "pdf",
    fileSize: "4.2 MB",
    pageCount: "52",
  },
  {
    id: "doc-2",
    title: "Thông tin học phí 2026.pdf",
    meta: "Trang 1 - 12 • 1.2 MB",
    fileType: "pdf",
    fileSize: "1.2 MB",
    pageCount: "12",
  },
  {
    id: "doc-3",
    title: "Hướng dẫn đăng ký xét tuyển.pdf",
    meta: "Trang 1 - 18 • 2.1 MB",
    fileType: "pdf",
    fileSize: "2.1 MB",
    pageCount: "18",
  },
  {
    id: "doc-4",
    title: "Câu hỏi thường gặp năm 2026.docx",
    meta: "24 câu hỏi • 800 KB",
    fileType: "docx",
    fileSize: "800 KB",
  },
];
