from __future__ import annotations

from unittest.mock import MagicMock

from scripts.crawler.parsers.epu_programs import (
    EXPECTED_PROGRAM_COUNT,
    EpuProgramsParser,
)


def generate_mock_sveltekit_bundle(count: int = 38) -> str:
    """Generates synthetic SvelteKit JS chunk containing specified number of programs."""
    items = []
    for i in range(1, count + 1):
        code = f"75103{i:02d}"
        items.append(
            f'{{stt:{i},ten_nganh:"Ngành thử nghiệm {i}",ma_nganh:"{code}",'
            f'bang_tot_nghiep:"Kỹ sư",thoi_gian:"4,5 năm",chuyen_nganh:["Chuyên ngành {i}A","Chuyên ngành {i}B"],'
            f'file:"https://old.epu.edu.vn/Uploads/files/CTDaoTao_update2026/{code}.pdf"}}'
        )
    return f'const Da={{dai_hoc:[{",".join(items)}]}};'


def test_epu_programs_parser_sveltekit_38():
    mock_downloader = MagicMock()
    mock_storage = MagicMock()

    # Mock fetching JS bundle
    bundle_js = generate_mock_sveltekit_bundle(38)
    mock_res = MagicMock()
    mock_res.success = True
    mock_res.text_content = bundle_js
    mock_downloader.fetch.return_value = mock_res

    parser = EpuProgramsParser(downloader=mock_downloader, storage=mock_storage)

    mock_html = """
    <!DOCTYPE html>
    <html>
      <head>
        <link rel="modulepreload" href="/_app/immutable/nodes/10.4gwboTOx.js">
      </head>
      <body>
        <div>Đại học Điện Lực</div>
      </body>
    </html>
    """

    programs, warnings = parser.parse(
        html_content=mock_html,
        source_url="https://epu.edu.vn/page/dai-hoc",
        download_attachments=False,
    )

    assert len(programs) == EXPECTED_PROGRAM_COUNT
    assert len(warnings) == 0

    first = programs[0]
    assert first.stt == 1
    assert first.major_code == "7510301"
    assert first.major_name == "Ngành thử nghiệm 1"
    assert first.degree == "Kỹ sư"
    assert first.duration == "4,5 năm"
    assert len(first.specializations) == 2
    assert len(first.attachments) == 1
    assert "7510301.pdf" in first.attachments[0].source_url

    last = programs[37]
    assert last.stt == 38
    assert last.major_code == "7510338"


def test_epu_programs_parser_discrepancy_warning():
    mock_downloader = MagicMock()
    # Provide only 30 programs (fewer than 38)
    bundle_js = generate_mock_sveltekit_bundle(30)
    mock_res = MagicMock()
    mock_res.success = True
    mock_res.text_content = bundle_js
    mock_downloader.fetch.return_value = mock_res

    parser = EpuProgramsParser(downloader=mock_downloader)

    mock_html = '<link rel="modulepreload" href="/_app/immutable/nodes/10.abc.js">'
    programs, warnings = parser.parse(mock_html, download_attachments=False)

    assert len(programs) == 30
    assert len(warnings) == 1
    assert "Program count discrepancy: Extracted 30 programs, expected 38" in warnings[0]
