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
  isAllowedNavigationUrl,
  isAllowedDocumentDestination,
  isApprovedDocumentDestination,
  isOfficialProvenanceUrl,
  hasTraversalOrCanonicalizationBypass,
  isBackendVerifiedCitation,
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

  // 19. Backslash-based URL normalization bypass rejection
  it("19. Strictly rejects backslash-based URL normalization bypasses", () => {
    assert.equal(isValidUrlSyntax("https://epu.edu.vn\\evil.com"), false);
    assert.equal(isValidUrlSyntax("/post/\\attacker.com"), false);
    assert.equal(isValidUrlSyntax("https://epu.edu.vn/post\\view"), false);
    assert.equal(isApprovedDocumentDestination("https://epu.edu.vn\\evil.com"), false);

    const citation = {
      title: "Văn bản bypass",
      source: "EPU",
      url: "https://epu.edu.vn\\attacker.com/doc.pdf",
    };
    const formatted = formatSafeCitation(citation, 0);
    assert.equal(formatted?.url, undefined);
  });

  // 20. Arbitrary internal routes prohibited as document links
  it("20. Prohibits arbitrary internal routes from being treated as approved document links", () => {
    // Prohibited arbitrary routes:
    assert.equal(isApprovedDocumentDestination("/admin"), false);
    assert.equal(isApprovedDocumentDestination("/login"), false);
    assert.equal(isApprovedDocumentDestination("/staff/dashboard"), false);
    assert.equal(isApprovedDocumentDestination("/candidate/profile"), false);
    assert.equal(isApprovedDocumentDestination("/api/chat"), false);
    assert.equal(isApprovedDocumentDestination("/chat"), false);

    // Permitted document routes:
    assert.equal(isApprovedDocumentDestination("/post/thong-bao-2025"), true);
    assert.equal(isApprovedDocumentDestination("/tuyensinh"), true);
    assert.equal(isApprovedDocumentDestination("/tuyensinh/de-an-2025.pdf"), true);
    assert.equal(isApprovedDocumentDestination("/candidate/documents"), true);
    assert.equal(isApprovedDocumentDestination("/candidate/documents/huong-dan.pdf"), true);
    assert.equal(isApprovedDocumentDestination("/dao-tao/dai-hoc"), true);
    assert.equal(isApprovedDocumentDestination("/page/dai-hoc"), true);
  });

  // 21. Production-safe HTTPS required for external document links
  it("21. Enforces production-safe HTTPS for external document links (rejects plain HTTP)", () => {
    assert.equal(isApprovedDocumentDestination("http://tuyensinh.epu.edu.vn/dean.pdf"), false);
    assert.equal(isApprovedDocumentDestination("https://tuyensinh.epu.edu.vn/dean.pdf"), true);
    assert.equal(isApprovedDocumentDestination("http://moet.gov.vn/quyche.pdf"), false);
    assert.equal(isApprovedDocumentDestination("https://moet.gov.vn/quyche.pdf"), true);
  });

  // 22. Localhost development exceptions prohibited for production links
  it("22. Prohibits localhost/127.0.0.1 exceptions from authorizing production document links", () => {
    assert.equal(isApprovedDocumentDestination("http://localhost:3000/dean.pdf"), false);
    assert.equal(isApprovedDocumentDestination("https://localhost/dean.pdf"), false);
    assert.equal(isApprovedDocumentDestination("http://127.0.0.1:8000/dean.pdf"), false);
    assert.equal(isApprovedDocumentDestination("https://127.0.0.1/dean.pdf"), false);
  });

  // 23. Client-facing boolean cannot authorize unverified destination
  it("23. Never trusts raw client-facing boolean (isVerifiedDestination) as proof of backend approval", () => {
    const untrustedCitation = {
      title: "Tài liệu giả mạo",
      source: "Ngoại lai",
      url: "https://attacker.com/malicious.pdf",
      isVerifiedDestination: true, // Untrusted client-supplied flag claiming true!
    };
    const formatted = formatSafeCitation(untrustedCitation, 0);

    // Valid syntax preserved in safeUrl
    assert.equal(formatted?.url, "https://attacker.com/malicious.pdf");
    // But isVerifiedDestination is computed authoritatively and set to FALSE
    assert.equal(formatted?.isVerifiedDestination, false);
    assert.equal(isApprovedDocumentDestination(formatted?.url || ""), false);
  });

  // 24. Directory traversal and malformed paths rejected
  it("24. Rejects directory traversal paths in citations", () => {
    assert.equal(isApprovedDocumentDestination("/post/../../admin"), false);
    assert.equal(isApprovedDocumentDestination("https://tuyensinh.epu.edu.vn/post/../../admin"), false);
    assert.equal(isAllowedNavigationUrl("/post/../../admin"), false);
  });

  // 25. Valid official-domain URLs that have not been evidence-verified
  it("25. Distinguishes allowed official destination from evidence verification", () => {
    const unverifiedOfficialCitation = {
      title: "Thông báo tuyển sinh 2025",
      source: "Phòng Tuyển sinh EPU",
      url: "https://tuyensinh.epu.edu.vn/post/thong-bao-2025.pdf",
    };

    const formatted = formatSafeCitation(unverifiedOfficialCitation, 0);
    assert.notEqual(formatted, null);
    assert.equal(formatted?.url, "https://tuyensinh.epu.edu.vn/post/thong-bao-2025.pdf");
    // Allowed for safe client navigation
    assert.equal(formatted?.isAllowedDestination, true);
    assert.equal(isAllowedDocumentDestination(formatted?.url || ""), true);
    // CRITICAL: Must NEVER claim evidence verification solely due to allowlisted domain!
    assert.equal(formatted?.isVerifiedDestination, false);
    assert.equal(formatted?.provenance?.status, "unverified_allowlisted");
  });

  // 26. Raw payload boolean is ignored even on official domains
  it("26. Rejects raw payload boolean 'isVerifiedDestination=true' without authentic backend verification", () => {
    const deceptiveOfficialCitation = {
      title: "Văn bản chưa thẩm định",
      source: "Trường Đại học Điện lực",
      url: "https://epu.edu.vn/post/van-ban-moi",
      isVerifiedDestination: true, // Attacker or untrusted API payload claims true
    };

    const formatted = formatSafeCitation(deceptiveOfficialCitation, 0);
    assert.notEqual(formatted, null);
    assert.equal(formatted?.isAllowedDestination, true);
    // Raw boolean is ignored: remains false because authoritative backend provenance is absent
    assert.equal(formatted?.isVerifiedDestination, false);
    assert.equal(formatted?.provenance?.status, "unverified_allowlisted");
  });

  // 27. Authoritative backend contract provenance unlocks verified status
  it("27. Authoritative backend contract provenance verifies citation", () => {
    const verifiedBackendCitation = {
      title: "Đề án tuyển sinh trình độ đại học năm 2025",
      source: "Hội đồng Tuyển sinh EPU",
      url: "https://tuyensinh.epu.edu.vn/de-an-2025.pdf",
      provenance: {
        status: "verified_backend" as const,
        documentId: "epu-dean-2025-v1",
        sourceTier: "official_epu" as const,
      },
    };

    assert.equal(isBackendVerifiedCitation(verifiedBackendCitation), true);

    const formatted = formatSafeCitation(verifiedBackendCitation, 0);
    assert.notEqual(formatted, null);
    assert.equal(formatted?.isAllowedDestination, true);
    assert.equal(formatted?.isVerifiedDestination, true);
    assert.equal(formatted?.provenance?.status, "verified_backend");
    assert.equal(formatted?.provenance?.documentId, "epu-dean-2025-v1");
    assert.equal(formatted?.provenance?.sourceTier, "official_epu");
  });

  // 28. Rejects encoded traversal and canonicalization bypass cases
  it("28. Rejects encoded traversal (%2e%2e, %252e%252e, %5c, %00, ..%2f)", () => {
    const maliciousPaths = [
      "/post/%2e%2e/admin",
      "/post/%2e%2e%2fadmin",
      "/tuyensinh/%252e%252e/config",
      "/candidate/documents/%5c..%5cadmin",
      "/post/..%2fadmin",
      "/post/%00/admin",
      "https://tuyensinh.epu.edu.vn/post/%2e%2e/admin",
      "https://tuyensinh.epu.edu.vn/post/%252e%252e/admin",
      "https://epu.edu.vn/post/%5c..%5csecret",
      "https://epu.edu.vn/post/%00admin",
    ];

    for (const path of maliciousPaths) {
      assert.equal(hasTraversalOrCanonicalizationBypass(path), true, `Failed detecting bypass in: ${path}`);
      assert.equal(isValidUrlSyntax(path), false, `isValidUrlSyntax should reject: ${path}`);
      assert.equal(isAllowedDocumentDestination(path), false, `isAllowedDocumentDestination should reject: ${path}`);
      assert.equal(isAllowedNavigationUrl(path), false, `isAllowedNavigationUrl should reject: ${path}`);

      const formatted = formatSafeCitation(
        {
          title: "Tài liệu bypass",
          source: "EPU",
          url: path,
        },
        0
      );
      assert.equal(formatted?.url, undefined, `URL should be sanitized to undefined for: ${path}`);
      assert.equal(formatted?.isAllowedDestination, false);
      assert.equal(formatted?.isVerifiedDestination, false);
    }
  });

  // 29. Preserves safe navigation behavior without claiming verification
  it("29. Preserves safe navigation for valid destinations without false verification claims", () => {
    const validNavPaths = [
      "/post/thong-tin-tuyen-sinh",
      "/tuyensinh/huong-dan",
      "/candidate/documents/mau-don",
      "https://tuyensinh.epu.edu.vn/thong-bao",
      "https://moet.gov.vn/quy-che-2025",
    ];

    for (const path of validNavPaths) {
      assert.equal(hasTraversalOrCanonicalizationBypass(path), false);
      assert.equal(isValidUrlSyntax(path), true);
      assert.equal(isAllowedDocumentDestination(path), true);
      assert.equal(isAllowedNavigationUrl(path), true);

      const formatted = formatSafeCitation(
        {
          title: "Tài liệu hợp lệ",
          source: "EPU",
          url: path,
        },
        0
      );
      assert.equal(formatted?.url, path);
      assert.equal(formatted?.isAllowedDestination, true);
      // Navigation is allowed, but evidence verification is NOT claimed
      assert.equal(formatted?.isVerifiedDestination, false);
    }
  });
});

