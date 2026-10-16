from __future__ import annotations

import json
from pathlib import Path

from scripts.crawler.config import CrawlerConfig
from scripts.crawler.models import (
    CrawlManifest,
    CrawlReport,
    DocumentMetadata,
    ProgramRecord,
)
from scripts.crawler.storage import LocalStorageManager, sanitize_filename


def test_sanitize_filename():
    assert sanitize_filename('Thong tin tuyen sinh 2026: ĐH Điện Lực!?.pdf') == "Thong_tin_tuyen_sinh_2026_ĐH_Điện_Lực.pdf"
    assert sanitize_filename("") == "document"


def test_storage_save_and_deduplication(tmp_path: Path):
    config = CrawlerConfig(output_dir=tmp_path)
    storage = LocalStorageManager(config)

    content = b"Official EPU Admission Document Content"
    import hashlib
    content_hash = hashlib.sha256(content).hexdigest()

    # First save
    rel_path_1, is_new_1 = storage.save_raw_file(
        url="https://epu.edu.vn/doc1.pdf",
        content=content,
        sha256_hash=content_hash,
        doc_type="pdf",
        custom_filename="doc1.pdf",
    )
    assert is_new_1 is True
    assert (tmp_path / rel_path_1).exists()

    # Second save with identical content and different URL (Content-level deduplication)
    rel_path_2, is_new_2 = storage.save_raw_file(
        url="https://tuyensinh.epu.edu.vn/mirror_doc1.pdf",
        content=content,
        sha256_hash=content_hash,
        doc_type="pdf",
        custom_filename="mirror_doc1.pdf",
    )
    assert is_new_2 is False
    assert rel_path_2 == rel_path_1  # Reuses existing file without duplicating on disk


def test_storage_jsonl_and_manifest(tmp_path: Path):
    config = CrawlerConfig(output_dir=tmp_path)
    storage = LocalStorageManager(config)

    # Save document metadata
    doc_meta = DocumentMetadata(
        document_id="doc_test_123",
        title="Đề án tuyển sinh 2026",
        source_url="https://tuyensinh.epu.edu.vn/de-an-2026.html",
        canonical_url="https://tuyensinh.epu.edu.vn/de-an-2026.html",
        source_id="epu_admissions",
        document_type="html",
        admission_year=2026,
        local_path="raw/html/test.html",
        sha256="abc123hash",
        file_size_bytes=1024,
    )
    storage.save_document_metadata(doc_meta)

    assert config.documents_file.exists()
    with open(config.documents_file, "r", encoding="utf-8") as f:
        line = f.readline().strip()
        data = json.loads(line)
        assert data["document_id"] == "doc_test_123"
        assert data["admission_year"] == 2026

    # Save program records
    prog = ProgramRecord(
        stt=1,
        major_code="7510301",
        major_name="Công nghệ kỹ thuật điện, điện tử",
        degree="Kỹ sư",
        duration="4,5 năm",
        specializations=["Hệ thống điện"],
        source_url="https://epu.edu.vn/page/dai-hoc",
    )
    storage.save_program_records([prog])

    assert config.programs_file.exists()
    with open(config.programs_file, "r", encoding="utf-8") as f:
        line = f.readline().strip()
        data = json.loads(line)
        assert data["major_code"] == "7510301"

    # Save manifest
    manifest = CrawlManifest(
        run_id="run_test",
        total_programs_extracted=1,
    )
    storage.save_manifest(manifest)
    assert config.manifest_file.exists()

    # Save report
    report = CrawlReport(
        run_id="run_test",
        program_count_extracted=1,
    )
    storage.save_report(report)
    assert config.report_file.exists()
