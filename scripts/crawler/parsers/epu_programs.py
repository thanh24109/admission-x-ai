from __future__ import annotations

import logging
import re
from typing import Any
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from scripts.crawler.downloader import HttpDownloader
from scripts.crawler.models import AttachmentInfo, ProgramRecord
from scripts.crawler.storage import LocalStorageManager

logger = logging.getLogger("epu_crawler.parsers.epu_programs")

EXPECTED_PROGRAM_COUNT = 38


class EpuProgramsParser:
    """Dedicated parser for https://epu.edu.vn/page/dai-hoc extracting the official 38 undergraduate programs."""

    def __init__(
        self,
        downloader: HttpDownloader | None = None,
        storage: LocalStorageManager | None = None,
    ) -> None:
        self.downloader = downloader
        self.storage = storage

    def parse(
        self,
        html_content: str,
        source_url: str = "https://epu.edu.vn/page/dai-hoc",
        download_attachments: bool = True,
    ) -> tuple[list[ProgramRecord], list[str]]:
        """Parses the undergraduate program page and extracts all programs and attachments.

        Returns:
            tuple[list[ProgramRecord], list[str]]: (List of extracted ProgramRecords, List of warnings/errors)
        """
        warnings: list[str] = []
        raw_items: list[dict[str, Any]] = []

        # Strategy 1: Attempt to locate and parse SvelteKit node 10 JS bundle (highest fidelity with full data)
        js_url = self._find_sveltekit_node_js(html_content, source_url)
        if js_url and self.downloader:
            logger.info("Found SvelteKit bundle for program data: %s", js_url)
            js_res = self.downloader.fetch(js_url)
            if js_res.success and js_res.text_content:
                raw_items = self._extract_from_js_bundle(js_res.text_content)
                logger.info("Extracted %d programs from SvelteKit JS bundle", len(raw_items))

        # Strategy 2: If Strategy 1 yielded no items or fewer than expected, parse the SSR HTML DOM
        if len(raw_items) < EXPECTED_PROGRAM_COUNT:
            html_items = self._extract_from_html_dom(html_content, source_url)
            logger.info("Extracted %d programs from SSR HTML DOM", len(html_items))
            if len(html_items) > len(raw_items):
                raw_items = html_items

        # Validate count
        actual_count = len(raw_items)
        if actual_count != EXPECTED_PROGRAM_COUNT:
            warn_msg = (
                f"Program count discrepancy: Extracted {actual_count} programs, "
                f"expected {EXPECTED_PROGRAM_COUNT} from {source_url}."
            )
            warnings.append(warn_msg)
            logger.warning(warn_msg)
        else:
            logger.info("Validation successful: Extracted all %d programs.", EXPECTED_PROGRAM_COUNT)

        # Build ProgramRecord models & download attachments
        program_records: list[ProgramRecord] = []
        for idx, item in enumerate(raw_items, start=1):
            stt = item.get("stt") or idx
            major_code = str(item.get("ma_nganh") or item.get("major_code") or "").strip()
            major_name = str(item.get("ten_nganh") or item.get("major_name") or "").strip()
            degree = item.get("bang_tot_nghiep") or item.get("degree")
            duration = item.get("thoi_gian") or item.get("duration")
            specializations = item.get("chuyen_nganh") or item.get("specializations") or []
            if isinstance(specializations, str):
                specializations = [s.strip() for s in specializations.split(",") if s.strip()]

            # Handle attachment
            attachment_url = item.get("file") or item.get("attachment_url")
            attachments: list[AttachmentInfo] = []

            if attachment_url:
                att_url_full = urljoin(source_url, attachment_url)
                att_info = self._process_attachment(
                    att_url_full,
                    stt=stt,
                    major_code=major_code,
                    major_name=major_name,
                    download=download_attachments,
                )
                if att_info:
                    attachments.append(att_info)

            record = ProgramRecord(
                stt=stt,
                major_code=major_code,
                major_name=major_name,
                degree=degree,
                duration=duration,
                specializations=specializations,
                source_url=source_url,
                attachments=attachments,
            )
            program_records.append(record)

        return program_records, warnings

    def _find_sveltekit_node_js(self, html_content: str, base_url: str) -> str | None:
        """Finds the script URL pointing to SvelteKit node 10 containing dai_hoc program data.

        If node 10 is not directly in the HTML, looks up entry/app.*.js to resolve node 10.
        """
        soup = BeautifulSoup(html_content, "html.parser")
        # Direct check in link or script
        for tag in soup.find_all(["link", "script"]):
            src = tag.get("href") or tag.get("src") or ""
            if "nodes/10." in src:
                return urljoin(base_url, src)

        # Direct regex in raw HTML (matches /_app/..., ../_app/..., etc.)
        match = re.search(r'["\']([^"\'\s]*?_app/immutable/nodes/10\.[a-zA-Z0-9_\-]+\.js)["\']', html_content)
        if match:
            return urljoin(base_url, match.group(1))

        # Two-step resolution via SvelteKit entry/app.*.js
        app_match = re.search(r'["\']([^"\'\s]*?_app/immutable/entry/app\.[a-zA-Z0-9_\-]+\.js)["\']', html_content)
        if app_match and self.downloader:
            app_url = urljoin(base_url, app_match.group(1))
            logger.info("Resolving SvelteKit manifest from entry app: %s", app_url)
            app_res = self.downloader.fetch(app_url)
            if app_res.success and app_res.text_content:
                node_match = re.search(r'nodes/10\.[a-zA-Z0-9_\-]+\.js', app_res.text_content)
                if node_match:
                    resolved_node_url = urljoin(base_url, f"/_app/immutable/{node_match.group(0)}")
                    logger.info("Resolved SvelteKit node 10 URL: %s", resolved_node_url)
                    return resolved_node_url

        return None

    def _extract_from_js_bundle(self, js_text: str) -> list[dict[str, Any]]:
        """Extracts structured program items from SvelteKit bundled JavaScript."""
        items: list[dict[str, Any]] = []

        # Find the dai_hoc array
        start = js_text.find("dai_hoc:[")
        if start != -1:
            idx = start + len("dai_hoc:[")
            depth = 1
            while idx < len(js_text) and depth > 0:
                if js_text[idx] == "[":
                    depth += 1
                elif js_text[idx] == "]":
                    depth -= 1
                idx += 1
            array_str = js_text[start + len("dai_hoc:"):idx]
        else:
            array_str = js_text

        # Match each program object {stt:...}
        obj_pattern = re.compile(
            r'\{[^{}]*?stt\s*:\s*(\d+)[^{}]*?ten_nganh\s*:\s*"([^"]+)"[^{}]*?ma_nganh\s*:\s*"([^"]+)"[^{}]*?\}',
            re.DOTALL,
        )

        matches = list(obj_pattern.finditer(array_str))
        if not matches:
            # Fallback regex with flexible ordering
            obj_pattern_alt = re.compile(
                r'\{[^{}]*?ma_nganh\s*:\s*"([^"]+)"[^{}]*?ten_nganh\s*:\s*"([^"]+)"[^{}]*?\}',
                re.DOTALL,
            )
            matches = list(obj_pattern_alt.finditer(array_str))

        for m in matches:
            chunk = m.group(0)
            items.append(self._parse_single_js_chunk(chunk))

        return items

    def _parse_single_js_chunk(self, chunk: str) -> dict[str, Any]:
        """Parses a single JS object literal from chunk string."""
        data: dict[str, Any] = {}

        stt_m = re.search(r'stt\s*:\s*(\d+)', chunk)
        if stt_m:
            data["stt"] = int(stt_m.group(1))

        ten_m = re.search(r'ten_nganh\s*:\s*"([^"]+)"', chunk)
        if ten_m:
            data["ten_nganh"] = ten_m.group(1)

        ma_m = re.search(r'ma_nganh\s*:\s*"([^"]+)"', chunk)
        if ma_m:
            data["ma_nganh"] = ma_m.group(1)

        bang_m = re.search(r'bang_tot_nghiep\s*:\s*"([^"]+)"', chunk)
        if bang_m:
            data["bang_tot_nghiep"] = bang_m.group(1)

        thoi_gian_m = re.search(r'thoi_gian\s*:\s*"([^"]+)"', chunk)
        if thoi_gian_m:
            data["thoi_gian"] = thoi_gian_m.group(1)

        file_m = re.search(r'file\s*:\s*"([^"]+)"', chunk)
        if file_m:
            data["file"] = file_m.group(1)

        # chuyen_nganh: ["A", "B"]
        cn_m = re.search(r'chuyen_nganh\s*:\s*\[(.*?)\]', chunk)
        if cn_m:
            specs = re.findall(r'"([^"]+)"', cn_m.group(1))
            data["chuyen_nganh"] = specs
        else:
            data["chuyen_nganh"] = []

        return data

    def _extract_from_html_dom(self, html_content: str, base_url: str) -> list[dict[str, Any]]:
        """Fallback extractor: parses SSR rendered HTML articles or accordion blocks."""
        items: list[dict[str, Any]] = []
        soup = BeautifulSoup(html_content, "html.parser")

        # In SvelteKit SSR HTML, programs are rendered within <article> tags or sections
        articles = soup.find_all("article")
        for idx, art in enumerate(articles, start=1):
            text = art.get_text(separator="\n", strip=True)
            # Find major code: 7 digits starting with 7
            code_m = re.search(r"\b(7\d{6})\b", text)
            if not code_m:
                continue

            major_code = code_m.group(1)

            # Name is usually in a heading (h2, h3, h4) or first line
            heading = art.find(["h2", "h3", "h4", "h5", "p", "strong"])
            name = heading.get_text(strip=True) if heading else ""
            # Clean name if code is prepended
            name = re.sub(r"^(\d+\.?\s*|7\d{6}\s*[-–:]\s*)", "", name).strip()
            if not name:
                lines = [line.strip() for line in text.splitlines() if line.strip()]
                name = lines[0] if lines else f"Ngành {major_code}"

            # Look for degree (Bằng tốt nghiệp: Kỹ sư / Cử nhân)
            degree = None
            deg_m = re.search(r"(?:Bằng tốt nghiệp|Bằng cấp)\s*:\s*([^\n\r]+)", text, re.IGNORECASE)
            if deg_m:
                degree = deg_m.group(1).strip()

            # Look for duration (Thời gian đào tạo: 4,5 năm)
            duration = None
            dur_m = re.search(r"(?:Thời gian(?: đào tạo)?)\s*:\s*([^\n\r]+)", text, re.IGNORECASE)
            if dur_m:
                duration = dur_m.group(1).strip()

            # Look for attachment link
            file_url = None
            att_a = art.find("a", href=re.compile(r"\.(pdf|docx?)$", re.IGNORECASE))
            if not att_a:
                att_a = art.find("a", string=re.compile(r"Tệp đính kèm|Download|Tải về", re.IGNORECASE))
            if att_a and att_a.get("href"):
                file_url = urljoin(base_url, att_a["href"])

            # Look for specializations
            specializations: list[str] = []
            spec_sec = art.find(string=re.compile(r"Chuyên ngành|Các chuyên ngành", re.IGNORECASE))
            if spec_sec and spec_sec.parent:
                parent = spec_sec.parent
                container = parent.find_next_sibling(["ul", "ol", "div"]) or parent
                if container:
                    for li in container.find_all("li"):
                        st = li.get_text(strip=True)
                        if st:
                            specializations.append(st)

            items.append({
                "stt": idx,
                "ma_nganh": major_code,
                "ten_nganh": name,
                "bang_tot_nghiep": degree,
                "thoi_gian": duration,
                "file": file_url,
                "chuyen_nganh": specializations,
            })

        return items

    def _process_attachment(
        self,
        att_url: str,
        major_code: str,
        major_name: str,
        stt: int = 1,
        download: bool = True,
    ) -> AttachmentInfo | None:
        """Downloads and stores a program attachment file, renaming according to the major."""
        from scripts.crawler.storage import slugify_vietnamese

        slug = slugify_vietnamese(major_name) if major_name else "chuong_trinh_dao_tao"
        clean_file_name = f"{stt:02d}_{major_code}_{slug}.pdf"

        if not download or not self.downloader or not self.storage:
            return AttachmentInfo(
                file_name=clean_file_name,
                source_url=att_url,
                local_path=f"raw/pdf/{clean_file_name}",
                content_type="application/pdf",
                status="pending",
            )

        logger.info("Fetching program attachment [%s] (%s): %s", major_code, clean_file_name, att_url)
        res = self.downloader.fetch(att_url)
        if not res.success or not res.content:
            logger.warning("Failed to download attachment for major %s: %s", major_code, res.error_message)
            return AttachmentInfo(
                file_name=clean_file_name,
                source_url=att_url,
                local_path="",
                status="failed",
            )

        # Save to storage with exact renamed filename
        rel_path, is_new = self.storage.save_raw_file(
            url=att_url,
            content=res.content,
            sha256_hash=res.sha256,
            doc_type="pdf",
            custom_filename=clean_file_name,
            preserve_exact_name=True,
        )

        file_size = len(res.content)
        return AttachmentInfo(
            file_name=rel_path.split("/")[-1],
            source_url=att_url,
            local_path=rel_path,
            file_size_bytes=file_size,
            sha256=res.sha256,
            content_type=res.content_type,
            status="downloaded" if is_new else "duplicate",
        )
