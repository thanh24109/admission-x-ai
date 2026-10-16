from __future__ import annotations

import hashlib
import zipfile
from enum import Enum
from pathlib import Path

from pydantic import BaseModel

OLE2_MAGIC = b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1"
ZIP_MAGIC = b"PK\x03\x04"
PDF_MAGIC = b"%PDF-"
HTML_SIGNATURES = [
    b"<!doctype html",
    b"<!DOCTYPE html",
    b"<html",
    b"<HTML",
    b"<?xml",
]


class DocFormat(str, Enum):
    VALID_DOC = "valid_doc"
    ALREADY_DOCX = "already_docx"
    PDF = "pdf"
    HTML = "html"
    CORRUPTED = "corrupted"
    UNKNOWN = "unknown"


class DocInspectionResult(BaseModel):
    file_path: str
    file_name: str
    format: DocFormat
    file_size_bytes: int
    sha256: str
    magic_bytes_hex: str
    is_convertible: bool
    needs_redownload: bool
    details: str = ""


class DocFormatDetector:
    """Detects and classifies document formats based on magic bytes, file structure, and integrity checks."""

    @classmethod
    def is_legacy_doc(cls, content: bytes) -> bool:
        """Returns True if the content starts with the OLE2 compound document magic bytes."""
        return len(content) >= 8 and content.startswith(OLE2_MAGIC)

    @classmethod
    def is_valid_docx(cls, content: bytes) -> bool:
        """Returns True if the content starts with ZIP magic and contains OOXML document indicators."""
        if len(content) < 4 or not content.startswith(ZIP_MAGIC):
            return False
        import io
        try:
            with zipfile.ZipFile(io.BytesIO(content), "r") as zf:
                names = zf.namelist()
                return "[Content_Types].xml" in names or any("word/" in n for n in names)
        except (zipfile.BadZipFile, OSError):
            return False

    @staticmethod
    def inspect(file_path: Path | str) -> DocInspectionResult:
        path = Path(file_path)
        if not path.exists():
            return DocInspectionResult(
                file_path=str(path),
                file_name=path.name,
                format=DocFormat.CORRUPTED,
                file_size_bytes=0,
                sha256="",
                magic_bytes_hex="",
                is_convertible=False,
                needs_redownload=True,
                details="File does not exist on disk",
            )

        file_size = path.stat().st_size
        if file_size == 0:
            return DocInspectionResult(
                file_path=str(path),
                file_name=path.name,
                format=DocFormat.CORRUPTED,
                file_size_bytes=0,
                sha256=hashlib.sha256(b"").hexdigest(),
                magic_bytes_hex="",
                is_convertible=False,
                needs_redownload=True,
                details="Corrupted or incomplete download: 0 bytes payload",
            )

        with open(path, "rb") as f:
            header = f.read(2048)
            f.seek(0)
            full_content = f.read()

        file_hash = hashlib.sha256(full_content).hexdigest()
        magic_hex = header[:16].hex()

        # 1. OLE2 Compound Document (Legacy Word DOC)
        if header.startswith(OLE2_MAGIC):
            # Verify file has minimum reasonable length for an OLE2 file (at least 512 bytes)
            if file_size < 512:
                return DocInspectionResult(
                    file_path=str(path),
                    file_name=path.name,
                    format=DocFormat.CORRUPTED,
                    file_size_bytes=file_size,
                    sha256=file_hash,
                    magic_bytes_hex=magic_hex,
                    is_convertible=False,
                    needs_redownload=True,
                    details=f"Truncated OLE2 compound document ({file_size} bytes < 512 header requirement)",
                )

            return DocInspectionResult(
                file_path=str(path),
                file_name=path.name,
                format=DocFormat.VALID_DOC,
                file_size_bytes=file_size,
                sha256=file_hash,
                magic_bytes_hex=magic_hex,
                is_convertible=True,
                needs_redownload=False,
                details="Valid legacy Microsoft Word 97-2003 OLE2 Compound Document",
            )

        # 2. ZIP Archive (Modern DOCX / OOXML package)
        if header.startswith(ZIP_MAGIC):
            try:
                with zipfile.ZipFile(path, "r") as zf:
                    names = zf.namelist()
                    if "[Content_Types].xml" in names or any("word/" in n for n in names):
                        return DocInspectionResult(
                            file_path=str(path),
                            file_name=path.name,
                            format=DocFormat.ALREADY_DOCX,
                            file_size_bytes=file_size,
                            sha256=file_hash,
                            magic_bytes_hex=magic_hex,
                            is_convertible=False,
                            needs_redownload=False,
                            details="Already a valid OOXML DOCX package (Zip container with Word XML)",
                        )
            except zipfile.BadZipFile:
                return DocInspectionResult(
                    file_path=str(path),
                    file_name=path.name,
                    format=DocFormat.CORRUPTED,
                    file_size_bytes=file_size,
                    sha256=file_hash,
                    magic_bytes_hex=magic_hex,
                    is_convertible=False,
                    needs_redownload=True,
                    details="Corrupted Zip / OOXML file: BadZipFile",
                )

        # 3. PDF with wrong extension
        if header.startswith(PDF_MAGIC):
            return DocInspectionResult(
                file_path=str(path),
                file_name=path.name,
                format=DocFormat.PDF,
                file_size_bytes=file_size,
                sha256=file_hash,
                magic_bytes_hex=magic_hex,
                is_convertible=False,
                needs_redownload=False,
                details="PDF document saved with doc/docx extension",
            )

        # 4. HTML document with wrong extension
        header_lower = header.lower()
        if any(sig.lower() in header_lower for sig in HTML_SIGNATURES):
            return DocInspectionResult(
                file_path=str(path),
                file_name=path.name,
                format=DocFormat.HTML,
                file_size_bytes=file_size,
                sha256=file_hash,
                magic_bytes_hex=magic_hex,
                is_convertible=False,
                needs_redownload=False,
                details="HTML web page or error response saved with doc/docx extension",
            )

        # 5. Unsupported / unknown
        return DocInspectionResult(
            file_path=str(path),
            file_name=path.name,
            format=DocFormat.UNKNOWN,
            file_size_bytes=file_size,
            sha256=file_hash,
            magic_bytes_hex=magic_hex,
            is_convertible=False,
            needs_redownload=False,
            details=f"Unknown or unsupported binary file format (magic: {magic_hex})",
        )
