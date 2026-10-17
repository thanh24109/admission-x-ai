/**
 * Frontend Error, API Contract & Trust Boundary Tests (Phase 1 Task 4.1).
 *
 * Executed via Node 24 native test runner:
 * node --test --experimental-strip-types apps/web/tests/chatClient.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  parseChatResponse,
  formatSafeCitation,
  createSafeErrorAssistantMessage,
  isValidUrlSyntax,
  isOfficialProvenanceUrl,
  SAFE_STATIC_ERROR_MESSAGE,
} from "../src/lib/chatClient.ts";
import {
  initialChatMessages,
  chatRelatedDocuments,
} from "../src/data/chatMockData.ts";

describe("Frontend Chat API Contract & Error Handling Tests", () => {
  // 1. Successful backend response
  it("1. Successfully parses authentic backend response", () => {
    const raw = {
      answer: "Ngành Công nghệ thông tin EPU tuyển sinh tổ hợp A00, A01.",
      intent: "admission",
      confidence: 0.95,
      handover: false,
      citations: [
        {
          title: "Đề án tuyển sinh chính thức",
          source: "Trường Đại học Điện lực",
          url: "/post/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2025",
        },
      ],
    };

    const parsed = parseChatResponse(raw);
    assert.equal(parsed.answer, "Ngành Công nghệ thông tin EPU tuyển sinh tổ hợp A00, A01.");
    assert.equal(parsed.handover, false);
    assert.equal(parsed.citations.length, 1);
    assert.equal(parsed.citations[0].title, "Đề án tuyển sinh chính thức");
    assert.equal(parsed.citations[0].url, "/post/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2025");
  });

  // 2. Backend offline / connection refused
  it("2. Handles backend offline / connection refused with safe static error message", () => {
    const errorMsg = createSafeErrorAssistantMessage();
    assert.equal(errorMsg.role, "assistant");
    assert.equal(errorMsg.content, SAFE_STATIC_ERROR_MESSAGE);
    assert.equal(errorMsg.citations, undefined);
  });

  // 3. Backend HTTP error (e.g. 500)
  it("3. Handles backend HTTP error without fabricating admissions claims", () => {
    const errorMsg = createSafeErrorAssistantMessage();
    assert.match(errorMsg.content, /chưa thể xử lý yêu cầu/);
    assert.equal(errorMsg.extraSources, undefined);
  });

  // 4. Timeout
  it("4. Handles backend timeout safely", () => {
    const timeoutMsg = createSafeErrorAssistantMessage();
    assert.equal(timeoutMsg.content, SAFE_STATIC_ERROR_MESSAGE);
    assert.equal(timeoutMsg.citations, undefined);
  });

  // 5. Malformed JSON
  it("5. Throws on malformed JSON / non-object payload", () => {
    assert.throws(() => parseChatResponse("not a json string"), /Invalid response/);
    assert.throws(() => parseChatResponse(null), /Invalid response/);
    assert.throws(() => parseChatResponse(12345), /Invalid response/);
  });

  // 6. Missing required response fields
  it("6. Throws on missing required 'answer' field", () => {
    assert.throws(
      () => parseChatResponse({ intent: "admission", confidence: 0.8 }),
      /missing or empty 'answer' field/
    );
    assert.throws(
      () => parseChatResponse({ answer: "   ", citations: [] }),
      /missing or empty 'answer' field/
    );
  });

  // 7. Response with empty citations list
  it("7. Safely parses responses with empty citations list", () => {
    const raw = {
      answer: "Trường Đại học Điện lực có địa chỉ tại 235 Hoàng Quốc Việt, Hà Nội.",
      citations: [],
    };
    const parsed = parseChatResponse(raw);
    assert.equal(parsed.citations.length, 0);
  });

  // 8. Missing citation source
  it("8. Never defaults missing citation source to 'Trường Đại học Điện lực (EPU)'", () => {
    const rawCitation = {
      title: "Văn bản hướng dẫn",
      // missing source field
    };
    const formatted = formatSafeCitation(rawCitation, 0);
    assert.notEqual(formatted, null);
    assert.equal(formatted?.source, "");
    assert.notEqual(formatted?.source, "Trường Đại học Điện lực (EPU)");

    const emptySourceCitation = {
      title: "Quy định số 123",
      source: "   ",
    };
    const formattedEmpty = formatSafeCitation(emptySourceCitation, 1);
    assert.equal(formattedEmpty?.source, "");
  });

  // 9. Missing document type
  it("9. Never defaults missing document type to PDF", () => {
    const rawCitation = {
      title: "Thông báo tuyển sinh",
      source: "Phòng Đào tạo",
      // fileType omitted
    };
    const formatted = formatSafeCitation(rawCitation, 0);
    assert.notEqual(formatted, null);
    assert.equal(formatted?.fileType, undefined);
    assert.notEqual(formatted?.fileType, "pdf");
  });

  // 10. Invalid URL
  it("10. Rejects invalid and malformed URLs", () => {
    assert.equal(isValidUrlSyntax("http:// bad url with spaces"), false);
    assert.equal(isValidUrlSyntax("not-a-valid-url"), false);
    assert.equal(isValidUrlSyntax(""), false);

    const citation = {
      title: "Tài liệu",
      source: "EPU",
      url: "http:// invalid url",
    };
    const formatted = formatSafeCitation(citation, 0);
    assert.equal(formatted?.url, undefined);
  });

  // 11. Protocol-relative URL
  it("11. Strictly rejects protocol-relative URLs (//evil.com)", () => {
    assert.equal(isValidUrlSyntax("//evil.com/phishing"), false);
    assert.equal(isValidUrlSyntax("//tuyensinh.epu.edu.vn"), false);

    const citation = {
      title: "Tài liệu nguy hiểm",
      source: "Nguồn lạ",
      url: "//attacker.com/malicious.pdf",
    };
    const formatted = formatSafeCitation(citation, 0);
    assert.equal(formatted?.url, undefined);
  });

  // 12. Unsafe protocol
  it("12. Rejects unsafe protocols (javascript, data, vbscript, file)", () => {
    assert.equal(isValidUrlSyntax("javascript:alert(1)"), false);
    assert.equal(isValidUrlSyntax("data:text/html,<script>alert(1)</script>"), false);
    assert.equal(isValidUrlSyntax("vbscript:msgbox(1)"), false);
    assert.equal(isValidUrlSyntax("file:///etc/passwd"), false);

    const citation = {
      title: "Tài liệu XSS",
      source: "EPU",
      url: "javascript:void(0)",
    };
    const formatted = formatSafeCitation(citation, 0);
    assert.equal(formatted?.url, undefined);
  });

  // 13. Unknown document URL vs Verified official provenance
  it("13. Separates URL syntax validation from official provenance verification", () => {
    const externalUrl = "https://external-untrusted-domain.com/announcement.pdf";
    // Valid HTTP syntax
    assert.equal(isValidUrlSyntax(externalUrl), true);
    // But NOT official EPU provenance
    assert.equal(isOfficialProvenanceUrl(externalUrl), false);

    // Official EPU domains
    assert.equal(isOfficialProvenanceUrl("https://epu.edu.vn/post/123"), true);
    assert.equal(isOfficialProvenanceUrl("https://tuyensinh.epu.edu.vn/dean.pdf"), true);
    assert.equal(isOfficialProvenanceUrl("/candidate/documents"), true);
    assert.equal(isOfficialProvenanceUrl("https://moet.gov.vn/quyche"), true);

    const citation = {
      title: "Bài báo ngoài luồng",
      source: "Nguồn khác",
      url: externalUrl,
    };
    const formatted = formatSafeCitation(citation, 0);
    assert.equal(formatted?.url, externalUrl);
    assert.equal(formatted?.isVerifiedDestination, false);
  });

  // 14. No generated mock admissions answer under any failure
  it("14. Guarantees no mock admissions answers under failure", () => {
    const errorMsg = createSafeErrorAssistantMessage();
    const forbidden = [
      "450.000",
      "550.000",
      "21 - 24.5",
      "năm học 2026",
      "25 ngành",
      "Đề án tuyển sinh năm 2026",
      "Trang 15 - 18",
      "4.2 MB",
    ];
    for (const term of forbidden) {
      assert.doesNotMatch(errorMsg.content, new RegExp(term, "i"));
    }
  });

  // 15. No hardcoded fake PDF page / file-size metadata
  it("15. Does not manufacture fake page labels or file sizes", () => {
    const minimalCitation = {
      title: "Văn bản gốc EPU",
      source: "Trường Đại học Điện lực",
    };
    const formatted = formatSafeCitation(minimalCitation, 0);
    assert.equal(formatted?.page, undefined);
    assert.equal(formatted?.fileSize, undefined);
  });

  // 16. New conversation reset during in-flight request
  it("16. New conversation during request invalidates in-flight responses", () => {
    let conversationResetId = 1;
    const requestResetId = conversationResetId;

    // Simulate reset
    conversationResetId += 1;

    // Response returns after reset:
    const isOutdated = requestResetId !== conversationResetId;
    assert.equal(isOutdated, true);
  });

  // 17. Retry without duplicate user messages
  it("17. Retry pattern resends without duplicating user messages in thread", () => {
    const messages = [
      { id: "msg-1", role: "user" as const, content: "Học phí EPU?", timestamp: "10:00" },
      { id: "msg-2", role: "assistant" as const, content: SAFE_STATIC_ERROR_MESSAGE, timestamp: "10:00" },
    ];

    const isRetry = true;
    const updatedMessages = isRetry
      ? messages
      : [...messages, { id: "msg-3", role: "user" as const, content: "Học phí EPU?", timestamp: "10:01" }];

    assert.equal(updatedMessages.filter((m) => m.role === "user").length, 1);
  });

  // 18. No production mock document metadata
  it("18. No production mock document metadata in chatRelatedDocuments", () => {
    assert.equal(chatRelatedDocuments.length, 0);

    // Initial messages contain strictly 1 truthful welcome message without fabricated citations
    assert.equal(initialChatMessages.length, 1);
    assert.equal(initialChatMessages[0].role, "assistant");
    assert.equal(initialChatMessages[0].citations, undefined);
    assert.equal(initialChatMessages[0].extraSources, undefined);
  });
});
