from __future__ import annotations

from datetime import UTC, datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class CrawlPriority(str, Enum):
    P0 = "P0"
    P1 = "P1"


class DocumentType(str, Enum):
    HTML = "html"
    PDF = "pdf"
    DOCX = "docx"
    IMAGE = "image"
    UNKNOWN = "unknown"


class AttachmentInfo(BaseModel):
    file_name: str
    source_url: str
    local_path: str
    file_size_bytes: int = 0
    sha256: str = ""
    content_type: str = "application/pdf"
    downloaded_at: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())
    status: str = "downloaded"


class ProgramRecord(BaseModel):
    """Schema for programs.jsonl representing an official EPU undergraduate program."""
    stt: int | None = None
    major_code: str
    major_name: str
    degree: str | None = None
    duration: str | None = None
    specializations: list[str] = Field(default_factory=list)
    source_url: str
    attachments: list[AttachmentInfo] = Field(default_factory=list)


class DocumentMetadata(BaseModel):
    """Schema for documents.jsonl tracking collected official admissions documents and web pages."""
    document_id: str
    title: str
    source_url: str
    canonical_url: str
    parent_url: str | None = None
    source_id: str
    document_type: str  # html, pdf, docx, image
    admission_year: int | None = None
    major_code: str | None = None
    local_path: str  # portable relative path from crawl root, e.g. "raw/pdf/example.pdf"
    sha256: str
    file_size_bytes: int
    downloaded_at: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())
    status: str = "downloaded"  # downloaded, duplicate, failed
    metadata_extra: dict[str, Any] = Field(default_factory=dict)


class CrawlSourceConfig(BaseModel):
    id: str
    name: str
    url: str
    priority: CrawlPriority
    source_type: str = "admissions"  # program_listing, admissions_page, listing, general
    max_pages: int = 50
    description: str = ""
    discover_attachments: bool = True
    discover_links: bool = True


class FailedUrlRecord(BaseModel):
    url: str
    parent_url: str | None = None
    source_id: str
    error_message: str
    error_type: str
    attempt_count: int = 1
    failed_at: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())


class CrawlManifest(BaseModel):
    run_id: str
    crawl_timestamp: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())
    sources_crawled: list[str] = Field(default_factory=list)
    total_urls_discovered: int = 0
    total_files_downloaded: int = 0
    total_programs_extracted: int = 0
    file_inventory: dict[str, dict[str, Any]] = Field(default_factory=dict)
    url_to_hash: dict[str, str] = Field(default_factory=dict)
    hash_to_path: dict[str, str] = Field(default_factory=dict)


class CrawlReport(BaseModel):
    run_id: str
    crawl_timestamp: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())
    duration_seconds: float = 0.0
    sources_crawled: list[str] = Field(default_factory=list)
    discovered_urls: list[str] = Field(default_factory=list)
    accepted_urls: list[str] = Field(default_factory=list)
    rejected_urls: list[str] = Field(default_factory=list)
    successfully_downloaded: list[str] = Field(default_factory=list)
    duplicate_files: list[str] = Field(default_factory=list)
    failed_downloads: list[FailedUrlRecord] = Field(default_factory=list)
    program_count_extracted: int = 0
    missing_program_fields: list[str] = Field(default_factory=list)
    attachment_failures: list[dict[str, Any]] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)

    @property
    def discovered_urls_count(self) -> int:
        return len(self.discovered_urls)

    @property
    def accepted_urls_count(self) -> int:
        return len(self.accepted_urls)

    @property
    def rejected_urls_count(self) -> int:
        return len(self.rejected_urls)

    @property
    def successfully_downloaded_count(self) -> int:
        return len(self.successfully_downloaded)

    @property
    def duplicate_files_count(self) -> int:
        return len(self.duplicate_files)

    @property
    def failed_downloads_count(self) -> int:
        return len(self.failed_downloads)
