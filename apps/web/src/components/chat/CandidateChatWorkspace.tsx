"use client";

import React, { useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatComposer } from "./ChatComposer";
import { ChatContextSidebar } from "./ChatContextSidebar";
import { ChatMessage } from "@/types/chat";
import { initialChatMessages } from "@/data/chatMockData";
import { useMockAuth } from "@/lib/mockAuth";
import { Sparkles, HelpCircle, X } from "lucide-react";

export function CandidateChatWorkspace() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [isGenerating, setIsGenerating] = useState(false);
  const [composerValue, setComposerValue] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user } = useMockAuth();

  const handleNewConversation = () => {
    // Reset to welcome message
    setMessages([initialChatMessages[0]]);
  };

  const handleSendMessage = async (text: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsGenerating(true);

    try {
      const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const response = await fetch(`${api}/api/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          candidate_id: user?.id ?? "mock-candidate-001",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: ChatMessage = {
          id: `msg-assistant-${Date.now()}`,
          role: "assistant",
          content: data.answer || "Cảm ơn bạn đã đặt câu hỏi. Bộ phận tuyển sinh EPU sẽ hỗ trợ bạn chi tiết.",
          timestamp: timeStr,
          citations: data.citations?.map((c: { title: string; source: string }, idx: number) => ({
            id: `cite-${idx}`,
            title: c.title,
            source: c.source,
            page: "Trang tài liệu",
            fileType: "pdf",
            fileSize: "Chính thức",
            url: "/tuyensinh",
          })),
          feedback: null,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        return;
      }
    } catch {
      // Backend unavailable: Fallback to simulated RAG assistant response
    } finally {
      setIsGenerating(false);
    }

    // Simulated response when API is offline or returns fallback
    setTimeout(() => {
      let reply = `Cảm ơn bạn đã hỏi về "${text}". Trường Đại học Điện lực hiện đang tiếp nhận hồ sơ xét tuyển theo các phương thức: thi THPT, xét học bạ, đánh giá năng lực và xét tuyển thẳng.`;
      const lower = text.toLowerCase();

      if (lower.includes("học phí")) {
        reply = `Mức học phí năm học 2026 của Trường Đại học Điện lực được tính theo tín chỉ căn cứ theo quy định của Nhà nước đối với trường đại học công lập tự chủ:\n\n1. Khối ngành Kỹ thuật - Công nghệ: khoảng 450.000đ - 550.000đ / tín chỉ.\n2. Khối ngành Kinh tế - Quản trị: khoảng 400.000đ - 480.000đ / tín chỉ.\n\nNhà trường có nhiều chính sách học bổng và hỗ trợ học phí cho sinh viên đạt thành tích xuất sắc.`;
      } else if (lower.includes("ngành") || lower.includes("đào tạo")) {
        reply = `Trường Đại học Điện lực hiện đào tạo 25 ngành trình độ đại học chính quy, nổi bật gồm:\n\n1. Công nghệ kỹ thuật điện, điện tử (ngành truyền thống mũi nhọn).\n2. Công nghệ thông tin & Trí tuệ nhân tạo (AI).\n3. Kỹ thuật điều khiển và tự động hóa.\n4. Quản trị kinh doanh & Tài chính ngân hàng.\n5. Logistics và Quản lý chuỗi cung ứng.\n\nBạn có thể nhấp vào mục Ngành đào tạo để xem chi tiết khung chương trình và chỉ tiêu.`;
      } else if (lower.includes("điểm chuẩn")) {
        reply = `Điểm chuẩn trúng tuyển vào EPU dao động theo từng ngành và phương thức xét tuyển:\n\n1. Các ngành kỹ thuật điện, tự động hóa và CNTT thường có điểm chuẩn từ 21 - 24.5 điểm.\n2. Các ngành khối kinh tế dao động từ 20 - 23.5 điểm.\n\nChi tiết phổ điểm từng đợt được cập nhật tại Cổng thông tin tuyển sinh chính thức của trường.`;
      }

      const fallbackMsg: ChatMessage = {
        id: `msg-assistant-${Date.now()}`,
        role: "assistant",
        content: reply,
        timestamp: timeStr,
        citations: [
          {
            id: `cite-fb-${Date.now()}`,
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
        ],
        feedback: null,
      };

      setMessages((prev) => [...prev, fallbackMsg]);
      setIsGenerating(false);
    }, 600);
  };

  const handleSelectQuestion = (question: string) => {
    handleSendMessage(question);
    setIsMobileSidebarOpen(false);
  };

  const handleSelectChip = (chip: string) => {
    handleSendMessage(chip);
  };

  const handleFeedback = (messageId: string, type: "like" | "dislike") => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, feedback: msg.feedback === type ? null : type }
          : msg
      )
    );
  };

  return (
    <div className="relative flex flex-col h-[calc(100vh-6.5rem)] rounded-2xl bg-white dark:bg-[#0A1730] border border-[#E3ECF8] dark:border-[#1E3250] shadow-2xs overflow-hidden">
      {/* 1. Chat Header */}
      <ChatHeader onNewConversation={handleNewConversation} />

      {/* Mobile Context Sidebar Toggle Button */}
      <div className="lg:hidden flex items-center justify-between px-4 py-2 bg-[#F8FAFD] dark:bg-[#0F1E38] border-b border-[#E3ECF8] dark:border-[#1E3250] text-xs">
        <span className="text-[#64748B] dark:text-[#94A3B8]">
          Gợi ý câu hỏi & Tài liệu tuyển sinh
        </span>
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="inline-flex items-center gap-1 font-semibold text-[#0866D9] dark:text-[#3B82F6] hover:underline"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Mở gợi ý</span>
        </button>
      </div>

      {/* 2. Workspace Body: 70% Chat + 30% Context Sidebar */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Main Conversation Stream (70%) */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-[#E3ECF8] dark:border-[#1E3250]">
          <ChatMessageList
            messages={messages}
            isGenerating={isGenerating}
            onSelectChip={handleSelectChip}
            onFeedback={handleFeedback}
          />
          <ChatComposer
            onSendMessage={handleSendMessage}
            isLoading={isGenerating}
            initialValue={composerValue}
          />
        </div>

        {/* Desktop Context Sidebar (30%) */}
        <aside className="hidden lg:block w-[360px] xl:w-[400px] shrink-0 p-4 bg-[#F8FBFF] dark:bg-[#071328] overflow-y-auto no-scrollbar">
          <ChatContextSidebar onSelectQuestion={handleSelectQuestion} />
        </aside>
      </div>

      {/* 3. Mobile Context Sidebar Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative ml-auto w-full max-w-sm bg-[#F8FBFF] dark:bg-[#0A1730] h-full p-4 overflow-y-auto shadow-2xl z-10 flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="text-sm font-bold text-[#0B1D49] dark:text-white">
                Gợi ý & Tài liệu liên quan
              </span>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ChatContextSidebar onSelectQuestion={handleSelectQuestion} />
          </div>
        </div>
      )}
    </div>
  );
}
