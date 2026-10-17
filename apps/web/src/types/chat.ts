export type ChatRole = "user" | "assistant" | "system";

export type CitationProvenanceStatus =
  | "verified_backend"
  | "unverified_allowlisted"
  | "untrusted";

export interface CitationProvenanceMetadata {
  status: CitationProvenanceStatus;
  documentId?: string;
  sourceTier?: "official_epu" | "secondary_gov" | "general";
  verificationHash?: string;
}

export interface ChatCitation {
  id: string;
  title: string;
  source: string;
  page?: string;
  fileType?: "pdf" | "docx" | "url" | "web";
  fileSize?: string;
  url?: string;
  /**
   * @deprecated Matching an allowlisted URL does NOT mean the citation is verified.
   * Kept optional for legacy consumers. Do not rely on this as proof of verification.
   */
  isVerifiedDestination?: boolean;
  /**
   * Whether the URL destination matches the approved navigation allowlist.
   */
  isAllowedDestination?: boolean;
  /**
   * Structured future integration boundary for backend-verified citation records.
   */
  provenance?: CitationProvenanceMetadata;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  citations?: ChatCitation[];
  extraSources?: string[];
  chips?: string[];
  feedback?: "like" | "dislike" | null;
}

export type SuggestionTabKey = "popular" | "by_major" | "admissions" | "tuition";

export interface QuestionSuggestion {
  id: string;
  text: string;
  category: SuggestionTabKey;
}

export interface RelatedDocumentItem {
  id: string;
  title: string;
  source: string;
  fileSize?: string;
  fileType?: "pdf" | "docx" | "url" | "web";
  downloadUrl?: string;
}
