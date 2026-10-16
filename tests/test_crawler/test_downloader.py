from __future__ import annotations

from unittest.mock import MagicMock, patch

from scripts.crawler.downloader import HttpDownloader


def test_downloader_success():
    downloader = HttpDownloader()

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.url = "https://epu.edu.vn/page/dai-hoc"
    mock_resp.headers = {"content-type": "text/html; charset=utf-8"}
    mock_resp.iter_bytes.return_value = [b"<html>Test Content</html>"]

    client = downloader._get_client()
    with patch.object(client, "stream") as mock_stream:
        mock_stream.return_value.__enter__.return_value = mock_resp

        res = downloader.fetch("https://epu.edu.vn/page/dai-hoc")
        assert res.success is True
        assert res.status_code == 200
        assert res.sha256 != ""
        assert res.text_content == "<html>Test Content</html>"


def test_downloader_retry_on_server_error():
    downloader = HttpDownloader(max_retries=2, retry_backoff=0.01)

    fail_resp = MagicMock()
    fail_resp.status_code = 503
    fail_resp.url = "https://epu.edu.vn/page/dai-hoc"
    fail_resp.headers = {"content-type": "text/html"}
    fail_resp.iter_bytes.return_value = [b"Service Unavailable"]

    success_resp = MagicMock()
    success_resp.status_code = 200
    success_resp.url = "https://epu.edu.vn/page/dai-hoc"
    success_resp.headers = {"content-type": "text/html"}
    success_resp.iter_bytes.return_value = [b"Recovered"]

    client = downloader._get_client()
    with patch.object(client, "stream") as mock_stream:
        ctx1 = MagicMock()
        ctx1.__enter__.return_value = fail_resp
        ctx2 = MagicMock()
        ctx2.__enter__.return_value = success_resp
        mock_stream.side_effect = [ctx1, ctx2]

        res = downloader.fetch("https://epu.edu.vn/page/dai-hoc")
        assert res.success is True
        assert res.status_code == 200
        assert res.text_content == "Recovered"


def test_downloader_max_file_size():
    downloader = HttpDownloader(max_file_size_bytes=100)

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.url = "https://epu.edu.vn/huge.pdf"
    mock_resp.headers = {"content-type": "application/pdf"}
    mock_resp.iter_bytes.return_value = [b"x" * 200]

    client = downloader._get_client()
    with patch.object(client, "stream") as mock_stream:
        mock_stream.return_value.__enter__.return_value = mock_resp

        res = downloader.fetch("https://epu.edu.vn/huge.pdf")
        assert res.success is False
        assert "exceeded maximum allowed" in res.error_message

