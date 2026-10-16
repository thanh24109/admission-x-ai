from __future__ import annotations

from scripts.crawler.url_filter import (
    UrlFilter,
    canonicalize_url,
    classify_document_type,
    is_allowed_domain,
)


def test_canonicalize_url_clean_params_and_fragments():
    raw = "https://EPU.edu.vn/page/dai-hoc/?utm_source=facebook&utm_medium=cpc&fbclid=123#section-1"
    canon = canonicalize_url(raw)
    assert canon == "https://epu.edu.vn/page/dai-hoc"


def test_canonicalize_url_collapse_slashes():
    raw = "https://tuyensinh.epu.edu.vn///danh-sach-tin//dai-hoc-2320-1.html/"
    canon = canonicalize_url(raw)
    assert canon == "https://tuyensinh.epu.edu.vn/danh-sach-tin/dai-hoc-2320-1.html"


def test_canonicalize_relative_url():
    base = "https://epu.edu.vn/page/dai-hoc"
    rel = "/_app/immutable/nodes/10.js"
    canon = canonicalize_url(rel, base_url=base)
    assert canon == "https://epu.edu.vn/_app/immutable/nodes/10.js"


def test_allowed_domains():
    assert is_allowed_domain("https://epu.edu.vn/page/dai-hoc")
    assert is_allowed_domain("https://tuyensinh.epu.edu.vn/danh-sach-tin")
    assert is_allowed_domain("https://ctsv.epu.edu.vn/chi-tiet-tin/chuong-trinh-khung")
    assert is_allowed_domain("https://old.epu.edu.vn/Uploads/files/CTDaoTao_update2026/7510301.pdf")

    # Disallowed domains
    assert not is_allowed_domain("https://facebook.com/epu")
    assert not is_allowed_domain("https://google.com")
    assert not is_allowed_domain("https://malicious-site.vn/epu.pdf")


def test_topic_filtering():
    filter_obj = UrlFilter()

    # Relevant admissions topics
    assert filter_obj.is_relevant_topic("https://tuyensinh.epu.edu.vn/chi-tiet-nganh-dao-tao/thong-tin-tuyen-sinh-2026.html")
    assert filter_obj.is_relevant_topic("https://epu.edu.vn/page/dai-hoc")
    assert filter_obj.is_relevant_topic("https://tuyensinh.epu.edu.vn/danh-sach-tin/dai-hoc-2320-1.html")
    assert filter_obj.is_relevant_topic("https://old.epu.edu.vn/Uploads/files/CTDaoTao_update2026/7510301.pdf")

    # Excluded trap topics
    assert not filter_obj.is_relevant_topic("https://epu.edu.vn/login")
    assert not filter_obj.is_relevant_topic("https://epu.edu.vn/dang-nhap")
    assert not filter_obj.is_relevant_topic("https://epu.edu.vn/admin/dashboard")
    assert not filter_obj.is_relevant_topic("https://epu.edu.vn/search?q=test")
    assert not filter_obj.is_relevant_topic("https://epu.edu.vn/calendar/week")


def test_classify_document_type():
    assert classify_document_type("https://epu.edu.vn/doc.pdf") == "pdf"
    assert classify_document_type("https://epu.edu.vn/doc.docx") == "docx"
    assert classify_document_type("https://epu.edu.vn/doc.doc") == "docx"
    assert classify_document_type("https://epu.edu.vn/image.png") == "image"
    assert classify_document_type("https://epu.edu.vn/image.jpg") == "image"
    assert classify_document_type("https://epu.edu.vn/page/dai-hoc") == "html"
    assert classify_document_type("https://tuyensinh.epu.edu.vn/tin-tuc.html") == "html"
