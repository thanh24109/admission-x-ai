from __future__ import annotations

import collections
import logging
import uuid
from datetime import UTC, datetime
from pathlib import Path

from scripts.crawler.config import (
    CrawlerConfig,
    load_sources_registry,
)
from scripts.crawler.downloader import HttpDownloader
from scripts.crawler.models import (
    CrawlManifest,
    CrawlReport,
    CrawlSourceConfig,
    DocumentMetadata,
    DocumentType,
    FailedUrlRecord,
    ProgramRecord,
)
from scripts.crawler.parsers.epu_programs import EpuProgramsParser
from scripts.crawler.parsers.html_metadata import HtmlMetadataParser
from scripts.crawler.storage import LocalStorageManager
from scripts.crawler.url_filter import UrlFilter

logger = logging.getLogger("epu_crawler.pipeline")


class CrawlerPipeline:
    """Production-minded, local-first crawling pipeline for EPU admissions."""

    def __init__(
        self,
        config: CrawlerConfig | None = None,
        downloader: HttpDownloader | None = None,
        storage: LocalStorageManager | None = None,
    ) -> None:
        self.config = config or CrawlerConfig()
        self.storage = storage or LocalStorageManager(self.config)
        self.downloader = downloader or HttpDownloader()
        self.url_filter = UrlFilter()
        self.programs_parser = EpuProgramsParser(self.downloader, self.storage)
        self.html_parser = HtmlMetadataParser(self.url_filter)

    def run(
        self,
        source_id: str | None = None,
        priority: str | None = None,
        limit: int | None = None,
        dry_run: bool = False,
        sources_yaml_path: Path | None = None,
    ) -> CrawlReport:
        """Executes crawl pipeline across specified sources or priorities."""
        run_id = f"run_{uuid.uuid4().hex[:12]}"
        start_time = datetime.now(UTC).isoformat()
        all_sources = load_sources_registry(sources_yaml_path)

        # Filter sources
        selected_sources: list[CrawlSourceConfig] = []
        for src in all_sources:
            if source_id and src.id != source_id:
                continue
            if priority and src.priority.value != priority.upper():
                continue
            selected_sources.append(src)

        if not selected_sources:
            logger.warning("No matching crawl sources found for source_id=%s, priority=%s", source_id, priority)
            return CrawlReport(
                run_id=run_id,
                crawl_timestamp=start_time,
                warnings=[f"No matching sources found for source_id={source_id}, priority={priority}"],
            )

        report = CrawlReport(
            run_id=run_id,
            crawl_timestamp=start_time,
            sources_crawled=[s.id for s in selected_sources],
        )

        logger.info("Starting crawl run %s with %d source(s) (dry_run=%s)", run_id, len(selected_sources), dry_run)

        total_programs_extracted = 0

        for src in selected_sources:
            logger.info("Processing source [%s] (%s): %s", src.id, src.priority.value, src.url)
            src_limit = limit or src.max_pages

            if src.id == "epu_programs" or src.source_type == "program_listing":
                progs, warnings = self._crawl_epu_programs(src, report=report, dry_run=dry_run)
                total_programs_extracted += len(progs)
                report.program_count_extracted += len(progs)
                report.warnings.extend(warnings)
            else:
                self._crawl_admissions_source(src, limit=src_limit, report=report, dry_run=dry_run)

        # Generate final manifest & report
        if not dry_run:
            manifest = CrawlManifest(
                run_id=run_id,
                crawl_timestamp=start_time,
                sources_crawled=report.sources_crawled,
                total_urls_discovered=report.discovered_urls_count,
                total_files_downloaded=report.successfully_downloaded_count,
                total_programs_extracted=report.program_count_extracted,
                hash_to_path=self.storage.hash_to_path,
                url_to_hash=self.storage.url_to_hash,
            )
            self.storage.save_manifest(manifest)
            self.storage.save_report(report)
            logger.info("Crawl manifest and report saved successfully.")

        logger.info(
            "Crawl completed. Discovered: %d | Downloaded: %d | Duplicates: %d | Failed: %d | Programs: %d",
            report.discovered_urls_count,
            report.successfully_downloaded_count,
            report.duplicate_files_count,
            report.failed_downloads_count,
            report.program_count_extracted,
        )
        return report

    def _crawl_epu_programs(
        self,
        src: CrawlSourceConfig,
        report: CrawlReport,
        dry_run: bool = False,
    ) -> tuple[list[ProgramRecord], list[str]]:
        """Crawls the authoritative 38 undergraduate programs page."""
        report.discovered_urls.append(src.url)
        report.accepted_urls.append(src.url)

        if dry_run:
            logger.info("[Dry Run] Would fetch and parse %s", src.url)
            return [], []

        res = self.downloader.fetch(src.url)
        if not res.success or not res.text_content:
            err_record = FailedUrlRecord(
                url=src.url,
                source_id=src.id,
                error_message=res.error_message or "Failed to fetch program page",
                error_type="fetch_error",
            )
            report.failed_downloads.append(err_record)
            return [], [f"Failed to fetch undergraduate programs: {res.error_message}"]

        # Save HTML snapshot
        rel_html_path, _is_new_html = self.storage.save_raw_file(
            url=src.url,
            content=res.content,
            sha256_hash=res.sha256,
            doc_type="html",
            custom_filename="epu_dai_hoc.html",
        )
        report.successfully_downloaded.append(rel_html_path)

        # Record HTML metadata
        html_doc_id = f"epu_prog_page_{res.sha256[:10]}"
        doc_meta = DocumentMetadata(
            document_id=html_doc_id,
            title="Đào tạo đại học chính quy - Trường Đại học Điện lực",
            source_url=src.url,
            canonical_url=src.url,
            source_id=src.id,
            document_type="html",
            local_path=rel_html_path,
            sha256=res.sha256,
            file_size_bytes=len(res.content),
        )
        self.storage.save_document_metadata(doc_meta)

        # Parse programs and attachments
        programs, warnings = self.programs_parser.parse(
            html_content=res.text_content,
            source_url=src.url,
            download_attachments=True,
        )

        # Record downloaded attachments into report & document metadata
        for prog in programs:
            for att in prog.attachments:
                report.discovered_urls.append(att.source_url)
                if att.status == "downloaded":
                    report.successfully_downloaded.append(att.local_path)
                    # Also register document metadata for the attachment
                    att_doc_meta = DocumentMetadata(
                        document_id=f"doc_{att.sha256[:12]}",
                        title=f"CTĐT {prog.major_name} ({prog.major_code})",
                        source_url=att.source_url,
                        canonical_url=att.source_url,
                        parent_url=src.url,
                        source_id=src.id,
                        document_type="pdf",
                        major_code=prog.major_code,
                        local_path=att.local_path,
                        sha256=att.sha256,
                        file_size_bytes=att.file_size_bytes,
                    )
                    self.storage.save_document_metadata(att_doc_meta)
                elif att.status == "duplicate":
                    report.duplicate_files.append(att.local_path)
                elif att.status == "failed":
                    report.failed_downloads.append(
                        FailedUrlRecord(
                            url=att.source_url,
                            parent_url=src.url,
                            source_id=src.id,
                            error_message="Attachment download failed",
                            error_type="attachment_error",
                        )
                    )

        # Save programs.jsonl
        self.storage.save_program_records(programs, overwrite=True)
        return programs, warnings

    def _crawl_admissions_source(
        self,
        src: CrawlSourceConfig,
        limit: int,
        report: CrawlReport,
        dry_run: bool = False,
    ) -> None:
        """Crawls admissions portals, news listings, and articles using BFS bounded discovery."""
        visited_urls: set[str] = set()
        queue: collections.deque[tuple[str, int, str | None]] = collections.deque()
        queue.append((src.url, 0, None))

        downloaded_count = 0
        max_depth = 2

        while queue and downloaded_count < limit:
            current_url, depth, parent_url = queue.popleft()
            canonical_url = self.url_filter.canonicalize(current_url)

            if canonical_url in visited_urls:
                continue
            visited_urls.add(canonical_url)

            report.discovered_urls.append(canonical_url)

            # Check if domain and topic are allowed
            if not self.url_filter.is_valid_url(canonical_url):
                report.rejected_urls.append(canonical_url)
                continue

            report.accepted_urls.append(canonical_url)

            if dry_run:
                logger.info("[Dry Run] Discovered URL: %s (depth %d)", canonical_url, depth)
                downloaded_count += 1
                continue

            # Fetch page / document
            res = self.downloader.fetch(canonical_url)
            if not res.success or not res.content:
                report.failed_downloads.append(
                    FailedUrlRecord(
                        url=canonical_url,
                        parent_url=parent_url,
                        source_id=src.id,
                        error_message=res.error_message or "Download failed",
                        error_type="fetch_error",
                    )
                )
                continue

            doc_type = self.url_filter.get_document_type(canonical_url)
            if doc_type == DocumentType.UNKNOWN:
                if "application/pdf" in res.content_type:
                    doc_type = DocumentType.PDF
                elif "image/" in res.content_type:
                    doc_type = DocumentType.IMAGE
                else:
                    doc_type = DocumentType.HTML

            # Save content to disk
            rel_path, is_new = self.storage.save_raw_file(
                url=canonical_url,
                content=res.content,
                sha256_hash=res.sha256,
                doc_type=doc_type.value,
            )

            if is_new:
                report.successfully_downloaded.append(rel_path)
            else:
                report.duplicate_files.append(rel_path)

            downloaded_count += 1

            # If HTML, parse metadata and discover further links & attachments
            if doc_type == DocumentType.HTML and res.text_content:
                parsed = self.html_parser.parse(
                    html_content=res.text_content,
                    source_url=canonical_url,
                    source_id=src.id,
                    parent_url=parent_url,
                )

                # Save document metadata record
                doc_meta = DocumentMetadata(
                    document_id=f"doc_{res.sha256[:12]}",
                    title=parsed.get("title") or "Tài liệu Tuyển sinh EPU",
                    source_url=canonical_url,
                    canonical_url=parsed.get("canonical_url") or canonical_url,
                    parent_url=parent_url,
                    source_id=src.id,
                    document_type="html",
                    admission_year=parsed.get("admission_year"),
                    major_code=parsed.get("major_code"),
                    local_path=rel_path,
                    sha256=res.sha256,
                    file_size_bytes=len(res.content),
                    metadata_extra={"publication_date": parsed.get("publication_date")},
                )
                self.storage.save_document_metadata(doc_meta)

                # Discover and download attachments (PDF/DOCX)
                if src.discover_attachments:
                    for att_url in parsed.get("document_links", []):
                        if att_url not in visited_urls and len(visited_urls) < (limit * 2):
                            report.discovered_urls.append(att_url)
                            if self.url_filter.is_valid_url(att_url):
                                report.accepted_urls.append(att_url)
                                att_res = self.downloader.fetch(att_url)
                                if att_res.success and att_res.content:
                                    att_type = self.url_filter.get_document_type(att_url)
                                    att_rel_path, att_is_new = self.storage.save_raw_file(
                                        url=att_url,
                                        content=att_res.content,
                                        sha256_hash=att_res.sha256,
                                        doc_type=att_type.value,
                                    )
                                    if att_is_new:
                                        report.successfully_downloaded.append(att_rel_path)
                                    else:
                                        report.duplicate_files.append(att_rel_path)

                                    att_meta = DocumentMetadata(
                                        document_id=f"doc_{att_res.sha256[:12]}",
                                        title=f"Đính kèm: {Path(att_rel_path).name}",
                                        source_url=att_url,
                                        canonical_url=att_url,
                                        parent_url=canonical_url,
                                        source_id=src.id,
                                        document_type=att_type.value,
                                        local_path=att_rel_path,
                                        sha256=att_res.sha256,
                                        file_size_bytes=len(att_res.content),
                                    )
                                    self.storage.save_document_metadata(att_meta)
                                else:
                                    report.failed_downloads.append(
                                        FailedUrlRecord(
                                            url=att_url,
                                            parent_url=canonical_url,
                                            source_id=src.id,
                                            error_message=att_res.error_message or "Attachment download failed",
                                            error_type="attachment_error",
                                        )
                                    )
                            visited_urls.add(att_url)

                # Discover and download relevant content images
                for img_url in parsed.get("image_links", []):
                    if img_url not in visited_urls and len(report.successfully_downloaded) < (limit * 3):
                        report.discovered_urls.append(img_url)
                        if self.url_filter.is_valid_url(img_url):
                            report.accepted_urls.append(img_url)
                            img_res = self.downloader.fetch(img_url)
                            if img_res.success and img_res.content:
                                img_rel_path, img_is_new = self.storage.save_raw_file(
                                    url=img_url,
                                    content=img_res.content,
                                    sha256_hash=img_res.sha256,
                                    doc_type="image",
                                )
                                if img_is_new:
                                    report.successfully_downloaded.append(img_rel_path)
                                else:
                                    report.duplicate_files.append(img_rel_path)

                                img_meta = DocumentMetadata(
                                    document_id=f"img_{img_res.sha256[:12]}",
                                    title=f"Ảnh nội dung: {Path(img_rel_path).name}",
                                    source_url=img_url,
                                    canonical_url=img_url,
                                    parent_url=canonical_url,
                                    source_id=src.id,
                                    document_type="image",
                                    local_path=img_rel_path,
                                    sha256=img_res.sha256,
                                    file_size_bytes=len(img_res.content),
                                )
                                self.storage.save_document_metadata(img_meta)
                        visited_urls.add(img_url)

                # Discover internal links for further BFS crawling
                if src.discover_links and depth < max_depth:
                    for child_url in parsed.get("internal_links", []):
                        if child_url not in visited_urls:
                            queue.append((child_url, depth + 1, canonical_url))
            else:
                # Binary document direct entry
                doc_meta = DocumentMetadata(
                    document_id=f"doc_{res.sha256[:12]}",
                    title=f"Tài liệu {Path(rel_path).name}",
                    source_url=canonical_url,
                    canonical_url=canonical_url,
                    parent_url=parent_url,
                    source_id=src.id,
                    document_type=doc_type.value,
                    local_path=rel_path,
                    sha256=res.sha256,
                    file_size_bytes=len(res.content),
                )
                self.storage.save_document_metadata(doc_meta)

    def retry_failed(self, dry_run: bool = False) -> CrawlReport:
        """Retries downloading previously failed URLs from reports/failed_urls.json."""
        run_id = f"retry_{uuid.uuid4().hex[:12]}"
        report = CrawlReport(
            run_id=run_id,
            crawl_timestamp=datetime.now(UTC).isoformat(),
            sources_crawled=["retry_failed"],
        )

        failed_file = self.config.failed_urls_file
        if not failed_file.exists():
            logger.info("No failed URLs file found at %s", failed_file)
            return report

        import json

        try:
            with open(failed_file, "r", encoding="utf-8") as f:
                failed_items = json.load(f)
        except Exception as e:  # noqa: BLE001
            logger.error("Failed to read %s: %s", failed_file, e)
            return report

        remaining_failed: list[FailedUrlRecord] = []
        logger.info("Retrying %d failed URL(s)...", len(failed_items))

        for item in failed_items:
            url = item["url"]
            parent_url = item.get("parent_url")
            source_id = item.get("source_id", "retry")
            report.discovered_urls.append(url)
            report.accepted_urls.append(url)

            if dry_run:
                logger.info("[Dry Run] Would retry: %s", url)
                continue

            res = self.downloader.fetch(url)
            if res.success and res.content:
                doc_type = self.url_filter.get_document_type(url)
                if doc_type == DocumentType.UNKNOWN:
                    doc_type = DocumentType.PDF if "pdf" in res.content_type else DocumentType.HTML

                rel_path, _is_new = self.storage.save_raw_file(
                    url=url,
                    content=res.content,
                    sha256_hash=res.sha256,
                    doc_type=doc_type.value,
                )
                report.successfully_downloaded.append(rel_path)
                logger.info("Successfully recovered failed URL: %s", url)
            else:
                remaining_failed.append(
                    FailedUrlRecord(
                        url=url,
                        parent_url=parent_url,
                        source_id=source_id,
                        error_message=res.error_message or "Retry failed",
                        error_type="retry_failure",
                        attempt_count=item.get("attempt_count", 1) + 1,
                    )
                )

        report.failed_downloads = remaining_failed

        if not dry_run:
            self.storage.save_report(report)

        return report
