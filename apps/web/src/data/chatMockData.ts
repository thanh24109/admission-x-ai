import {
  ChatMessage,
  QuestionSuggestion,
  RelatedDocumentItem,
  SuggestionTabKey,
} from "@/types/chat";

export const initialChatMessages: ChatMessage[] = [
  {
    id: "msg-welcome-01",
    role: "assistant",
    content: `Xin chào Nguyễn Văn An! 👋
Mình là Trợ lý Tuyển sinh AI của Trường Đại học Điện lực.
Mình có thể hỗ trợ bạn tìm hiểu về:

🏫 Thông tin ngành học và chương trình đào tạo
📊 Phương thức xét tuyển, chỉ tiêu, điểm chuẩn
💳 Học phí, học bổng, chính sách hỗ trợ sinh viên
📅 Các mốc thời gian tuyển sinh năm 2026
📑 Và nhiều thông tin khác về EPU

Bạn có câu hỏi nào muốn tìm hiểu không? 😊`,
    timestamp: "10:24",
    chips: [
      "Các ngành đào tạo tại EPU",
      "Học phí năm 2026",
      "Điều kiện xét tuyển",
      "Học bổng EPU",
      "Lịch trình tuyển sinh 2026",
    ],
  },
  {
    id: "msg-user-01",
    role: "user",
    content: "Ngành Công nghệ thông tin có những phương thức xét tuyển nào?",
    timestamp: "10:25",
  },
  {
    id: "msg-assistant-01",
    role: "assistant",
    content: `Ngành Công nghệ thông tin (mã ngành: 7480201) tại Trường Đại học Điện lực sử dụng các phương thức xét tuyển sau trong năm tuyển sinh 2026:

1. Xét tuyển thẳng theo quy định của Bộ Giáo dục và Đào tạo.
2. Xét tuyển dựa trên kết quả thi tốt nghiệp THPT năm 2026.
3. Xét tuyển học bạ THPT theo tổ hợp môn.
4. Xét tuyển dựa trên kết quả kỳ thi đánh giá năng lực (ĐHQG Hà Nội, ĐHQG TP.HCM).

Chi tiết chỉ tiêu, tổ hợp môn và ngưỡng điểm dự kiến sẽ được công bố trong Đề án tuyển sinh năm 2026 của Trường. Bạn có thể xem tài liệu chính thức dưới đây:`,
    timestamp: "10:25",
    citations: [
      {
        id: "cite-01",
        title: "Đề án tuyển sinh năm 2026",
        source: "Trường Đại học Điện lực",
        page: "Trang 15 - 18",
        fileSize: "4.2 MB",
        fileType: "pdf",
        url: "/post/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2025",
      },
    ],
    extraSources: [
      "Thông báo tuyển sinh đại học chính quy 2025 - 2026",
      "Quy chế tuyển sinh Trường Đại học Điện lực",
      "Cổng thông tin tuyển sinh Bộ GD&ĐT",
    ],
    feedback: null,
  },
];

export const suggestionSets: Record<SuggestionTabKey, QuestionSuggestion[][]> = {
  popular: [
    [
      { id: "p-1", text: "Ngành Công nghệ thông tin xét tuyển những phương thức nào?", category: "popular" },
      { id: "p-2", text: "Điểm chuẩn EPU năm 2025 là bao nhiêu?", category: "popular" },
      { id: "p-3", text: "Học phí ngành Kỹ thuật điện năm 2026?", category: "popular" },
      { id: "p-4", text: "Có những học bổng nào dành cho sinh viên?", category: "popular" },
      { id: "p-5", text: "Lịch trình tuyển sinh năm 2026?", category: "popular" },
      { id: "p-6", text: "Điều kiện xét tuyển học bạ như thế nào?", category: "popular" },
    ],
    [
      { id: "p-7", text: "Hồ sơ đăng ký xét tuyển gồm những giấy tờ gì?", category: "popular" },
      { id: "p-8", text: "Cơ hội việc làm ngành Logistics sau khi ra trường?", category: "popular" },
      { id: "p-9", text: "Ký túc xá EPU có đủ chỗ cho tân sinh viên không?", category: "popular" },
      { id: "p-10", text: "Chính sách miễn giảm học phí cho đối tượng ưu tiên?", category: "popular" },
      { id: "p-11", text: "Quy trình xác nhận nhập học trực tuyến?", category: "popular" },
      { id: "p-12", text: "Ngành nào có điểm chuẩn cao nhất năm vừa qua?", category: "popular" },
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
      { id: "a-2", text: "Cách tính điểm ưu tiên khu vực và đối tượng 2026?", category: "admissions" },
      { id: "a-3", text: "Điểm sàn nhận hồ sơ xét tuyển THPT là bao nhiêu?", category: "admissions" },
      { id: "a-4", text: "Được đăng ký tối đa bao nhiêu nguyện vọng vào EPU?", category: "admissions" },
      { id: "a-5", text: "Xét tuyển kết hợp chứng chỉ IELTS cần tối thiểu bao nhiêu?", category: "admissions" },
      { id: "a-6", text: "Khi nào nhà trường công bố kết quả trúng tuyển đợt 1?", category: "admissions" },
    ],
  ],
  tuition: [
    [
      { id: "t-1", text: "Mức học phí trung bình một năm học tại EPU?", category: "tuition" },
      { id: "t-2", text: "Học phí tính theo tín chỉ hay theo kỳ học?", category: "tuition" },
      { id: "t-3", text: "Học bổng thủ khoa và á khoa đầu vào là bao nhiêu?", category: "tuition" },
      { id: "t-4", text: "Thời hạn nộp học phí của tân sinh viên kỳ 1?", category: "tuition" },
      { id: "t-5", text: "Các quỹ học bổng doanh nghiệp tài trợ cho sinh viên EPU?", category: "tuition" },
      { id: "t-6", text: "Hình thức thanh toán học phí qua ngân hàng hay trực tuyến?", category: "tuition" },
    ],
  ],
};

export const chatRelatedDocuments: RelatedDocumentItem[] = [
  {
    id: "doc-01",
    title: "Đề án tuyển sinh năm 2026",
    source: "Trường Đại học Điện lực",
    fileSize: "4.2 MB",
    fileType: "pdf",
    downloadUrl: "/post/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2025",
  },
  {
    id: "doc-02",
    title: "Thông tin học phí năm 2026",
    source: "Trường Đại học Điện lực",
    fileSize: "1.2 MB",
    fileType: "pdf",
    downloadUrl: "/post/thong-bao-ve-viec-tuyen-sinh-dao-tao-trinh-do-thac-si-nam-2026",
  },
  {
    id: "doc-03",
    title: "Hướng dẫn đăng ký xét tuyển",
    source: "Trường Đại học Điện lực",
    fileSize: "2.1 MB",
    fileType: "pdf",
    downloadUrl: "/post/thong-bao-thuc-hanh-dang-ky-xet-tuyen-tren-he-thong-tuyen-sinh-chung",
  },
  {
    id: "doc-04",
    title: "Câu hỏi thường gặp về tuyển sinh",
    source: "Trường Đại học Điện lực",
    fileSize: "800 KB",
    fileType: "docx",
    downloadUrl: "/page/dai-hoc",
  },
];
