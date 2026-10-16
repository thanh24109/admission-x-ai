from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from scripts.crawler.config import CrawlerConfig, load_sources_registry
from scripts.crawler.pipeline import CrawlerPipeline


def setup_logging(verbose: bool = False) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )


def cmd_sources(args: argparse.Namespace) -> None:
    """Lists configured official EPU crawl sources from sources.yaml."""
    sources = load_sources_registry()
    print("=" * 80)
    print(f"OFFICIAL EPU CRAWL SOURCES REGISTRY ({len(sources)} sources configured)")
    print("=" * 80)
    for src in sources:
        print(f"ID:          {src.id}")
        print(f"Name:        {src.name}")
        print(f"Priority:    {src.priority.value}")
        print(f"Type:        {src.source_type}")
        print(f"Max Pages:   {src.max_pages}")
        print(f"URL:         {src.url}")
        print(f"Description: {src.description}")
        print("-" * 80)


def cmd_crawl(args: argparse.Namespace) -> None:
    """Executes crawl pipeline across specified source or priority."""
    config = CrawlerConfig(output_dir=Path(args.output_dir) if args.output_dir else None)
    pipeline = CrawlerPipeline(config=config)

    print("=" * 80)
    print("RUNNING EPU ADMISSIONS CRAWLER")
    print(f"Target Source:   {args.source or 'All'}")
    print(f"Target Priority: {args.priority or 'All'}")
    print(f"Limit:           {args.limit or 'Default'}")
    print(f"Dry Run:         {args.dry_run}")
    print(f"Output Dir:      {config.output_dir}")
    print("=" * 80)

    report = pipeline.run(
        source_id=args.source,
        priority=args.priority,
        limit=args.limit,
        dry_run=args.dry_run,
    )

    print("\n" + "=" * 80)
    print(f"CRAWL RUN SUMMARY: {report.run_id}")
    print("=" * 80)
    print(f"Timestamp:              {report.crawl_timestamp}")
    print(f"Discovered URLs:        {report.discovered_urls_count}")
    print(f"Accepted URLs:          {report.accepted_urls_count}")
    print(f"Rejected URLs:          {report.rejected_urls_count}")
    print(f"Successfully Downloaded: {report.successfully_downloaded_count}")
    print(f"Duplicate Files:        {report.duplicate_files_count}")
    print(f"Failed Downloads:       {report.failed_downloads_count}")
    print(f"Programs Extracted:     {report.program_count_extracted}")
    if report.warnings:
        print(f"Warnings ({len(report.warnings)}):")
        for w in report.warnings:
            print(f"  - {w}")
    if report.failed_downloads:
        print(f"Failures ({len(report.failed_downloads)}):")
        for f in report.failed_downloads[:10]:
            print(f"  - {f.url}: {f.error_message}")
    print("=" * 80)


def cmd_report(args: argparse.Namespace) -> None:
    """Displays the latest crawl report."""
    config = CrawlerConfig(output_dir=Path(args.output_dir) if args.output_dir else None)
    if not config.report_file.exists():
        print(f"No crawl report found at {config.report_file}. Run a crawl first.")
        return

    with open(config.report_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    print("=" * 80)
    print("LATEST EPU CRAWL REPORT")
    print(f"File: {config.report_file}")
    print("=" * 80)
    print(json.dumps(data, indent=2, ensure_ascii=False))


def cmd_retry_failed(args: argparse.Namespace) -> None:
    """Retries downloading failed URLs."""
    config = CrawlerConfig(output_dir=Path(args.output_dir) if args.output_dir else None)
    pipeline = CrawlerPipeline(config=config)

    print("=" * 80)
    print("RETRYING FAILED EPU CRAWL URLS")
    print(f"Failed URLs File: {config.failed_urls_file}")
    print(f"Dry Run:          {args.dry_run}")
    print("=" * 80)

    report = pipeline.retry_failed(dry_run=args.dry_run)
    print(f"Recovered / Downloaded: {report.successfully_downloaded_count}")
    print(f"Remaining Failures:     {report.failed_downloads_count}")


def cmd_convert_doc(args: argparse.Namespace) -> None:
    """Audits and converts legacy DOC files to modern DOCX using LibreOffice headless."""
    from scripts.crawler.doc_converter import DocConverter

    config = CrawlerConfig(output_dir=Path(args.output_dir) if args.output_dir else None)
    converter = DocConverter(config=config)

    print("=" * 80)
    print("EPU LEGACY DOC TO DOCX CONVERTER")
    print(f"LibreOffice Path: {converter._soffice_path or 'Not found (will use Word fallback)'}")
    print(f"Dry Run:          {args.dry_run}")
    print(f"Retry Failed:     {args.retry_failed}")
    print(f"Force Overwrite:  {args.force}")
    print(f"Source Dir:       {config.docx_dir}")
    print(f"Target Dir:       {config.converted_docx_dir}")
    print("=" * 80)

    res = converter.run(
        all_files=args.all,
        dry_run=args.dry_run,
        retry_failed=args.retry_failed,
        force=args.force,
    )

    print("\n" + "=" * 80)
    print("DOC CONVERSION SUMMARY")
    print("=" * 80)
    print(f"Total Files Scanned:       {res['total_scanned']}")
    print(f"Valid Legacy DOC Files:    {res['valid_doc_count']}")
    print(f"Already Valid DOCX Files:  {res['already_docx_count']}")
    print(f"Successfully Converted:    {res['converted_count']}")
    print(f"Skipped (Already Exists):  {res['skipped_count']}")
    print(f"Failed Conversions:        {res['failed_count']}")
    if res["files_requiring_redownload"]:
        print(f"Files Requiring Re-download ({len(res['files_requiring_redownload'])}):")
        for f in res["files_requiring_redownload"]:
            print(f"  - {f['file_name']}: {f['reason']}")
    print("-" * 80)
    for c in res["conversions"]:
        status_icon = "✓" if "success" in c["status"] or "already" in c["status"] else "!"
        print(f"[{status_icon}] {c['source_file']} -> {c['status']} ({c.get('target_file', 'N/A')})")
    print("=" * 80)
    if not args.dry_run:
        print(f"Conversion report saved to: {config.conversion_report_file}")


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="python -m scripts.crawler.cli",
        description="EPU Admissions Web Crawler — Local-First Data Collection Pipeline",
    )
    parser.add_argument("-v", "--verbose", action="store_true", help="Enable verbose debug logging")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # sources command
    subparsers.add_parser("sources", help="List configured EPU crawl sources")

    # crawl command
    crawl_parser = subparsers.add_parser("crawl", help="Run web crawler on sources")
    crawl_parser.add_argument("--source", type=str, help="Specific source ID (e.g. epu_programs)")
    crawl_parser.add_argument("--priority", type=str, choices=["P0", "P1"], help="Source priority level")
    crawl_parser.add_argument("--limit", type=int, help="Maximum number of pages/documents per source")
    crawl_parser.add_argument("--dry-run", action="store_true", help="Discover URLs without saving files")
    crawl_parser.add_argument("--output-dir", type=str, help="Custom output directory")

    # report command
    report_parser = subparsers.add_parser("report", help="Display latest crawl report")
    report_parser.add_argument("--output-dir", type=str, help="Custom output directory")

    # retry-failed command
    retry_parser = subparsers.add_parser("retry-failed", help="Retry downloading failed URLs")
    retry_parser.add_argument("--dry-run", action="store_true", help="Show URLs to retry without downloading")
    retry_parser.add_argument("--output-dir", type=str, help="Custom output directory")

    # convert-doc command
    convert_parser = subparsers.add_parser("convert-doc", help="Convert legacy .DOC files to .DOCX")
    convert_parser.add_argument("--all", action="store_true", default=True, help="Convert all detected legacy DOC files")
    convert_parser.add_argument("--dry-run", action="store_true", help="Inspect and preview conversion without executing")
    convert_parser.add_argument("--retry-failed", action="store_true", help="Retry failed conversions or re-download corrupted files")
    convert_parser.add_argument("--force", action="store_true", help="Force re-conversion even if output DOCX already exists")
    convert_parser.add_argument("--output-dir", type=str, help="Custom output directory")

    args = parser.parse_args()
    setup_logging(args.verbose)

    if args.command == "sources":
        cmd_sources(args)
    elif args.command == "crawl":
        cmd_crawl(args)
    elif args.command == "report":
        cmd_report(args)
    elif args.command == "retry-failed":
        cmd_retry_failed(args)
    elif args.command == "convert-doc":
        cmd_convert_doc(args)


if __name__ == "__main__":
    main()
