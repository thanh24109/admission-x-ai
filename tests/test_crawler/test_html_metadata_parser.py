from __future__ import annotations

from scripts.crawler.parsers.html_metadata import HtmlMetadataParser


def test_html_metadata_parser():
    sample_html = """
    <!DOCTYPE html>
    <html lang="vi">
      <head>
        <title>Thông tin tuyển sinh đại học chính quy năm 2026 - Ngành Công nghệ thông tin 7480201</title>
        <link rel="canonical" href="https://tuyensinh.epu.edu.vn/chi-tiet-nganh/cntt.html" />
        <meta property="article:published_time" content="2026-03-15T08:30:00Z" />
      </head>
      <body>
        <h1>Tuyển sinh 2026</h1>
        <div class="article-content">
          <p>Trường Đại học Điện lực thông báo tuyển sinh năm 2026.</p>
          <a href="/Uploads/files/DeAnTuyenSinh2026.pdf">Tải Đề án Tuyển sinh (PDF)</a>
          <a href="/Uploads/files/MauPhieuDangKy.docx">Mẫu Phiếu Đăng Ký (DOCX)</a>
          <img src="/Uploads/images/bang_chi_tieu_2026.png" class="content-table" alt="Bảng chỉ tiêu tuyển sinh 2026" />
          <img src="/theme/images/logo.png" class="logo" alt="Logo EPU" />
          <a href="/danh-sach-tin/dai-hoc-2320-1.html">Xem thêm tin tuyển sinh</a>
        </div>
      </body>
    </html>
    """

    parser = HtmlMetadataParser()
    result = parser.parse(
        html_content=sample_html,
        source_url="https://tuyensinh.epu.edu.vn/chi-tiet-nganh/cntt.html",
    )

    assert result["title"] == "Thông tin tuyển sinh đại học chính quy năm 2026 - Ngành Công nghệ thông tin 7480201"
    assert result["canonical_url"] == "https://tuyensinh.epu.edu.vn/chi-tiet-nganh/cntt.html"
    assert result["admission_year"] == 2026
    assert result["major_code"] == "7480201"
    assert result["publication_date"] == "2026-03-15T08:30:00Z"

    # Document links
    doc_links = result["document_links"]
    assert any("DeAnTuyenSinh2026.pdf" in l for l in doc_links)
    assert any("MauPhieuDangKy.docx" in l for l in doc_links)

    # Content image links (logo filtered out)
    img_links = result["image_links"]
    assert any("bang_chi_tieu_2026.png" in l for l in img_links)
    assert not any("logo.png" in l for l in img_links)

    # Internal links
    internal_links = result["internal_links"]
    assert any("dai-hoc-2320-1.html" in l for l in internal_links)
