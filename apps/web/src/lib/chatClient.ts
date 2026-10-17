/**
 * Pure, reliable chat client response validation and safe error formatting.
 *
 * Follows Phase 1 Task 4 Section 8 & Task 4.1 (Frontend Trust Boundaries).
 * Guarantees that frontend failures never manufacture admissions claims,
 * fake tuition figures, or synthetic document citations.
 */

import type { ChatCitation, ChatMessage, CitationProvenanceMetadata } from "../types/chat.ts";

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
 * Detects whether a URL or path exhibits directory traversal or canonicalization bypass patterns,
 * including raw ('..'), backslashes ('\'), null bytes, and single or recursive percent-encoded sequences
 * (such as %2e%2e, %252e%252e, %5c, %255c, %00, ..%2f, etc.).
 */
export function hasTraversalOrCanonicalizationBypass(raw: string): boolean {
  if (!raw || typeof raw !== "string") {
    return false;
  }

  // Raw checks
  if (raw.includes("..") || raw.includes("\\") || raw.includes("\0")) {
    return true;
  }

  // Encoded traversal pattern checks in lowercase
  const lower = raw.toLowerCase();
  if (
    lower.includes("%2e%2e") ||
    lower.includes("%2e.") ||
    lower.includes(".%2e") ||
    lower.includes("%5c") ||
    lower.includes("%00") ||
    lower.includes("%252e") ||
    lower.includes("%255c")
  ) {
    return true;
  }

  // Decoding checks: Single and recursive decoding to catch double encoding
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.includes("..") || decoded.includes("\\") || decoded.includes("\0")) {
      return true;
    }
    if (decoded.includes("%")) {
      const doubleDecoded = decodeURIComponent(decoded);
      if (doubleDecoded.includes("..") || doubleDecoded.includes("\\") || doubleDecoded.includes("\0")) {
        return true;
      }
    }
  } catch {
    // Malformed percent-encoding is treated as invalid/bypass attempt
    return true;
  }

  return false;
}

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

  // Reject all traversal or canonicalization bypass patterns immediately
  if (hasTraversalOrCanonicalizationBypass(rawUrl)) {
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
  if (hasTraversalOrCanonicalizationBypass(trimmed)) {
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
 * Verifies whether a destination URL belongs to the allowed admissions document navigation boundary.
 *
 * CRITICAL TRUST-BOUNDARY INVARIANT:
 * This function ONLY tests whether a URL is on the navigation allowlist.
 * It does NOT verify that a linked document has passed backend evidence/citation verification,
 * nor does it prove claim grounding.
 *
 * Requirements enforced:
 * 1. Syntax must be valid and free of traversal (raw or encoded, such as %2e%2e, %252e%252e, \).
 * 2. Relative links must match approved document route prefixes (/post/, /tuyensinh, etc.).
 *    Arbitrary internal routes (/admin, /login, /candidate/profile, /api/...) are rejected.
 * 3. External document links MUST use production-safe HTTPS. Plain HTTP is rejected.
 * 4. Localhost development exceptions (localhost, 127.0.0.1) NEVER authorize production links.
 * 5. External hostnames must strictly belong to official EPU or MOET domains.
 * 6. Ports must be standard (empty or 443).
 */
export function isAllowedDocumentDestination(rawUrl: string): boolean {
  if (!isValidUrlSyntax(rawUrl)) {
    return false;
  }

  const trimmed = rawUrl.trim();

  // Reject directory traversal and canonicalization bypasses
  if (hasTraversalOrCanonicalizationBypass(trimmed)) {
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

    // Path must also be free of traversal
    if (hasTraversalOrCanonicalizationBypass(parsed.pathname)) {
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
 * Backward compatibility alias for destination allowlist.
 */
export const isApprovedDocumentDestination = isAllowedDocumentDestination;

/**
 * Preserves legacy verification contract for official provenance while enforcing
 * strict destination trust boundaries without localhost exceptions.
 */
export function isOfficialProvenanceUrl(rawUrl: string): boolean {
  return isAllowedDocumentDestination(rawUrl);
}

/**
 * Authoritative boundary: Checks if a citation record contains authentic backend contract verification.
 *
 * CRITICAL INVARIANTS:
 * 1. Matching an allowlisted URL does NOT make a citation verified.
 * 2. Raw booleans from API payloads (e.g. record.isVerifiedDestination: true) are NEVER trusted.
 * 3. Requires an authoritative backend contract provenance record with status 'verified_backend',
 *    authentic documentId, and sourceTier 'official_epu'.
 */
export function isBackendVerifiedCitation(rawRecord: unknown): boolean {
  if (!rawRecord || typeof rawRecord !== "object") {
    return false;
  }
  const record = rawRecord as Record<string, unknown>;
  const prov = record.provenance;
  if (!prov || typeof prov !== "object") {
    return false;
  }
  const provRec = prov as Record<string, unknown>;
  return (
    provRec.status === "verified_backend" &&
    typeof provRec.documentId === "string" &&
    Boolean(provRec.documentId.trim()) &&
    provRec.sourceTier === "official_epu"
  );
}

/**
 * Safely format and validate an individual citation record from backend response.
 *
 * Invariants:
 * 1. Omit citations lacking a valid title.
 * 2. Never default missing source to 'Trường Đại học Điện lực (EPU)'.
 * 3. Never default missing fileType to 'pdf'.
 * 4. Never manufacture fake page labels or file sizes.
 * 5. Reject malformed, dangerous, protocol-relative, or traversal-bypassed URLs.
 * 6. Separate destination allowlisting (isAllowedDestination) from verified citation provenance (provenanceStatus).
 *    Do NOT set isVerifiedDestination=true solely because the URL belongs to an approved domain.
 * 7. Never trust raw client-facing booleans from arbitrary API payloads.
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

  // Safe URL verification & Destination Allowlist
  let safeUrl: string | undefined = undefined;
  let isAllowedDest = false;

  if (typeof record.url === "string" && record.url.trim()) {
    const rawUrl = record.url.trim();
    if (isValidUrlSyntax(rawUrl)) {
      safeUrl = rawUrl;
      isAllowedDest = isAllowedDocumentDestination(rawUrl);
    }
  }

  // Authoritative Provenance Verification Boundary
  // INVARIANT 1: Matching an allowlisted URL does NOT make a citation verified.
  // INVARIANT 2: Raw client booleans (record.isVerifiedDestination) are NEVER trusted.
  const isAuthoritativeVerified = isBackendVerifiedCitation(record);

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

  const provenance: CitationProvenanceMetadata = isAuthoritativeVerified
    ? {
        status: "verified_backend",
        documentId: (record.provenance as Record<string, unknown>).documentId as string,
        sourceTier: "official_epu",
      }
    : isAllowedDest
    ? { status: "unverified_allowlisted" }
    : { status: "untrusted" };

  return {
    id: citationId,
    title,
    source, // Preserves authentic source without defaulting to EPU
    url: safeUrl,
    fileType, // Undefined if omitted by backend; NEVER defaulted to 'pdf'
    page: typeof record.page === "string" && record.page.trim() ? record.page.trim() : undefined,
    fileSize: typeof record.fileSize === "string" && record.fileSize.trim() ? record.fileSize.trim() : undefined,
    isVerifiedDestination: isAuthoritativeVerified, // Invariant: NEVER true solely from URL allowlist or raw boolean!
    isAllowedDestination: isAllowedDest,
    provenance,
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
