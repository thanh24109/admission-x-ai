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
 * Approved document destination route prefixes for the official portal.
 * Arbitrary internal routes (e.g. /admin, /login, /candidate/profile, /api) are prohibited.
 */
export const APPROVED_DOCUMENT_PATH_PREFIXES = [
  "/post/",
  "/tuyensinh",
  "/candidate/documents",
  "/dao-tao/",
  "/page/",
  "/documents/",
  "/bieu-mau/",
] as const;

/**
 * Validates URL syntax and rejects dangerous, malformed, or normalization-bypass destinations.
 *
 * Rejection criteria:
 * - Empty, whitespace, or newlines
 * - Backslashes ('\') used for URL normalization bypasses
 * - Protocol-relative URLs (starts with '//')
 * - Dangerous schemes (javascript:, data:, vbscript:, file:, blob:)
 * - Malformed URIs that throw on parsing
 */
export function isValidUrlSyntax(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== "string") {
    return false;
  }

  // Reject backslash-based URL normalization bypasses immediately
  if (rawUrl.includes("\\")) {
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
    return !trimmed.startsWith("//") && !trimmed.startsWith("/\\");
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
 * Checks whether a URL is safe for general client navigation (not necessarily an approved citation document).
 */
export function isAllowedNavigationUrl(rawUrl: string): boolean {
  if (!isValidUrlSyntax(rawUrl)) {
    return false;
  }

  const trimmed = rawUrl.trim();
  if (trimmed.includes("..")) {
    return false;
  }

  if (trimmed.startsWith("/")) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Authoritatively verifies whether a destination URL points to an approved official admissions document.
 *
 * Strict trust boundary:
 * 1. Syntax must be valid and free of backslashes or traversal ('..').
 * 2. Relative links must match approved document routes (/post/, /tuyensinh, /candidate/documents, etc.).
 *    Arbitrary internal routes (/admin, /login, /candidate/profile, /api/...) are rejected.
 * 3. External document links MUST use production-safe HTTPS. Plain HTTP is rejected.
 * 4. Localhost development exceptions (localhost, 127.0.0.1) NEVER authorize production links.
 * 5. External hostnames must strictly belong to official EPU or MOET domains.
 * 6. Ports must be standard (empty or 443).
 */
export function isApprovedDocumentDestination(rawUrl: string): boolean {
  if (!isValidUrlSyntax(rawUrl)) {
    return false;
  }

  const trimmed = rawUrl.trim();

  // Reject directory traversal
  if (trimmed.includes("..")) {
    return false;
  }

  // Relative routes check
  if (trimmed.startsWith("/")) {
    return APPROVED_DOCUMENT_PATH_PREFIXES.some((prefix) => {
      if (prefix.endsWith("/")) {
        return trimmed.startsWith(prefix);
      }
      return trimmed === prefix || trimmed.startsWith(`${prefix}/`);
    });
  }

  // Absolute URLs check
  try {
    const parsed = new URL(trimmed);

    // External document links MUST strictly use production-safe HTTPS
    if (parsed.protocol !== "https:") {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Prohibit localhost exceptions from authorizing production links
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local")) {
      return false;
    }

    // Port must be standard (empty or 443)
    if (parsed.port && parsed.port !== "443") {
      return false;
    }

    // Verify official approved domain
    const isEpuDomain = hostname === "epu.edu.vn" || hostname.endsWith(".epu.edu.vn");
    const isMoetDomain = hostname === "moet.gov.vn" || hostname.endsWith(".moet.gov.vn");

    return isEpuDomain || isMoetDomain;
  } catch {
    return false;
  }
}

/**
 * Preserves legacy verification contract for official provenance while enforcing
 * strict destination trust boundaries without localhost exceptions.
 */
export function isOfficialProvenanceUrl(rawUrl: string): boolean {
  return isApprovedDocumentDestination(rawUrl);
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
