from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock

from scripts.crawler.config import CrawlerConfig
from scripts.crawler.downloader import HttpDownloader
from scripts.crawler.models import CrawlPriority, CrawlSourceConfig
from scripts.crawler.pipeline import CrawlerPipeline
from scripts.crawler.storage import LocalStorageManager


def test_pipeline_idempotency(tmp_path: Path):
    config = CrawlerConfig(output_dir=tmp_path)
    storage = LocalStorageManager(config)

    # Mock HTML and PDF responses
    mock_downloader = MagicMock(spec=HttpDownloader)

    html_content = b"""
    <!DOCTYPE html>
    <html>
      <head><title>Tuyen sinh EPU 2026</title></head>
      <body>
        <h1>Thong tin tuyen sinh</h1>
        <a href="/doc1.pdf">Download PDF</a>
      </body>
    </html>
    """
    pdf_content = b"%PDF-1.4 official pdf content test"

    res_html = MagicMock()
    res_html.success = True
    res_html.content = html_content
    res_html.text = html_content.decode("utf-8")
    res_html.text_content = res_html.text
    res_html.status_code = 200
    res_html.content_type = "text/html"
    res_html.error_message = None
    import hashlib
    res_html.sha256 = hashlib.sha256(html_content).hexdigest()

    res_pdf = MagicMock()
    res_pdf.success = True
    res_pdf.content = pdf_content
    res_pdf.text = ""
    res_pdf.text_content = ""
    res_pdf.status_code = 200
    res_pdf.content_type = "application/pdf"
    res_pdf.error_message = None
    res_pdf.sha256 = hashlib.sha256(pdf_content).hexdigest()

    def mock_fetch(url: str):
        if "doc1.pdf" in url:
            return res_pdf
        return res_html

    mock_downloader.fetch.side_effect = mock_fetch

    pipeline = CrawlerPipeline(config=config, downloader=mock_downloader, storage=storage)

    src = CrawlSourceConfig(
        id="test_src",
        name="Test Source",
        url="https://tuyensinh.epu.edu.vn/tuyen-sinh-2026.html",
        priority=CrawlPriority.P0,
        max_pages=5,
        discover_attachments=True,
    )

    # First run
    report1 = MagicMock()
    report1.discovered_urls = []
    report1.accepted_urls = []
    report1.rejected_urls = []
    report1.successfully_downloaded = []
    report1.duplicate_files = []
    report1.failed_downloads = []
    pipeline._crawl_admissions_source(src, limit=5, report=report1, dry_run=False)

    assert len(report1.successfully_downloaded) == 2  # 1 html + 1 pdf
    assert len(report1.duplicate_files) == 0

    # Second run on same pipeline instance (simulating repeated crawl)
    report2 = MagicMock()
    report2.discovered_urls = []
    report2.accepted_urls = []
    report2.rejected_urls = []
    report2.successfully_downloaded = []
    report2.duplicate_files = []
    report2.failed_downloads = []
    pipeline._crawl_admissions_source(src, limit=5, report=report2, dry_run=False)

    assert len(report2.successfully_downloaded) == 0
    assert len(report2.duplicate_files) == 2  # Both detected as duplicate content!
