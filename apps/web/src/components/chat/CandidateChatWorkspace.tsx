"use client";

import React, { useRef, useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatComposer } from "./ChatComposer";
import { ChatContextSidebar } from "./ChatContextSidebar";
import { ChatMessage } from "@/types/chat";
import { initialChatMessages } from "@/data/chatMockData";
import { useMockAuth } from "@/lib/mockAuth";
import { Sparkles, X, RotateCw } from "lucide-react";
import {
  createSafeErrorAssistantMessage,
  parseChatResponse,
} from "@/lib/chatClient";

export function CandidateChatWorkspace() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [isGenerating, setIsGenerating] = useState(false);
  const [composerValue] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const conversationResetIdRef = useRef<number>(0);
  const { user } = useMockAuth();

  const handleNewConversation = () => {
    // Invalidate and abort any in-flight request
    conversationResetIdRef.current += 1;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setFailedMessage(null);
    // Reset strictly to the single truthful welcome message
    setMessages([initialChatMessages[0]]);
  };

  const handleSendMessage = async (text: string, isRetry: boolean = false) => {
    const trimmed = text.trim();
    if (!trimmed || isGenerating) {
      return;
    }

    const currentResetId = conversationResetIdRef.current;

    // Abort existing in-flight request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    // On retry, do NOT duplicate user message in the thread
    if (!isRetry) {
      const userMessage: ChatMessage = {
        id: `msg-user-${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: timeStr,
      };
      setMessages((prev) => [...prev, userMessage]);
    }

    setIsGenerating(true);
    setFailedMessage(null);

    // Timeout protection: abort after 15 seconds
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 15000);

    try {
      const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const payload: { message: string; candidate_id?: string } = {
        message: trimmed,
      };
      // Truthful candidate identity: Never silently substitute a fake ID
      if (user?.id) {
        payload.candidate_id = user.id;
      }

      const response = await fetch(`${api}/api/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if conversation was reset while waiting for response
      if (conversationResetIdRef.current !== currentResetId) {
        return;
      }

      if (response.ok) {
        const rawJson = await response.json();
        const parsed = parseChatResponse(rawJson);

        const assistantMessage: ChatMessage = {
          id: `msg-assistant-${Date.now()}`,
          role: "assistant",
          content: parsed.answer,
          timestamp: timeStr,
          citations: parsed.citations.length > 0 ? parsed.citations : undefined,
          feedback: null,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setFailedMessage(null);
        return;
      }

      // Backend HTTP 4xx / 5xx error
      const errorAssistantMsg = createSafeErrorAssistantMessage();
      setMessages((prev) => [...prev, errorAssistantMsg]);
      setFailedMessage(trimmed);
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      // Ignore aborted requests caused by conversation reset
      if (conversationResetIdRef.current !== currentResetId) {
        return;
      }

      // Network error, connection refused, or timeout:
      // Show explicit, static, non-factual error state. NEVER simulate admissions facts!
      const errorAssistantMsg = createSafeErrorAssistantMessage();
      setMessages((prev) => [...prev, errorAssistantMsg]);
      setFailedMessage(trimmed);
    } finally {
      if (conversationResetIdRef.current === currentResetId) {
        setIsGenerating(false);
      }
    }
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

          {/* Retry Banner on Failure */}
          {failedMessage && !isGenerating && (
            <div className="flex items-center justify-between px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-t border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-200 animate-in fade-in duration-200">
              <span className="truncate pr-2">
                Hệ thống chưa nhận được phản hồi. Bạn có muốn thử lại câu hỏi vừa rồi không?
              </span>
              <button
                type="button"
                onClick={() => handleSendMessage(failedMessage, true)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#0866D9] hover:bg-[#0756B5] text-white font-semibold shrink-0 shadow-2xs transition-colors cursor-pointer"
              >
                <RotateCw className="w-3 h-3" />
                <span>Thử lại</span>
              </button>
            </div>
          )}

          <ChatComposer
            onSendMessage={(msg) => handleSendMessage(msg, false)}
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
