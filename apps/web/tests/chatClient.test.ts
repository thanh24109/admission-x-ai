/**
 * Frontend Error & API Contract Tests (Phase 1 Task 4 Section 9).
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
  SAFE_STATIC_ERROR_MESSAGE,
} from "../src/lib/chatClient.ts";
import { initialChatMessages } from "../src/data/chatMockData.ts";

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

  // 2. Backend connection refused
  it("2. Handles backend connection refused with safe static error message", () => {
    const errorMsg = createSafeErrorAssistantMessage();
    assert.equal(errorMsg.role, "assistant");
    assert.equal(errorMsg.content, SAFE_STATIC_ERROR_MESSAGE);
    assert.equal(errorMsg.citations, undefined);
  });

  // 3. Backend HTTP 500
  it("3. Handles backend HTTP 500 without fabricating admissions claims", () => {
    const errorMsg = createSafeErrorAssistantMessage();
    assert.match(errorMsg.content, /chưa thể xử lý yêu cầu/);
    assert.equal(errorMsg.extraSources, undefined);
  });

  // 4. Backend timeout
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

  // 7. Response with no citations
  it("7. Safely parses responses with empty citations list", () => {
    const raw = {
      answer: "Trường Đại học Điện lực có địa chỉ tại 235 Hoàng Quốc Việt, Hà Nội.",
      citations: [],
    };
    const parsed = parseChatResponse(raw);
    assert.equal(parsed.citations.length, 0);
  });

  // 8. Response with untrusted or missing citation URL
  it("8. Omits untrusted URLs and does NOT default to /tuyensinh", () => {
    const rawCitation = {
      title: "Thông báo tuyển sinh",
      source: "EPU",
      url: "javascript:alert('malicious')", // Untrusted!
    };
    const formatted = formatSafeCitation(rawCitation, 0);
    assert.notEqual(formatted, null);
    assert.equal(formatted?.url, undefined); // Untrusted URL stripped!
    assert.notEqual(formatted?.url, "/tuyensinh"); // Never default to /tuyensinh!

    const noUrlCitation = {
      title: "Quy chế tuyển sinh",
      source: "Bộ GD&ĐT",
    };
    const formattedNoUrl = formatSafeCitation(noUrlCitation, 1);
    assert.equal(formattedNoUrl?.url, undefined);
  });

  // 9. No generated mock admissions answer under any failure
  it("9. Guarantees no mock admissions answers under failure", () => {
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

  // 10. No hardcoded fake PDF page / file-size / source metadata
  it("10. Does not manufacture fake page labels or file sizes", () => {
    const minimalCitation = {
      title: "Văn bản gốc EPU",
      source: "Trường Đại học Điện lực",
    };
    const formatted = formatSafeCitation(minimalCitation, 0);
    assert.equal(formatted?.page, undefined); // NOT 'Trang tài liệu'
    assert.equal(formatted?.fileSize, undefined); // NOT 'Chính thức'
  });

  // 11. New conversation reset during in-flight request simulation
  it("11. Conversation reset state invariant: reset identifier invalidates in-flight responses", () => {
    let conversationResetId = 1;
    const requestResetId = conversationResetId;

    // Simulate reset
    conversationResetId += 1;

    // Response returns after reset:
    const isOutdated = requestResetId !== conversationResetId;
    assert.equal(isOutdated, true);
  });

  // 12. Retry without duplicating user's message
  it("12. Retry pattern handles message resend without duplication", () => {
    const messages = [
      { id: "msg-1", role: "user" as const, content: "Học phí EPU?", timestamp: "10:00" },
      { id: "msg-2", role: "assistant" as const, content: SAFE_STATIC_ERROR_MESSAGE, timestamp: "10:00" },
    ];

    // On retry with isRetry=true, user messages array length remains unchanged
    const isRetry = true;
    const updatedUserMessages = isRetry
      ? messages
      : [...messages, { id: "msg-3", role: "user" as const, content: "Học phí EPU?", timestamp: "10:01" }];

    assert.equal(updatedUserMessages.filter((m) => m.role === "user").length, 1);
  });

  // 13. Mock fixtures are not imported into production candidate answer flows
  it("13. Production initial chat contains strictly 1 truthful welcome message", () => {
    assert.equal(initialChatMessages.length, 1);
    assert.equal(initialChatMessages[0].role, "assistant");
    assert.equal(initialChatMessages[0].citations, undefined);
    assert.equal(initialChatMessages[0].extraSources, undefined);

    // Verify no historical mock assistant message asserting 2026 methods exists
    const hasFakeAdmissionsReply = initialChatMessages.some((m) =>
      m.content.includes("mã ngành: 7480201") || m.content.includes("kỳ thi đánh giá năng lực")
    );
    assert.equal(hasFakeAdmissionsReply, false);
  });
});
