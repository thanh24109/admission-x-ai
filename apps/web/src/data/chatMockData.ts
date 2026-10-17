import type {
  ChatMessage,
  QuestionSuggestion,
  RelatedDocumentItem,
  SuggestionTabKey,
} from "../types/chat.ts";

export const initialChatMessages: ChatMessage[] = [
  {
    id: "msg-welcome-01",
    role: "assistant",
    content: `Xin chào! 👋
Mình là Trợ lý Tuyển sinh AI của Trường Đại học Điện lực (EPU).
Mình có thể hỗ trợ bạn tìm hiểu về:

🏫 Thông tin ngành học và chương trình đào tạo
📊 Phương thức xét tuyển, tổ hợp môn theo Đề án chính thức
💳 Học phí, học bổng và chính sách hỗ trợ sinh viên
📑 Quy trình nộp hồ sơ và giải đáp thắc mắc tuyển sinh

Bạn đang quan tâm đến ngành học hoặc thông tin tuyển sinh nào? 😊`,
    timestamp: "Hôm nay",
    chips: [
      "Các ngành đào tạo tại EPU",
      "Phương thức xét tuyển",
      "Điều kiện xét tuyển học bạ",
      "Chính sách học bổng",
    ],
  },
];

export const suggestionSets: Record<SuggestionTabKey, QuestionSuggestion[][]> = {
  popular: [
    [
      { id: "p-1", text: "Ngành Công nghệ thông tin xét tuyển những phương thức nào?", category: "popular" },
      { id: "p-2", text: "Điểm chuẩn EPU năm vừa qua là bao nhiêu?", category: "popular" },
      { id: "p-3", text: "Học phí ngành Kỹ thuật điện được tính như thế nào?", category: "popular" },
      { id: "p-4", text: "Có những học bổng nào dành cho tân sinh viên?", category: "popular" },
      { id: "p-5", text: "Lịch trình nộp hồ sơ xét tuyển?", category: "popular" },
      { id: "p-6", text: "Điều kiện xét tuyển học bạ như thế nào?", category: "popular" },
    ],
    [
      { id: "p-7", text: "Hồ sơ đăng ký xét tuyển gồm những giấy tờ gì?", category: "popular" },
      { id: "p-8", text: "Cơ hội việc làm ngành Logistics sau khi ra trường?", category: "popular" },
      { id: "p-9", text: "Ký túc xá EPU có đủ chỗ cho tân sinh viên không?", category: "popular" },
      { id: "p-10", text: "Chính sách miễn giảm học phí cho đối tượng ưu tiên?", category: "popular" },
      { id: "p-11", text: "Quy trình xác nhận nhập học trực tuyến?", category: "popular" },
      { id: "p-12", text: "Các tổ hợp môn xét tuyển phổ biến của trường?", category: "popular" },
    ],
  ],
  by_major: [
    [
      { id: "m-1", text: "Chương trình đào tạo ngành Công nghệ kỹ thuật điện?", category: "by_major" },
      { id: "m-2", text: "Khoa Công nghệ thông tin có những chuyên ngành nào?", category: "by_major" },
      { id: "m-3", text: "Ngành Quản trị kinh doanh đào tạo những kỹ năng gì?", category: "by_major" },
      { id: "m-4", text: "Thời gian đào tạo hệ đại học chính quy là mấy năm?", category: "by_major" },
      { id: "m-5", text: "Ngành Năng lượng tái tạo ra trường làm ở đâu?", category: "by_major" },
      { id: "m-6", text: "Có chương trình liên kết quốc tế hay chất lượng cao không?", category: "by_major" },
    ],
  ],
  admissions: [
    [
      { id: "a-1", text: "Thời gian mở cổng đăng ký xét tuyển đợt 1?", category: "admissions" },
      { id: "a-2", text: "Cách tính điểm ưu tiên khu vực và đối tượng?", category: "admissions" },
      { id: "a-3", text: "Ngưỡng đảm bảo chất lượng đầu vào của trường?", category: "admissions" },
      { id: "a-4", text: "Được đăng ký tối đa bao nhiêu nguyện vọng vào EPU?", category: "admissions" },
      { id: "a-5", text: "Xét tuyển kết hợp chứng chỉ ngoại ngữ cần tối thiểu bao nhiêu?", category: "admissions" },
      { id: "a-6", text: "Khi nào nhà trường công bố kết quả trúng tuyển?", category: "admissions" },
    ],
  ],
  tuition: [
    [
      { id: "t-1", text: "Mức học phí tính theo tín chỉ hay theo kỳ học?", category: "tuition" },
      { id: "t-2", text: "Học bổng thủ khoa và á khoa đầu vào là bao nhiêu?", category: "tuition" },
      { id: "t-3", text: "Thời hạn nộp học phí của tân sinh viên kỳ 1?", category: "tuition" },
      { id: "t-4", text: "Các quỹ học bổng doanh nghiệp tài trợ cho sinh viên EPU?", category: "tuition" },
      { id: "t-5", text: "Hình thức thanh toán học phí qua ngân hàng hay trực tuyến?", category: "tuition" },
    ],
  ],
};

/**
 * Related documents for candidate chat session.
 * INVARIANT: Never manufacture mock document records with fake PDF badges, sizes, or CMS links.
 * Verified documents are populated from authentic catalog data.
 */
export const chatRelatedDocuments: RelatedDocumentItem[] = [];
