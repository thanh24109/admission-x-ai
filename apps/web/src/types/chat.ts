export type ChatRole = "user" | "assistant" | "system";

export interface ChatCitation {
  id: string;
  title: string;
  source: string;
  page?: string;
  fileType?: "pdf" | "docx" | "url" | "web";
  fileSize?: string;
  url?: string;
  isVerifiedDestination?: boolean;
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
