/**
 * Pure, reliable chat client response validation and safe error formatting.
 *
 * Follows Phase 1 Task 4 Section 8 & Task 4.1 (Frontend Trust Boundaries).
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
 * Validates URL syntax and rejects dangerous or malformed destinations.
 *
 * Rejection criteria:
 * - Empty, whitespace, or newlines
 * - Protocol-relative URLs (e.g., '//malicious.com')
 * - Dangerous schemes (javascript:, data:, vbscript:, file:, blob:)
 * - Malformed URIs that throw on parsing
 */
export function isValidUrlSyntax(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== "string") {
    return false;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed || /\s/.test(trimmed)) {
    return false;
  }

  // Reject protocol-relative URLs (starts with '//')
  if (trimmed.startsWith("//")) {
    return false;
  }

  // Reject dangerous protocols
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("file:") ||
    lower.startsWith("blob:")
  ) {
    return false;
  }

  // Relative URLs starting with single slash
  if (trimmed.startsWith("/")) {
    // Ensure not followed by another slash or backslash
    return !trimmed.startsWith("/\\") && !trimmed.startsWith("//");
  }

  // Absolute URLs: parse and ensure protocol is strictly http: or https:
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Verifies official provenance of citation destinations.
 *
 * Allowed official provenance:
 * 1. Safe relative paths within the EPU web application/portal (e.g. '/post/...', '/tuyensinh')
 * 2. Absolute URLs hosted on official EPU domains (*.epu.edu.vn or epu.edu.vn)
 * 3. Official Ministry of Education and Training portal (*.moet.gov.vn or moet.gov.vn)
 * 4. Local development hostnames (localhost, 127.0.0.1)
 */
export function isOfficialProvenanceUrl(rawUrl: string): boolean {
  if (!isValidUrlSyntax(rawUrl)) {
    return false;
  }

  const trimmed = rawUrl.trim();

  // Internal relative routes are official portal views
  if (trimmed.startsWith("/")) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase();

    // Check EPU official domains
    if (hostname === "epu.edu.vn" || hostname.endsWith(".epu.edu.vn")) {
      return true;
    }

    // Check Ministry of Education official domains
    if (hostname === "moet.gov.vn" || hostname.endsWith(".moet.gov.vn")) {
      return true;
    }

    // Allow local development hostnames
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Safely format and validate an individual citation record from backend response.
 *
 * Invariants:
 * 1. Omit citations lacking a valid title.
 * 2. Never default missing source to 'Trường Đại học Điện lực (EPU)'.
 * 3. Never default missing fileType to 'pdf'.
 * 4. Never manufacture fake page labels or file sizes.
 * 5. Reject malformed, dangerous, or protocol-relative URLs.
 * 6. Track verified official provenance without conflating with URL syntax validation.
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

  // Omit citation if title is missing
  if (!title) {
    return null;
  }

  // Safe URL verification
  let safeUrl: string | undefined = undefined;
  let isVerifiedDestination = false;

  if (typeof record.url === "string" && record.url.trim()) {
    const rawUrl = record.url.trim();
    if (isValidUrlSyntax(rawUrl)) {
      safeUrl = rawUrl;
      isVerifiedDestination = isOfficialProvenanceUrl(rawUrl);
    }
  }

  // File type: strictly preserve authentic value, never default to pdf
  let fileType: "pdf" | "docx" | "url" | "web" | undefined = undefined;
  if (typeof record.fileType === "string") {
    const normalized = record.fileType.toLowerCase().trim();
    if (normalized === "pdf" || normalized === "docx" || normalized === "url" || normalized === "web") {
      fileType = normalized;
    }
  }

  const citationId =
    typeof record.id === "string" && record.id.trim()
      ? record.id.trim()
      : `cite-${index}`;

  return {
    id: citationId,
    title,
    source, // Preserves authentic source without defaulting to EPU
    url: safeUrl,
    fileType, // Undefined if omitted by backend; NEVER defaulted to 'pdf'
    page: typeof record.page === "string" && record.page.trim() ? record.page.trim() : undefined,
    fileSize: typeof record.fileSize === "string" && record.fileSize.trim() ? record.fileSize.trim() : undefined,
    isVerifiedDestination,
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
