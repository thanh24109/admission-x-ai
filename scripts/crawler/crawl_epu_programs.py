from __future__ import annotations

import argparse
import json
import logging
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Ensure project root is in sys.path
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from scripts.crawler.config import CrawlerConfig
from scripts.crawler.downloader import HttpDownloader
from scripts.crawler.models import (
    CrawlManifest,
    DocumentMetadata,
    ProgramRecord,
)
from scripts.crawler.parsers.epu_programs import (
    EXPECTED_PROGRAM_COUNT,
    EpuProgramsParser,
)
from scripts.crawler.storage import LocalStorageManager

logger = logging.getLogger("epu_crawler.programs_only")

PROGRAMS_URL = "https://epu.edu.vn/page/dai-hoc"


def setup_logging(verbose: bool = False) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )


def crawl_epu_programs(
    output_dir: Path | None = None,
    download_pdf: bool = True,
) -> tuple[list[ProgramRecord], dict[str, Any]]:
    """Crawls 38 undergraduate programs from https://epu.edu.vn/page/dai-hoc and downloads/renames all curriculum PDFs."""
    config = CrawlerConfig(output_dir=output_dir)
    config.ensure_directories()

    downloader = HttpDownloader(timeout=45.0, rate_limit_delay=0.3)
    storage = LocalStorageManager(config=config)
    parser = EpuProgramsParser(downloader=downloader, storage=storage)

    print("=" * 80)
    print("EPU UNDERGRADUATE PROGRAMS CRAWLER (38 MAJORS)")
    print(f"Target URL:     {PROGRAMS_URL}")
    print(f"Output Dir:     {config.output_dir}")
    print(f"Download PDFs:  {download_pdf}")
    print("=" * 80)

    # 1. Fetch main page
    print("\n[1/3] Đang tải trang chủ đào tạo đại học...")
    res = downloader.fetch(PROGRAMS_URL)
    if not res.success or not res.content:
        raise RuntimeError(f"Không thể tải trang {PROGRAMS_URL}: {res.error_message}")

    # Save HTML snapshot
    rel_html_path, _ = storage.save_raw_file(
        url=PROGRAMS_URL,
        content=res.content,
        sha256_hash=res.sha256,
        doc_type="html",
        custom_filename="epu_dai_hoc.html",
        preserve_exact_name=True,
    )
    print(f"  ✓ Đã lưu HTML snapshot: {rel_html_path} ({len(res.content):,} bytes)")

    # Save HTML document metadata
    html_meta = DocumentMetadata(
        document_id=f"doc_{res.sha256[:12]}",
        title="Đào tạo đại học chính quy - Trường Đại học Điện lực",
        source_url=PROGRAMS_URL,
        canonical_url=PROGRAMS_URL,
        source_id="epu_programs",
        document_type="html",
        local_path=rel_html_path,
        sha256=res.sha256,
        file_size_bytes=len(res.content),
    )
    storage.save_document_metadata(html_meta)

    # 2. Parse programs and download/rename PDFs
    print("\n[2/3] Đang bóc tách 38 ngành học và tải bản mô tả CTĐT (PDF)...")
    programs, warnings = parser.parse(
        html_content=res.text_content,
        source_url=PROGRAMS_URL,
        download_attachments=download_pdf,
    )

    if warnings:
        for w in warnings:
            print(f"  [CẢNH BÁO] {w}")

    print(f"  ✓ Đã trích xuất thành công {len(programs)}/{EXPECTED_PROGRAM_COUNT} ngành học.")

    # 3. Process and display downloaded PDFs
    successful_pdfs = 0
    total_pdf_bytes = 0
    programs_export_data: list[dict[str, Any]] = []

    for prog in programs:
        att_info = prog.attachments[0] if prog.attachments else None
        att_file_name = att_info.file_name if att_info else "N/A"
        att_path = att_info.local_path if att_info else ""
        att_size = att_info.file_size_bytes if att_info else 0

        if att_info and att_info.status in ("downloaded", "duplicate") and att_info.local_path:
            successful_pdfs += 1
            total_pdf_bytes += att_size

            # Register document metadata for RAG
            doc_meta = DocumentMetadata(
                document_id=f"doc_{att_info.sha256[:12]}",
                title=f"CTĐT {prog.major_name} ({prog.major_code})",
                source_url=att_info.source_url,
                canonical_url=att_info.source_url,
                parent_url=PROGRAMS_URL,
                source_id="epu_programs",
                document_type="pdf",
                major_code=prog.major_code,
                local_path=att_info.local_path,
                sha256=att_info.sha256,
                file_size_bytes=att_info.file_size_bytes,
            )
            storage.save_document_metadata(doc_meta)

        status_icon = "✓" if att_info and att_info.local_path else "✗"
        mb_str = f"{att_size / (1024*1024):.2f} MB" if att_size else "0 MB"
        print(f"  {status_icon} [{prog.stt:02d}/38] Mã: {prog.major_code} | {prog.major_name}")
        print(f"       -> File PDF: {att_file_name} ({mb_str})")

        # Prepare export dict
        prog_dict = prog.model_dump()
        prog_dict["pdf_file_name"] = att_file_name
        prog_dict["pdf_local_path"] = att_path
        prog_dict["pdf_size_bytes"] = att_size
        prog_dict["pdf_source_url"] = att_info.source_url if att_info else ""
        programs_export_data.append(prog_dict)

    # 4. Save metadata files
    print("\n[3/3] Đang ghi nhận siêu dữ liệu có cấu trúc...")

    # Save programs.jsonl
    storage.save_program_records(programs, overwrite=True)
    print(f"  ✓ Đã lưu {config.programs_file}")

    # Save programs.json (formatted)
    programs_json_path = config.metadata_dir / "programs.json"
    with open(programs_json_path, "w", encoding="utf-8") as f:
        json.dump(programs_export_data, f, ensure_ascii=False, indent=2)
    print(f"  ✓ Đã lưu {programs_json_path}")

    # Save manifest
    manifest = CrawlManifest(
        run_id=f"run_programs_{datetime.now(UTC).strftime('%Y%m%d_%H%M%S')}",
        crawl_timestamp=datetime.now(UTC).isoformat(),
        sources_crawled=["epu_programs"],
        total_urls_discovered=len(programs) + 1,
        total_files_downloaded=successful_pdfs + 1,
        total_programs_extracted=len(programs),
        url_to_hash=storage.url_to_hash,
        hash_to_path=storage.hash_to_path,
    )
    storage.save_manifest(manifest)
    print(f"  ✓ Đã lưu {config.manifest_file}")

    # Save Markdown summary report
    summary_md_path = config.reports_dir / "programs_summary.md"
    _generate_markdown_summary(programs_export_data, summary_md_path, total_pdf_bytes)
    print(f"  ✓ Đã lưu báo cáo tổng hợp: {summary_md_path}")

    stats = {
        "total_programs": len(programs),
        "successful_pdfs": successful_pdfs,
        "total_pdf_mb": round(total_pdf_bytes / (1024 * 1024), 2),
        "html_saved": rel_html_path,
        "programs_file": str(config.programs_file),
        "programs_json": str(programs_json_path),
        "summary_md": str(summary_md_path),
    }

    print("\n" + "=" * 80)
    print("HOÀN TẤT THU THẬP 38 NGÀNH ĐÀO TẠO ĐẠI HỌC EPU")
    print("=" * 80)
    print(f"Tổng số ngành đào tạo:       {stats['total_programs']}/38")
    print(f"Tổng số file PDF đã đổi tên: {stats['successful_pdfs']}/38")
    print(f"Tổng dung lượng PDF tải về:  {stats['total_pdf_mb']} MB")
    print(f"Thư mục tệp PDF:             {config.pdf_dir}")
    print(f"Bản tổng hợp dữ liệu:        {summary_md_path}")
    print("=" * 80)

    return programs, stats


def _generate_markdown_summary(
    programs: list[dict[str, Any]],
    output_file: Path,
    total_bytes: int,
) -> None:
    """Generates a human-readable Markdown summary table of all 38 majors and their renamed PDF files."""
    lines: list[str] = [
        "# Danh Mục 38 Ngành Đào Tạo Đại Học & Chương Trình Đào Tạo EPU",
        "",
        "- **Nguồn thu thập:** [https://epu.edu.vn/page/dai-hoc](https://epu.edu.vn/page/dai-hoc)",
        f"- **Thời gian crawl:** {datetime.now(UTC).strftime('%Y-%m-%d %H:%M:%S UTC')}",
        f"- **Tổng số ngành:** {len(programs)} ngành học",
        f"- **Tổng dung lượng tài liệu PDF:** {total_bytes / (1024 * 1024):.2f} MB",
        "",
        "| STT | Mã ngành | Tên ngành đào tạo | Bằng tốt nghiệp | Thời gian | Tệp PDF đã chuẩn hóa | Dung lượng |",
        "| :---: | :---: | :--- | :---: | :---: | :--- | :---: |",
    ]

    for p in programs:
        stt = p.get("stt", 0)
        ma = p.get("major_code", "")
        ten = p.get("major_name", "")
        bang = p.get("degree", "Kỹ sư")
        tg = p.get("duration", "4,5 năm")
        pdf_name = p.get("pdf_file_name", "")
        pdf_size = p.get("pdf_size_bytes", 0)
        size_str = f"{pdf_size / (1024*1024):.2f} MB" if pdf_size else "0 MB"
        lines.append(f"| {stt:02d} | `{ma}` | **{ten}** | {bang} | {tg} | `{pdf_name}` | {size_str} |")

    lines.extend([
        "",
        "## Danh sách chuyên ngành chi tiết theo từng ngành học",
        "",
    ])

    for p in programs:
        stt = p.get("stt", 0)
        ma = p.get("major_code", "")
        ten = p.get("major_name", "")
        specs = p.get("specializations", [])
        pdf_name = p.get("pdf_file_name", "")

        lines.append(f"### {stt:02d}. {ten} (Mã: `{ma}`)")
        lines.append(f"- **Văn bằng & Thời gian:** {p.get('degree', '')} ({p.get('duration', '')})")
        lines.append(f"- **Tệp đính kèm CTĐT:** [{pdf_name}](../raw/pdf/{pdf_name})")
        lines.append(f"- **URL gốc:** {p.get('pdf_source_url', '')}")
        if specs:
            lines.append("- **Các chuyên ngành:**")
            for s in specs:
                lines.append(f"  - {s}")
        else:
            lines.append("- **Các chuyên ngành:** Đào tạo chung theo chuẩn ngành")
        lines.append("")

    with open(output_file, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Crawler chuyên biệt thu thập 38 ngành học và đổi tên file PDF CTĐT EPU"
    )
    parser.add_argument("--output-dir", "-o", type=str, help="Thư mục xuất dữ liệu (mặc định data/crawled)")
    parser.add_argument(
        "--no-download-pdf",
        action="store_true",
        help="Chỉ trích xuất metadata ngành học mà không tải file PDF đính kèm",
    )
    parser.add_argument("--verbose", "-v", action="store_true", help="Bật log chi tiết")

    args = parser.parse_args()
    setup_logging(args.verbose)

    out_path = Path(args.output_dir) if args.output_dir else None
    crawl_epu_programs(output_dir=out_path, download_pdf=not args.no_download_pdf)


if __name__ == "__main__":
    main()
