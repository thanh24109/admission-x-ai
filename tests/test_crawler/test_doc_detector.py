from __future__ import annotations

import io
import zipfile
from pathlib import Path

from scripts.crawler.doc_detector import OLE2_MAGIC, DocFormat, DocFormatDetector


def test_detect_corrupted_empty_file(tmp_path: Path):
    empty_file = tmp_path / "empty.doc"
    empty_file.write_bytes(b"")

    res = DocFormatDetector.inspect(empty_file)
    assert res.format == DocFormat.CORRUPTED
    assert res.needs_redownload is True
    assert res.file_size_bytes == 0


def test_detect_truncated_doc(tmp_path: Path):
    truncated = tmp_path / "truncated.doc"
    truncated.write_bytes(OLE2_MAGIC + b"short")

    res = DocFormatDetector.inspect(truncated)
    assert res.format == DocFormat.CORRUPTED
    assert res.needs_redownload is True


def test_detect_valid_legacy_doc(tmp_path: Path):
    valid_doc = tmp_path / "valid.doc"
    # OLE2 header + padding to > 512 bytes
    valid_doc.write_bytes(OLE2_MAGIC + b"\x00" * 1024)

    res = DocFormatDetector.inspect(valid_doc)
    assert res.format == DocFormat.VALID_DOC
    assert res.is_convertible is True
    assert res.needs_redownload is False


def test_detect_already_docx_with_doc_extension(tmp_path: Path):
    fake_docx = tmp_path / "actually_docx.doc"

    # Create synthetic zip containing [Content_Types].xml
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("[Content_Types].xml", "<Types></Types>")
        zf.writestr("word/document.xml", "<w:document></w:document>")

    fake_docx.write_bytes(buf.getvalue())

    res = DocFormatDetector.inspect(fake_docx)
    assert res.format == DocFormat.ALREADY_DOCX
    assert res.is_convertible is False
    assert res.needs_redownload is False


def test_detect_pdf_disguised_as_doc(tmp_path: Path):
    fake_doc = tmp_path / "report.doc"
    fake_doc.write_bytes(b"%PDF-1.5 %binary payload")

    res = DocFormatDetector.inspect(fake_doc)
    assert res.format == DocFormat.PDF
    assert res.is_convertible is False


def test_detect_html_error_page_disguised_as_doc(tmp_path: Path):
    fake_doc = tmp_path / "error.doc"
    fake_doc.write_bytes(b"<!DOCTYPE html><html><body>Error 404</body></html>")

    res = DocFormatDetector.inspect(fake_doc)
    assert res.format == DocFormat.HTML
    assert res.is_convertible is False
