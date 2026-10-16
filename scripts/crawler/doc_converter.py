from __future__ import annotations

import hashlib
import json
import logging
import os
import shutil
import subprocess
import zipfile
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import docx

from scripts.crawler.config import CrawlerConfig
from scripts.crawler.doc_detector import (
    DocFormat,
    DocFormatDetector,
    DocInspectionResult,
)
from scripts.crawler.downloader import HttpDownloader

logger = logging.getLogger("epu_crawler.doc_converter")

LIBREOFFICE_DEFAULT_PATHS = [
    Path(r"C:\Program Files\LibreOffice\program\soffice.exe"),
    Path(r"C:\Program Files (x86)\LibreOffice\program\soffice.exe"),
    Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "LibreOffice" / "program" / "soffice.exe",
]


class DocConverter:
    """Orchestrates format detection, headless LibreOffice conversion to DOCX, validation, and metadata preservation."""

    def __init__(
        self,
        config: CrawlerConfig | None = None,
        downloader: HttpDownloader | None = None,
    ) -> None:
        self.config = config or CrawlerConfig()
        self.config.ensure_directories()
        self.downloader = downloader or HttpDownloader()
        self.detector = DocFormatDetector()
        self._soffice_path: Path | None = self.find_libreoffice_executable()

    @classmethod
    def find_libreoffice_executable(cls) -> Path | None:
        """Locates LibreOffice soffice.exe across environment variables, PATH, and standard Windows paths."""
        # 1. Environment variable override
        env_path = os.environ.get("LIBREOFFICE_PATH") or os.environ.get("SOFFICE_PATH")
        if env_path and Path(env_path).exists():
            return Path(env_path)

        # 2. PATH resolution
        which_soffice = shutil.which("soffice") or shutil.which("libreoffice")
        if which_soffice:
            return Path(which_soffice)

        # 3. Standard Windows locations
        for p in LIBREOFFICE_DEFAULT_PATHS:
            if p.exists():
                return p

        return None

    def run(
        self,
        all_files: bool = True,
        dry_run: bool = False,
        retry_failed: bool = False,
        force: bool = False,
    ) -> dict[str, Any]:
        """Runs audit and conversion on all downloaded .doc and related files."""
        soffice = self.find_libreoffice_executable()
        self._soffice_path = soffice

        # Find all files in raw/docx directory
        scanned_files = sorted(self.config.docx_dir.glob("*"), key=lambda p: p.name)

        report_data: dict[str, Any] = {
            "report_timestamp": datetime.now(UTC).isoformat(),
            "libreoffice_found": bool(soffice),
            "libreoffice_path": str(soffice) if soffice else None,
            "total_scanned": len(scanned_files),
            "valid_doc_count": 0,
            "already_docx_count": 0,
            "converted_count": 0,
            "skipped_count": 0,
            "failed_count": 0,
            "files_requiring_redownload": [],
            "conversions": [],
        }

        conversions_map: dict[str, dict[str, Any]] = {}

        for file_path in scanned_files:
            inspection: DocInspectionResult = self.detector.inspect(file_path)

            record_entry: dict[str, Any] = {
                "source_file": file_path.name,
                "relative_path": f"raw/docx/{file_path.name}",
                "detected_format": inspection.format.value,
                "file_size_bytes": inspection.file_size_bytes,
                "sha256": inspection.sha256,
                "status": "pending",
                "details": inspection.details,
            }

            if inspection.format == DocFormat.ALREADY_DOCX:
                report_data["already_docx_count"] += 1
                record_entry["status"] = "already_docx"
                report_data["conversions"].append(record_entry)
                continue

            if inspection.format == DocFormat.CORRUPTED or inspection.needs_redownload:
                report_data["files_requiring_redownload"].append({
                    "file_name": file_path.name,
                    "reason": inspection.details,
                })
                record_entry["status"] = "corrupted"
                report_data["conversions"].append(record_entry)

                if retry_failed and not dry_run:
                    logger.info("Attempting to re-download corrupted file: %s", file_path.name)
                    recovered = self._redownload_file(file_path)
                    if recovered:
                        record_entry["status"] = "recovered_redownloaded"
                continue

            if inspection.format == DocFormat.VALID_DOC:
                report_data["valid_doc_count"] += 1
                target_stem = file_path.stem
                target_docx_name = f"{target_stem}.docx"
                target_docx_path = self.config.converted_docx_dir / target_docx_name
                rel_converted_path = f"converted/docx/{target_docx_name}"

                record_entry["target_file"] = target_docx_name
                record_entry["target_relative_path"] = rel_converted_path

                # Check idempotency
                if target_docx_path.exists() and not force:
                    is_valid, _validation_msg = self.verify_docx(target_docx_path)
                    if is_valid:
                        logger.info("Converted file already exists and is valid: %s", target_docx_name)
                        report_data["skipped_count"] += 1
                        record_entry["status"] = "skipped_already_converted"
                        record_entry["converted_sha256"] = inspection.sha256
                        conversions_map[file_path.name] = {
                            "original_rel_path": record_entry["relative_path"],
                            "converted_rel_path": rel_converted_path,
                            "original_sha256": inspection.sha256,
                            "converted_sha256": self._compute_sha256(target_docx_path),
                        }
                        report_data["conversions"].append(record_entry)
                        continue

                if dry_run:
                    logger.info("[Dry Run] Would convert %s -> %s", file_path.name, target_docx_name)
                    record_entry["status"] = "dry_run"
                    report_data["conversions"].append(record_entry)
                    continue

                # Execute conversion
                success, engine_used, err_msg = self._convert_single(file_path, target_docx_path)
                if success:
                    # Verify output package
                    is_valid, val_err = self.verify_docx(target_docx_path)
                    if is_valid:
                        conv_sha256 = self._compute_sha256(target_docx_path)
                        report_data["converted_count"] += 1
                        record_entry["status"] = "converted_success"
                        record_entry["engine"] = engine_used
                        record_entry["converted_sha256"] = conv_sha256
                        conversions_map[file_path.name] = {
                            "original_rel_path": record_entry["relative_path"],
                            "converted_rel_path": rel_converted_path,
                            "original_sha256": inspection.sha256,
                            "converted_sha256": conv_sha256,
                            "engine": engine_used,
                        }
                    else:
                        report_data["failed_count"] += 1
                        record_entry["status"] = "verification_failed"
                        record_entry["error"] = f"DOCX verification failed: {val_err}"
                else:
                    report_data["failed_count"] += 1
                    record_entry["status"] = "conversion_failed"
                    record_entry["error"] = err_msg

                report_data["conversions"].append(record_entry)
            else:
                record_entry["status"] = "unsupported_format"
                report_data["conversions"].append(record_entry)

        # Write conversion report and update metadata
        if not dry_run:
            self._save_conversion_report(report_data)
            self._update_metadata(conversions_map)

        return report_data

    def _convert_single(self, input_doc: Path, target_docx: Path) -> tuple[bool, str, str]:
        """Converts a single legacy DOC file using LibreOffice (primary) or Word COM (fallback)."""
        soffice = self.find_libreoffice_executable()

        # Primary: LibreOffice headless conversion
        if soffice and soffice.exists():
            try:
                cmd = [
                    str(soffice),
                    "--headless",
                    "--convert-to",
                    "docx",
                    "--outdir",
                    str(self.config.converted_docx_dir),
                    str(input_doc),
                ]
                logger.info("Executing LibreOffice conversion: %s", " ".join(cmd))
                res = subprocess.run(
                    cmd,
                    capture_output=True,
                    encoding="utf-8",
                    errors="replace",
                    timeout=90,
                    check=False,
                )
                if res.returncode == 0 and target_docx.exists():
                    return True, "libreoffice", ""
                logger.warning("LibreOffice returned code %d: %s", res.returncode, res.stderr)
            except Exception as e:  # noqa: BLE001
                logger.warning("LibreOffice conversion failed with exception: %s", e)

        # Fallback: Microsoft Word COM automation via PowerShell
        word_success, word_err = self._convert_via_word_com(input_doc, target_docx)
        if word_success:
            return True, "microsoft_word", ""

        return False, "none", f"Conversion failed. LibreOffice soffice: {soffice}, Word error: {word_err}"

    def _convert_via_word_com(self, input_doc: Path, target_docx: Path) -> tuple[bool, str]:
        """Fallback converter using native Microsoft Word COM automation via PowerShell."""
        in_p = str(input_doc.resolve()).replace("'", "''")
        out_p = str(target_docx.resolve()).replace("'", "''")

        ps_script = f"""
        $word = New-Object -ComObject Word.Application
        $word.Visible = $false
        $word.DisplayAlerts = 'wdAlertsNone'
        try {{
            $doc = $word.Documents.Open('{in_p}', $false, $true)
            $doc.SaveAs2('{out_p}', 16)
            $doc.Close()
            Write-Output "SUCCESS"
        }} catch {{
            Write-Error $_.Exception.Message
            exit 1
        }} finally {{
            $word.Quit()
            [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
            [System.GC]::Collect()
            [System.GC]::WaitForPendingFinalizers()
        }}
        """
        try:
            res = subprocess.run(
                ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps_script],
                capture_output=True,
                encoding="utf-8",
                errors="replace",
                timeout=90,
                check=False,
            )
            if res.returncode == 0 and target_docx.exists():
                return True, ""
            return False, res.stderr or res.stdout
        except Exception as e:  # noqa: BLE001
            return False, str(e)

    @staticmethod
    def verify_docx(file_path: Path) -> tuple[bool, str]:
        """Verifies that a converted DOCX file is a valid OOXML package and can be parsed by python-docx."""
        if not file_path.exists() or file_path.stat().st_size == 0:
            return False, "File does not exist or is 0 bytes"

        # 1. Zip package integrity
        try:
            with zipfile.ZipFile(file_path, "r") as zf:
                namelist = zf.namelist()
                if "[Content_Types].xml" not in namelist:
                    return False, "Missing [Content_Types].xml in DOCX zip package"
                if not any("word/" in n for n in namelist):
                    return False, "Missing word/ directory in DOCX zip package"
        except zipfile.BadZipFile as e:
            return False, f"Invalid zip package: {e}"

        # 2. python-docx document parser validation
        try:
            doc = docx.Document(file_path)
            # Access paragraphs and tables to verify internal schema
            _ = len(doc.paragraphs)
            _ = len(doc.tables)
            return True, ""
        except Exception as e:  # noqa: BLE001
            return False, f"python-docx parsing error: {e}"

    def _redownload_file(self, file_path: Path) -> bool:
        """Looks up source_url for a file from documents.jsonl and re-downloads it."""
        source_url = None
        if self.config.documents_file.exists():
            with open(self.config.documents_file, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        data = json.loads(line)
                        if file_path.name in data.get("local_path", ""):
                            source_url = data.get("source_url")
                            break

        if not source_url:
            logger.warning("Could not find source_url for %s in documents.jsonl", file_path.name)
            return False

        res = self.downloader.fetch(source_url)
        if res.success and res.content:
            with open(file_path, "wb") as f:
                f.write(res.content)
            logger.info("Successfully re-downloaded %s (%d bytes)", file_path.name, len(res.content))
            return True
        return False

    def _update_metadata(self, conversions_map: dict[str, dict[str, Any]]) -> None:
        """Updates documents.jsonl and crawl_manifest.json with converted file paths and hashes."""
        if not conversions_map or not self.config.documents_file.exists():
            return

        lines: list[str] = []
        with open(self.config.documents_file, "r", encoding="utf-8") as f:
            for line in f:
                line_str = line.strip()
                if not line_str:
                    continue
                doc = json.loads(line_str)
                local_path = doc.get("local_path", "")
                file_name = Path(local_path).name

                if file_name in conversions_map:
                    conv_info = conversions_map[file_name]
                    # Update metadata while preserving all original references
                    doc["document_type"] = "docx"
                    doc["converted_path"] = conv_info["converted_rel_path"]
                    doc["converted_sha256"] = conv_info["converted_sha256"]
                    extra = doc.get("metadata_extra", {})
                    extra["original_doc_path"] = conv_info["original_rel_path"]
                    extra["original_doc_sha256"] = conv_info["original_sha256"]
                    extra["conversion_engine"] = conv_info.get("engine", "converted")
                    extra["converted_at"] = datetime.now(UTC).isoformat()
                    doc["metadata_extra"] = extra

                lines.append(json.dumps(doc, ensure_ascii=False))

        # Write updated documents.jsonl
        with open(self.config.documents_file, "w", encoding="utf-8") as f:
            f.writelines(l + "\n" for l in lines)
        logger.info("Updated documents.jsonl with converted DOCX references.")

    def _save_conversion_report(self, report_data: dict[str, Any]) -> None:
        """Writes doc_conversion_report.json."""
        with open(self.config.conversion_report_file, "w", encoding="utf-8") as f:
            json.dump(report_data, f, ensure_ascii=False, indent=2)
        logger.info("Saved conversion report to %s", self.config.conversion_report_file)

    @staticmethod
    def _compute_sha256(path: Path) -> str:
        h = hashlib.sha256()
        with open(path, "rb") as f:
            while chunk := f.read(65536):
                h.update(chunk)
        return h.hexdigest()
