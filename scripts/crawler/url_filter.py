from __future__ import annotations

import re
from typing import Any
from urllib.parse import parse_qsl, urlencode, urljoin, urlparse, urlunparse

from scripts.crawler.config import (
    ALLOWED_DOMAINS,
    DOCUMENT_EXTENSIONS,
    IMAGE_EXTENSIONS,
)

# Tracking query parameters to strip
STRIP_QUERY_PARAMS = {
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "fbclid",
    "gclid",
    "_gl",
    "ref",
    "source",
}

# Negative keywords for URL exclusion
EXCLUDED_PATH_KEYWORDS = [
    "/login",
    "/logout",
    "/dang-nhap",
    "/dang-xuat",
    "/admin",
    "/wp-admin",
    "/cart",
    "/gio-hang",
    "/search",
    "/tim-kiem",
    "/calendar",
    "/lich-tuan",
    "/auth",
    "/oauth",
    "/feed",
    "/rss",
    "javascript:",
    "mailto:",
    "tel:",
]

# Positive keywords for relevant undergraduate admissions & programs
RELEVANT_TOPIC_KEYWORDS = [
    "tuyensinh",
    "tuyen-sinh",
    "dai-hoc",
    "nganh-dao-tao",
    "chuong-trinh",
    "xet-tuyen",
    "diem-chuan",
    "hoc-phi",
    "hoc-bong",
    "de-an",
    "chi-tieu",
    "to-hop",
    "khung-chuong-trinh",
    "ho-so",
    "ctsv",
    "Uploads",
    "CTDaoTao",
    "chi-tiet-tin",
    "chi-tiet-nganh-dao-tao",
    "danh-sach-tin",
    "page/dai-hoc",
]


def canonicalize_url(url: str, base_url: str | None = None) -> str:
    """Normalize and canonicalize a URL."""
    if not url:
        return ""

    url = url.strip()

    # Resolve relative URLs
    if base_url:
        url = urljoin(base_url, url)

    parsed = urlparse(url)
    scheme = parsed.scheme.lower()
    netloc = parsed.netloc.lower()

    # Drop non-http schemes
    if scheme not in ("http", "https"):
        return ""

    # Normalize path
    path = parsed.path
    if not path:
        path = "/"
    else:
        # Collapse multiple slashes
        path = re.sub(r"/+", "/", path)
        # Strip trailing slash if not root
        if len(path) > 1 and path.endswith("/"):
            path = path[:-1]

    # Clean query parameters
    query_params = parse_qsl(parsed.query, keep_blank_values=False)
    filtered_params = [
        (k, v) for k, v in query_params if k.lower() not in STRIP_QUERY_PARAMS
    ]
    # Sort query params for deterministic canonical URL
    filtered_params.sort(key=lambda x: x[0])
    query = urlencode(filtered_params)

    # Reconstruct without fragment
    return urlunparse((scheme, netloc, path, parsed.params, query, ""))


def get_domain(url: str) -> str:
    """Extract domain from URL without port."""
    parsed = urlparse(url)
    netloc = parsed.netloc.lower()
    return netloc.split(":")[0]


def is_allowed_domain(url: str) -> bool:
    """Check if the URL belongs to an approved EPU domain."""
    domain = get_domain(url)
    return domain in ALLOWED_DOMAINS


def is_relevant_topic(url: str) -> bool:
    """Filter URLs to focus on official admissions, undergraduate programs, and documents."""
    parsed = urlparse(url)
    full_path_query = (parsed.path + "?" + parsed.query).lower()

    # Exclude unwanted paths
    for kw in EXCLUDED_PATH_KEYWORDS:
        if kw in full_path_query:
            return False

    # Check for direct document extension (always relevant)
    for ext in DOCUMENT_EXTENSIONS:
        if parsed.path.lower().endswith(ext):
            return True

    # Check for topic match
    for kw in RELEVANT_TOPIC_KEYWORDS:
        if kw.lower() in full_path_query:
            return True

    # Root pages of admissions are relevant
    return parsed.path in ("", "/")


def classify_document_type(url: str, content_type: str | None = None) -> str:
    """Determine document type (html, pdf, docx, image, unknown)."""
    parsed = urlparse(url)
    path_lower = parsed.path.lower()

    if path_lower.endswith(".pdf") or (content_type and "application/pdf" in content_type):
        return "pdf"
    if path_lower.endswith(".docx") or (
        content_type and "application/vnd.openxmlformats-officedocument.wordprocessingml" in content_type
    ):
        return "docx"
    if path_lower.endswith(".doc") or (content_type and "application/msword" in content_type):
        return "docx"
    for img_ext in IMAGE_EXTENSIONS:
        if path_lower.endswith(img_ext):
            return "image"
    if content_type and "image/" in content_type:
        return "image"
    if path_lower.endswith((".html", ".htm")) or (content_type and "text/html" in content_type):
        return "html"

    # Default to html if text/plain or web page or URL has no extension
    if content_type and "text/" in content_type:
        return "html"

    # Extensionless paths (e.g. /page/dai-hoc, /about) are web pages
    last_seg = path_lower.strip("/").split("/")[-1]
    if "." not in last_seg:
        return "html"

    return "unknown"


class UrlFilter:
    """Helper class providing URL canonicalization, domain filtering, and topic relevance checks."""

    def __init__(self, allowed_domains: set[str] | None = None) -> None:
        self.allowed_domains = allowed_domains or ALLOWED_DOMAINS

    def canonicalize(self, url: str, base_url: str | None = None) -> str:
        return canonicalize_url(url, base_url)

    def is_allowed_domain(self, url: str) -> bool:
        domain = get_domain(url)
        return domain in self.allowed_domains

    def is_relevant_topic(self, url: str) -> bool:
        return is_relevant_topic(url)

    def is_valid_url(self, url: str) -> bool:
        return self.is_allowed_domain(url) and self.is_relevant_topic(url)

    def get_document_type(self, url: str, content_type: str | None = None) -> Any:
        from scripts.crawler.models import DocumentType

        doc_type_str = classify_document_type(url, content_type)
        try:
            return DocumentType(doc_type_str)
        except ValueError:
            return DocumentType.UNKNOWN

