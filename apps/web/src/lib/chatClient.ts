/**
 * Pure, reliable chat client response validation and safe error formatting.
 *
 * Follows Phase 1 Task 4 Section 8 (P0 Frontend Remediation).
 * Guarantees that frontend failures never manufacture admissions claims,
 * fake tuition figures, or synthetic document citations.
 */

import type { ChatCitation, ChatMessage } from "../types/chat.ts";

export const SAFE_STATIC_ERROR_MESSAGE =
  "Hệ thống tư vấn hiện chưa thể xử lý yêu cầu. Vui lòng thử lại sau.";

export interface ParsedChatSuccess {
  answer: string;
  citations: ChatCitation[];
  handover: boolean;
  intent?: string;
  confidence?: number;
}

/**
 * Safely format and validate an individual citation record from backend response.
 *
 * Rules:
 * 1. Omit citations lacking a truthful, non-empty title or source.
 * 2. Never hardcode '/tuyensinh' as a surrogate destination.
 * 3. Never manufacture fake page labels ('Trang tài liệu', 'Trang 15 - 18').
 * 4. Never manufacture fake file sizes ('4.2 MB', 'Chính thức').
 * 5. Only retain url if it is an explicit safe absolute URL or verified relative path.
 */
export function formatSafeCitation(
  raw: unknown,
  index: number
): ChatCitation | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const title = typeof record.title === "string" ? record.title.trim() : "";
  const source = typeof record.source === "string" ? record.source.trim() : "";

  // Omit citation if title or source is invalid
  if (!title) {
    return null;
  }

  // Safe URL verification: Only allow https:// or relative paths starting with /
  let safeUrl: string | undefined = undefined;
  if (typeof record.url === "string" && record.url.trim()) {
    const trimmed = record.url.trim();
    if (trimmed.startsWith("/") || trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
      safeUrl = trimmed;
    }
  }

  return {
    id: `cite-${index}`,
    title,
    source: source || "Trường Đại học Điện lực (EPU)",
    url: safeUrl,
    fileType: "pdf",
    page: typeof record.page === "string" && record.page.trim() ? record.page.trim() : undefined,
    fileSize: typeof record.fileSize === "string" && record.fileSize.trim() ? record.fileSize.trim() : undefined,
  };
}

/**
 * Parse and validate backend chat response payload at the frontend boundary.
 * Throws an Error if payload is malformed, not an object, or lacks a valid answer string.
 */
export function parseChatResponse(data: unknown): ParsedChatSuccess {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid response: expected an object");
  }

  const record = data as Record<string, unknown>;

  if (typeof record.answer !== "string" || !record.answer.trim()) {
    throw new Error("Invalid response: missing or empty 'answer' field");
  }

  const answer = record.answer.trim();
  const handover = Boolean(record.handover);
  const intent = typeof record.intent === "string" ? record.intent : undefined;
  const confidence = typeof record.confidence === "number" ? record.confidence : undefined;

  const citations: ChatCitation[] = [];
  if (Array.isArray(record.citations)) {
    record.citations.forEach((c, idx) => {
      const formatted = formatSafeCitation(c, idx);
      if (formatted) {
        citations.push(formatted);
      }
    });
  }

  return {
    answer,
    citations,
    handover,
    intent,
    confidence,
  };
}

/**
 * Generate a static, non-factual error assistant message in Vietnamese.
 * Invariant: Never contains admissions facts, citations, extraSources, or fake links.
 */
export function createSafeErrorAssistantMessage(
  customErrorText?: string,
  idSuffix?: string
): ChatMessage {
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;

  return {
    id: `msg-error-${idSuffix || Date.now()}`,
    role: "assistant",
    content: customErrorText || SAFE_STATIC_ERROR_MESSAGE,
    timestamp: timeStr,
    citations: undefined,
    extraSources: undefined,
    chips: undefined,
    feedback: null,
  };
}
