from __future__ import annotations

import hashlib
import logging
import time
from typing import Self

import httpx

from scripts.crawler.config import (
    DEFAULT_MAX_RETRIES,
    DEFAULT_RATE_LIMIT_DELAY,
    DEFAULT_RETRY_BACKOFF,
    DEFAULT_TIMEOUT,
    DEFAULT_USER_AGENT,
    MAX_FILE_SIZE_BYTES,
)

logger = logging.getLogger(__name__)


class FetchResult:
    def __init__(
        self,
        url: str,
        final_url: str = "",
        status_code: int = 0,
        content: bytes = b"",
        content_type: str = "",
        headers: dict[str, str] | None = None,
        sha256: str = "",
        error: str | None = None,
        duration_seconds: float = 0.0,
    ):
        self.url = url
        self.final_url = final_url or url
        self.status_code = status_code
        self.content = content
        self.content_type = content_type
        self.headers = headers or {}
        self.sha256 = sha256 or (hashlib.sha256(content).hexdigest() if content else "")
        self.error = error
        self.duration_seconds = duration_seconds

    @property
    def is_success(self) -> bool:
        return self.status_code == 200 and not self.error and bool(self.content)

    @property
    def success(self) -> bool:
        return self.is_success

    @property
    def text(self) -> str:
        try:
            return self.content.decode("utf-8")
        except UnicodeDecodeError:
            return self.content.decode("utf-8", errors="replace")

    @property
    def text_content(self) -> str:
        return self.text

    @property
    def error_message(self) -> str | None:
        return self.error


class HttpDownloader:
    """Production-minded HTTP client with retries, rate limiting, and size protection."""

    def __init__(
        self,
        timeout: float = DEFAULT_TIMEOUT,
        max_retries: int = DEFAULT_MAX_RETRIES,
        retry_backoff: float = DEFAULT_RETRY_BACKOFF,
        rate_limit_delay: float = DEFAULT_RATE_LIMIT_DELAY,
        user_agent: str = DEFAULT_USER_AGENT,
        max_file_size: int = MAX_FILE_SIZE_BYTES,
        max_file_size_bytes: int | None = None,
    ):
        self.timeout = timeout
        self.max_retries = max_retries
        self.retry_backoff = retry_backoff
        self.rate_limit_delay = rate_limit_delay
        self.max_file_size = max_file_size_bytes if max_file_size_bytes is not None else max_file_size
        self.headers = {
            "User-Agent": user_agent,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
        }
        self._last_request_time = 0.0
        self._client: httpx.Client | None = None

    def _get_client(self) -> httpx.Client:
        if self._client is None or self._client.is_closed:
            self._client = httpx.Client(
                timeout=httpx.Timeout(self.timeout, connect=self.timeout),
                follow_redirects=True,
                headers=self.headers,
                max_redirects=5,
                verify=False,
            )
        return self._client

    def close(self) -> None:
        if self._client and not self._client.is_closed:
            self._client.close()
            self._client = None

    def __enter__(self) -> Self:
        return self

    def __exit__(self, *args: object) -> None:
        self.close()

    def _apply_rate_limit(self) -> None:
        """Enforce spacing between outgoing HTTP requests."""
        if self.rate_limit_delay <= 0:
            return
        now = time.time()
        elapsed = now - self._last_request_time
        if elapsed < self.rate_limit_delay:
            time.sleep(self.rate_limit_delay - elapsed)
        self._last_request_time = time.time()

    def fetch(self, url: str) -> FetchResult:
        """Fetch a URL with exponential backoff retries and size guard."""
        start_time = time.time()
        client = self._get_client()

        last_error = ""
        for attempt in range(1, self.max_retries + 1):
            self._apply_rate_limit()
            try:
                # Use streaming to check Content-Length before downloading large body
                with client.stream("GET", url) as response:
                    content_type = response.headers.get("content-type", "").lower()
                    content_length = response.headers.get("content-length")

                    if content_length and int(content_length) > self.max_file_size:
                        return FetchResult(
                            url=url,
                            final_url=str(response.url),
                            status_code=response.status_code,
                            error=f"File size {content_length} bytes exceeds maximum allowed {self.max_file_size} bytes",
                            duration_seconds=time.time() - start_time,
                        )

                    # Read body safely
                    chunks: list[bytes] = []
                    total_bytes = 0
                    for chunk in response.iter_bytes(chunk_size=65536):
                        chunks.append(chunk)
                        total_bytes += len(chunk)
                        if total_bytes > self.max_file_size:
                            return FetchResult(
                                url=url,
                                final_url=str(response.url),
                                status_code=response.status_code,
                                error=f"Downloaded body exceeded maximum allowed {self.max_file_size} bytes",
                                duration_seconds=time.time() - start_time,
                            )

                    body = b"".join(chunks)
                    headers_dict = dict(response.headers)

                    if response.status_code == 200:
                        if not body:
                            return FetchResult(
                                url=url,
                                final_url=str(response.url),
                                status_code=response.status_code,
                                content=b"",
                                content_type=content_type,
                                headers=headers_dict,
                                error="Server returned empty content (0 bytes)",
                                duration_seconds=time.time() - start_time,
                            )
                        sha256_hash = hashlib.sha256(body).hexdigest()
                        return FetchResult(
                            url=url,
                            final_url=str(response.url),
                            status_code=response.status_code,
                            content=body,
                            content_type=content_type,
                            headers=headers_dict,
                            sha256=sha256_hash,
                            duration_seconds=time.time() - start_time,
                        )
                    else:
                        last_error = f"HTTP {response.status_code}"
                        # Retry on 5xx or 429
                        if response.status_code in (429, 500, 502, 503, 504):
                            wait_time = self.retry_backoff**attempt
                            time.sleep(wait_time)
                            continue
                        else:
                            return FetchResult(
                                url=url,
                                final_url=str(response.url),
                                status_code=response.status_code,
                                error=f"HTTP {response.status_code}",
                                duration_seconds=time.time() - start_time,
                            )

            except (httpx.ConnectTimeout, httpx.ReadTimeout, httpx.WriteTimeout, httpx.PoolTimeout) as exc:
                last_error = f"Timeout: {exc}"
                logger.warning("Timeout fetching %s (attempt %d/%d): %s", url, attempt, self.max_retries, exc)
                time.sleep(self.retry_backoff**attempt)
            except httpx.HTTPError as exc:
                last_error = f"HTTPError: {exc}"
                logger.warning("HTTP error on %s (attempt %d/%d): %s", url, attempt, self.max_retries, exc)
                time.sleep(self.retry_backoff**attempt)
            except Exception as exc:  # noqa: BLE001
                last_error = f"Exception: {exc}"
                logger.warning("Error fetching %s (attempt %d/%d): %s", url, attempt, self.max_retries, exc)
                time.sleep(self.retry_backoff**attempt)

        return FetchResult(
            url=url,
            status_code=0,
            error=last_error or "Max retries exceeded",
            duration_seconds=time.time() - start_time,
        )
