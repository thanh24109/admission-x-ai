from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

from scripts.crawler.models import CrawlPriority, CrawlSourceConfig

# Root paths
REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATA_DIR = REPO_ROOT / "data" / "crawled"

# Official allowed domains
ALLOWED_DOMAINS = {
    "epu.edu.vn",
    "tuyensinh.epu.edu.vn",
    "ctsv.epu.edu.vn",
    "old.epu.edu.vn",  # Official EPU host for program attachment files
}

# Network and download settings
DEFAULT_TIMEOUT = 25.0
DEFAULT_MAX_RETRIES = 3
DEFAULT_RETRY_BACKOFF = 1.5
DEFAULT_RATE_LIMIT_DELAY = 0.5  # seconds
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 "
    "EPU-Admissions-Crawler/1.0"
)

# File extensions for classification
DOCUMENT_EXTENSIONS = {".pdf", ".docx", ".doc"}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
HTML_EXTENSIONS = {".html", ".htm", ""}


class CrawlerConfig:
    def __init__(self, output_dir: Path | None = None):
        self.output_dir = output_dir or DEFAULT_DATA_DIR
        self.raw_dir = self.output_dir / "raw"
        self.html_dir = self.raw_dir / "html"
        self.pdf_dir = self.raw_dir / "pdf"
        self.docx_dir = self.raw_dir / "docx"
        self.images_dir = self.raw_dir / "images"
        self.metadata_dir = self.output_dir / "metadata"
        self.manifests_dir = self.output_dir / "manifests"
        self.reports_dir = self.output_dir / "reports"
        self.converted_dir = self.output_dir / "converted"
        self.converted_docx_dir = self.converted_dir / "docx"

        self.documents_file = self.metadata_dir / "documents.jsonl"
        self.programs_file = self.metadata_dir / "programs.jsonl"
        self.manifest_file = self.manifests_dir / "crawl_manifest.json"
        self.report_file = self.reports_dir / "crawl_report.json"
        self.failed_urls_file = self.reports_dir / "failed_urls.json"
        self.conversion_report_file = self.reports_dir / "doc_conversion_report.json"

    def ensure_directories(self) -> None:
        """Create local output directory structure."""
        for directory in [
            self.html_dir,
            self.pdf_dir,
            self.docx_dir,
            self.images_dir,
            self.converted_dir,
            self.converted_docx_dir,
            self.metadata_dir,
            self.manifests_dir,
            self.reports_dir,
        ]:
            directory.mkdir(parents=True, exist_ok=True)


def load_sources_registry(yaml_path: Path | None = None) -> list[CrawlSourceConfig]:
    """Load sources from sources.yaml file."""
    path = yaml_path or (Path(__file__).parent / "sources.yaml")
    if not path.exists():
        raise FileNotFoundError(f"Sources registry not found at {path}")

    with open(path, "r", encoding="utf-8") as f:
        data: dict[str, Any] = yaml.safe_load(f)

    sources_raw = data.get("sources", [])
    configs: list[CrawlSourceConfig] = []
    for item in sources_raw:
        configs.append(
            CrawlSourceConfig(
                id=item["id"],
                name=item["name"],
                url=item["url"],
                priority=CrawlPriority(item.get("priority", "P0")),
                source_type=item.get("source_type", "admissions"),
                max_pages=item.get("max_pages", 50),
                description=item.get("description", ""),
                discover_attachments=item.get("discover_attachments", True),
                discover_links=item.get("discover_links", True),
            )
        )
    return configs
