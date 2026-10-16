from __future__ import annotations

import logging
import re
from typing import Any
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from scripts.crawler.models import DocumentType
from scripts.crawler.url_filter import UrlFilter

logger = logging.getLogger("epu_crawler.parsers.html_metadata")

DATE_PATTERNS = [
    re.compile(r"(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:\s+(\d{1,2}):(\d{2}))?"),
    re.compile(r"(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})"),
]

YEAR_PATTERN = re.compile(r"\b(202[3-7])\b")
MAJOR_CODE_PATTERN = re.compile(r"\b(7\d{6})\b")


class HtmlMetadataParser:
    """Extracts basic structured metadata, document links, content images, and discovery URLs from HTML pages."""

    def __init__(self, url_filter: UrlFilter | None = None) -> None:
        self.url_filter = url_filter or UrlFilter()

    def parse(
        self,
        html_content: str,
        source_url: str,
        source_id: str = "epu_admissions",
        parent_url: str | None = None,
    ) -> dict[str, Any]:
        """Parses HTML content and extracts metadata, document links, content images, and internal links.

        Returns a dictionary with:
            - "title": str
            - "canonical_url": str
            - "admission_year": int | None
            - "major_code": str | None
            - "publication_date": str | None
            - "document_links": list[str]
            - "image_links": list[str]
            - "internal_links": list[str]
        """
        soup = BeautifulSoup(html_content, "html.parser")

        # 1. Page Title
        title = ""
        title_tag = soup.find("title")
        if title_tag and title_tag.string:
            title = title_tag.string.strip()
        if not title:
            og_title = soup.find("meta", property="og:title")
            if og_title and og_title.get("content"):
                title = og_title["content"].strip()
        if not title:
            h1 = soup.find("h1")
            if h1:
                title = h1.get_text(strip=True)
        if not title:
            title = source_url.split("/")[-1] or "EPU Document"

        # 2. Canonical URL
        canonical_url = source_url
        canon_tag = soup.find("link", rel=re.compile(r"canonical", re.IGNORECASE))
        if canon_tag and canon_tag.get("href"):
            canonical_url = urljoin(source_url, canon_tag["href"].strip())

        # 3. Admission Year
        admission_year = None
        # Check title first, then text content
        year_m = YEAR_PATTERN.search(title)
        if year_m:
            admission_year = int(year_m.group(1))
        else:
            first_p = soup.find(["p", "div", "h2", "h3"])
            if first_p:
                year_m = YEAR_PATTERN.search(first_p.get_text())
                if year_m:
                    admission_year = int(year_m.group(1))

        # 4. Major Code
        major_code = None
        code_m = MAJOR_CODE_PATTERN.search(title)
        if code_m:
            major_code = code_m.group(1)
        else:
            # Check meta keywords or main content
            meta_kw = soup.find("meta", attrs={"name": "keywords"})
            if meta_kw and meta_kw.get("content"):
                code_m = MAJOR_CODE_PATTERN.search(meta_kw["content"])
                if code_m:
                    major_code = code_m.group(1)

        # 5. Publication Date
        publication_date = None
        # Meta tags
        pub_meta = (
            soup.find("meta", property="article:published_time")
            or soup.find("meta", attrs={"name": "pubdate"})
            or soup.find("meta", attrs={"name": "publishdate"})
            or soup.find("meta", attrs={"name": "date"})
        )
        if pub_meta and pub_meta.get("content"):
            publication_date = pub_meta["content"].strip()

        # Text date search e.g. "Ngày đăng: 15/03/2026"
        if not publication_date:
            date_text = soup.find(string=re.compile(r"(?:Ngày đăng|Thời gian|Cập nhật|Ngày tạo)\s*:", re.IGNORECASE))
            if date_text:
                parent_text = date_text.parent.get_text() if date_text.parent else str(date_text)
                for pat in DATE_PATTERNS:
                    dm = pat.search(parent_text)
                    if dm:
                        publication_date = dm.group(0).strip()
                        break

        # 6. Discover Document Links (.pdf, .docx, .doc, .xlsx, .xls)
        document_links: set[str] = set()
        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
                continue
            full_url = urljoin(source_url, href)
            doc_type = self.url_filter.get_document_type(full_url)
            if doc_type in (DocumentType.PDF, DocumentType.DOCX) and self.url_filter.is_valid_url(full_url):
                document_links.add(self.url_filter.canonicalize(full_url))

        # 7. Discover Relevant Content Images
        # Filter out icons, logos, footers, social share buttons
        image_links: set[str] = set()
        for img in soup.find_all("img", src=True):
            src = img["src"].strip()
            if not src or src.startswith("data:"):
                continue
            full_url = urljoin(source_url, src)

            # Check if image is relevant (content image, admissions table, infographics)
            if self._is_relevant_content_image(full_url, img) and self.url_filter.is_valid_url(full_url):
                image_links.add(self.url_filter.canonicalize(full_url))

        # 8. Discover Internal Links for Crawling (within domain & topic)
        internal_links: set[str] = set()
        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
                continue
            full_url = urljoin(source_url, href)
            canon = self.url_filter.canonicalize(full_url)

            # Only collect HTML internal links that pass domain and topic filters
            if self.url_filter.is_valid_url(canon):
                doc_type = self.url_filter.get_document_type(canon)
                if doc_type == DocumentType.HTML and self.url_filter.is_relevant_topic(canon):
                    internal_links.add(canon)

        return {
            "title": title,
            "canonical_url": canonical_url,
            "admission_year": admission_year,
            "major_code": major_code,
            "publication_date": publication_date,
            "document_links": sorted(document_links),
            "image_links": sorted(image_links),
            "internal_links": sorted(internal_links),
        }

    def _is_relevant_content_image(self, img_url: str, img_tag: Any) -> bool:
        """Determines whether an image is a meaningful content image (infographic, quota table, notice) rather than a logo/icon."""
        lower_url = img_url.lower()

        # Reject obvious decorative / UI assets
        unwanted_keywords = [
            "logo",
            "icon",
            "favicon",
            "avatar",
            "banner-nav",
            "footer",
            "header",
            "button",
            "social",
            "facebook",
            "youtube",
            "zalo",
            "tiktok",
            "arrow",
            "bullet",
            "spacer",
            "blank.gif",
            "loading",
            "placeholder",
        ]
        if any(kw in lower_url for kw in unwanted_keywords):
            return False

        # Check attributes
        alt = (img_tag.get("alt") or "").lower()
        if any(kw in alt for kw in ["logo", "biểu trưng", "icon", "trang chủ"]):
            return False

        # Positive indicators: within article body, content container, or mentions admissions
        class_str = " ".join(img_tag.get("class", [])).lower()
        if any(kw in class_str for kw in ["content", "detail", "post", "article", "news-body", "tuyensinh"]):
            return True

        # Check parent container
        parent = img_tag.parent
        for _ in range(3):
            if not parent:
                break
            p_class = " ".join(parent.get("class", [])).lower()
            if any(kw in p_class for kw in ["content", "detail", "article", "entry", "body", "news"]):
                return True
            parent = parent.parent

        # Image extensions check
        return bool(
            lower_url.endswith((".png", ".jpg", ".jpeg", ".webp"))
            and any(
                path_part in lower_url for path_part in ["/upload", "/uploads/", "/images/content/", "/tintuc/", "/baiviet/"]
            )
        )
