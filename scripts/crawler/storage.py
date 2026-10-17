from __future__ import annotations

import hashlib
import json
import logging
import os
import re
import unicodedata
from pathlib import Path
from urllib.parse import unquote, urlparse

from scripts.crawler.config import CrawlerConfig
from scripts.crawler.models import (
    CrawlManifest,
    CrawlReport,
    DocumentMetadata,
    ProgramRecord,
)

logger = logging.getLogger(__name__)


def slugify_vietnamese(text: str, max_length: int = 100) -> str:
    """Converts Vietnamese text to a clean ASCII slug with underscores."""
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = text.replace("đ", "d").replace("Đ", "D")
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s-]+", "_", text.strip())
    clean = text.strip("_")
    if len(clean) > max_length:
        clean = clean[:max_length].rstrip("_")
    return clean or "document"


def sanitize_filename(name: str, max_length: int = 120) -> str:
    """Sanitize string for safe filesystem usage across platforms."""
    name = unquote(name)
    p = Path(name)
    suffix = p.suffix if p.suffix and len(p.suffix) <= 6 else ""
    stem = name[: len(name) - len(suffix)] if suffix else name

    clean_stem = re.sub(r'[\\/*?:"<>|#%&{}\'!\s@$,;]+', "_", stem).strip("._")
    clean_stem = re.sub(r"_+", "_", clean_stem)
    if not clean_stem:
        clean_stem = "document"
    if len(clean_stem) > max_length:
        clean_stem = clean_stem[:max_length].rstrip("._")
    return f"{clean_stem}{suffix}"


class LocalStorageManager:
    """Manages storage of raw crawled files and structured metadata."""

    def __init__(self, config: CrawlerConfig | None = None):
        self.config = config or CrawlerConfig()
        self.config.ensure_directories()

        # Indexes for content and URL deduplication
        self.hash_to_path: dict[str, str] = {}
        self.url_to_hash: dict[str, str] = {}
        self.known_document_ids: set[str] = set()
        self.known_program_codes: set[str] = set()

        self._load_existing_indexes()

    def _load_existing_indexes(self) -> None:
        """Load known hashes and IDs from existing metadata and manifest."""
        if self.config.manifest_file.exists():
            try:
                with open(self.config.manifest_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.hash_to_path = data.get("hash_to_path", {})
                    self.url_to_hash = data.get("url_to_hash", {})
            except Exception as e:  # noqa: BLE001
                logger.warning("Could not read existing manifest for index: %s", e)

        if self.config.documents_file.exists():
            try:
                with open(self.config.documents_file, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line:
                            doc = json.loads(line)
                            self.known_document_ids.add(doc.get("document_id", ""))
                            if doc.get("sha256") and doc.get("local_path"):
                                self.hash_to_path[doc["sha256"]] = doc["local_path"]
                            if doc.get("source_url") and doc.get("sha256"):
                                self.url_to_hash[doc["source_url"]] = doc["sha256"]
            except Exception as e:  # noqa: BLE001
                logger.warning("Could not read documents.jsonl for index: %s", e)

        if self.config.programs_file.exists():
            try:
                with open(self.config.programs_file, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line:
                            prog = json.loads(line)
                            self.known_program_codes.add(prog.get("major_code", ""))
            except Exception as e:  # noqa: BLE001
                logger.warning("Could not read programs.jsonl for index: %s", e)

    def is_content_downloaded(self, sha256_hash: str) -> tuple[bool, str | None]:
        """Check if identical content has already been stored."""
        if sha256_hash in self.hash_to_path:
            rel_path = self.hash_to_path[sha256_hash]
            full_path = self.config.output_dir / rel_path
            if full_path.exists():
                return True, rel_path
        return False, None

    def save_raw_file(
        self,
        url: str,
        content: bytes,
        sha256_hash: str,
        doc_type: str,
        custom_filename: str | None = None,
        preserve_exact_name: bool = False,
    ) -> tuple[str, bool]:
        """Save binary or text content to appropriate raw directory atomically.

        Returns (relative_path, is_new_file).
        """
        # Content-level deduplication
        is_existing, existing_rel_path = self.is_content_downloaded(sha256_hash)
        if is_existing and existing_rel_path:
            self.url_to_hash[url] = sha256_hash
            return existing_rel_path, False

        # In-stream automatic conversion for legacy Word .doc to .docx
        if doc_type == "docx":
            from scripts.crawler.doc_detector import DocFormatDetector

            parsed_path = urlparse(url).path.lower()
            is_legacy = DocFormatDetector.is_legacy_doc(content) or parsed_path.endswith(".doc")
            if is_legacy:
                from scripts.crawler.doc_converter import DocConverter

                converter = DocConverter(config=self.config)

                if custom_filename:
                    doc_base_name = custom_filename
                else:
                    path_part = Path(urlparse(url).path).name or "document.docx"
                    doc_base_name = sanitize_filename(path_part)

                if doc_base_name.lower().endswith(".doc"):
                    doc_base_name = doc_base_name[:-4] + ".docx"
                elif not doc_base_name.lower().endswith(".docx"):
                    doc_base_name += ".docx"

                short_h = sha256_hash[:8]
                final_docx_name = f"{short_h}_{doc_base_name}"
                final_docx_path = self.config.docx_dir / final_docx_name

                # If already converted and exists, return existing
                if final_docx_path.exists():
                    conv_hash = hashlib.sha256(final_docx_path.read_bytes()).hexdigest()
                    rel_p = f"raw/docx/{final_docx_name}"
                    self.hash_to_path[sha256_hash] = rel_p
                    self.hash_to_path[conv_hash] = rel_p
                    self.url_to_hash[url] = conv_hash
                    return rel_p, False

                # Convert directly to .docx
                success, final_path, conv_bytes, engine = converter.convert_doc_bytes(
                    content=content,
                    filename=final_docx_name,
                    target_dir=self.config.docx_dir,
                )
                if success and final_path.exists() and conv_bytes:
                    conv_hash = hashlib.sha256(conv_bytes).hexdigest()
                    rel_p = f"raw/docx/{final_path.name}"
                    self.hash_to_path[sha256_hash] = rel_p
                    self.hash_to_path[conv_hash] = rel_p
                    self.url_to_hash[url] = conv_hash
                    logger.info("Directly converted crawled DOC to DOCX: %s via %s", final_path.name, engine)
                    return rel_p, True
                logger.warning("Direct conversion of DOC failed; proceeding with fallback storage")

        # Pick directory based on doc_type
        if doc_type == "pdf":
            target_dir = self.config.pdf_dir
            default_ext = ".pdf"
            subdir = "raw/pdf"
        elif doc_type == "docx":
            target_dir = self.config.docx_dir
            default_ext = ".docx"
            subdir = "raw/docx"
        elif doc_type == "image":
            target_dir = self.config.images_dir
            default_ext = ".jpg"
            subdir = "raw/images"
        else:
            target_dir = self.config.html_dir
            default_ext = ".html"
            subdir = "raw/html"

        # Determine safe filename
        if custom_filename:
            base_name = custom_filename
        else:
            parsed = urlparse(url)
            path_part = Path(parsed.path).name or "index"
            base_name = sanitize_filename(path_part)

        # Ensure docx files never have .doc extension
        if doc_type == "docx" and base_name.lower().endswith(".doc"):
            base_name = base_name[:-4] + ".docx"

        if not base_name.endswith(default_ext) and not any(
            base_name.endswith(ext)
            for ext in [".pdf", ".docx", ".png", ".jpg", ".jpeg", ".webp", ".html"]
        ):
            base_name += default_ext

        # Prefix with short hash for collision safety unless preserve_exact_name is requested
        if preserve_exact_name and custom_filename:
            filename = custom_filename
        else:
            short_hash = sha256_hash[:8]
            filename = f"{short_hash}_{base_name}"
        full_path = target_dir / filename
        tmp_path = target_dir / f"{filename}.tmp"

        # Atomic write
        try:
            with open(tmp_path, "wb") as f:
                f.write(content)
            os.replace(tmp_path, full_path)
        except Exception:
            if tmp_path.exists():
                tmp_path.unlink()
            raise

        rel_path = f"{subdir}/{filename}"
        self.hash_to_path[sha256_hash] = rel_path
        self.url_to_hash[url] = sha256_hash
        return rel_path, True

    def save_document_metadata(self, metadata: DocumentMetadata) -> None:
        """Append or update a record in documents.jsonl."""
        self.known_document_ids.add(metadata.document_id)
        with open(self.config.documents_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(metadata.model_dump(), ensure_ascii=False) + "\n")

    def save_program_records(self, programs: list[ProgramRecord], overwrite: bool = False) -> None:
        """Write or append records to programs.jsonl."""
        mode = "w" if overwrite else "a"
        with open(self.config.programs_file, mode, encoding="utf-8") as f:
            for p in programs:
                self.known_program_codes.add(p.major_code)
                f.write(json.dumps(p.model_dump(), ensure_ascii=False) + "\n")

    def save_manifest(self, manifest: CrawlManifest) -> None:
        """Write crawl_manifest.json."""
        manifest.hash_to_path = self.hash_to_path
        manifest.url_to_hash = self.url_to_hash
        with open(self.config.manifest_file, "w", encoding="utf-8") as f:
            json.dump(manifest.model_dump(), f, ensure_ascii=False, indent=2)

    def save_report(self, report: CrawlReport) -> None:
        """Write crawl_report.json and failed_urls.json."""
        with open(self.config.report_file, "w", encoding="utf-8") as f:
            json.dump(report.model_dump(), f, ensure_ascii=False, indent=2)

        if report.failed_downloads:
            failed_list = [f.model_dump() for f in report.failed_downloads]
            with open(self.config.failed_urls_file, "w", encoding="utf-8") as f:
                json.dump(failed_list, f, ensure_ascii=False, indent=2)
        elif self.config.failed_urls_file.exists():
            # Clear previous failed urls if none in current report
            with open(self.config.failed_urls_file, "w", encoding="utf-8") as f:
                json.dump([], f, indent=2)
