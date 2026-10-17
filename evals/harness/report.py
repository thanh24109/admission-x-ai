"""Report generation engine for Admission X AI evaluation framework.

Exports machine-readable JSON reports and human-readable Markdown reports.
Follows Phase 1 Task 5 Section 10.
"""

from __future__ import annotations

import json
from pathlib import Path

from evals.harness.models import (
    EvaluationResultStatus,
    EvaluationSuiteResult,
)


def export_json_report(suite_result: EvaluationSuiteResult, output_path: str | Path) -> None:
    """Export the evaluation suite result as a clean, deterministic JSON report."""
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    data = suite_result.model_dump(mode="json")
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def generate_markdown_report(suite_result: EvaluationSuiteResult) -> str:
    """Generate a comprehensive Markdown report summarizing evaluation findings."""
    sr = suite_result
    lines: list[str] = []

    lines.append("# BÁO CÁO KẾT QUẢ KIỂM THỬ ĐÁNH GIÁ (EVALUATION REPORT)")
    lines.append("")
    lines.append(f"- **Dataset Version:** `{sr.dataset_version}`")
    lines.append(f"- **Tổng số ca (Total Cases):** `{sr.total_cases}`")
    lines.append(f"- **Đã đánh giá khả thi (Evaluated):** `{sr.evaluated_cases}`")
    lines.append(f"- **Đạt chuẩn (Passed):** `{sr.passed_cases}`")
    lines.append(f"- **Không đạt (Failed):** `{sr.failed_cases}`")
    lines.append(f"- **Chưa thể đánh giá (NOT_EVALUABLE):** `{sr.not_evaluable_cases}`")
    lines.append(f"- **Lỗi thực thi (Errors):** `{sr.error_cases}`")
    lines.append("")

    # 1. Summary Metrics Table
    lines.append("## 1. Các Chỉ Số Đánh Giá (Evaluation Metrics)")
    lines.append("")
    lines.append("| Metric | Value | Status | Denominator | Ghi chú |")
    lines.append("| :--- | :---: | :---: | :---: | :--- |")

    for m_name, m_val in sr.metrics.items():
        val_str = f"{m_val.value * 100:.1f}%" if m_val.value is not None else "N/A"
        denom_str = f"{m_val.numerator}/{m_val.denominator}" if m_val.denominator is not None else "-"
        status_str = f"**{m_val.status.value}**"
        reason = m_val.reason or ""
        lines.append(f"| `{m_name}` | {val_str} | {status_str} | {denom_str} | {reason} |")

    lines.append("")

    # 2. Category Breakdown
    lines.append("## 2. Phân Tích Theo Danh Mục (Category Breakdown)")
    lines.append("")
    lines.append("| Danh mục (Category) | Tổng số | PASS | FAIL | NOT_EVALUABLE | ERROR |")
    lines.append("| :--- | :---: | :---: | :---: | :---: | :---: |")

    for cat, counts in sr.category_breakdown.items():
        total = counts.get("total", 0)
        p = counts.get("pass", 0)
        f_cnt = counts.get("fail", 0)
        ne = counts.get("not_evaluable", 0)
        err = counts.get("error", 0)
        lines.append(f"| `{cat}` | {total} | {p} | {f_cnt} | {ne} | {err} |")

    lines.append("")

    # 3. NOT_EVALUABLE Audit
    lines.append("## 3. Giải Trình Trạng Thái NOT_EVALUABLE (Audit Explanation)")
    lines.append("")
    lines.append(
        "> [!IMPORTANT]\n"
        "> Trong Phase 1, các câu hỏi tra cứu dữ liệu thực tế (curriculum, program details, credits) "
        "được giữ nguyên trạng thái `pending_pdf_verification` và được đánh giá là `NOT_EVALUABLE`. "
        "Hệ thống kiên quyết KHÔNG bịa đặt đáp án chuẩn hay tính điểm ảo trước khi tài liệu chính thức "
        "được thẩm định độc lập."
    )
    lines.append("")
    lines.append(f"- Số ca `pending_pdf_verification`: **{sr.not_evaluable_cases}**")
    lines.append("- Các danh mục thuộc diện này: `major` (15), `curriculum` (20), `comparison` (10).")
    lines.append("")

    # 4. Failure details (if any)
    failures = [r for r in sr.results if r.result in {EvaluationResultStatus.FAIL, EvaluationResultStatus.ERROR}]
    if failures:
        lines.append("## 4. Chi Tiết Lỗi (Failure Details)")
        lines.append("")
        for f in failures:
            lines.append(f"### Case: `{f.case_id}` ({f.result.value})")
            lines.append(f"- **Expected Behavior:** `{f.expected_behavior}`")
            lines.append(f"- **Observed Behavior:** `{f.observed_behavior}`")
            for r in f.failure_reasons:
                lines.append(f"  - ❌ {r}")
            lines.append("")
    else:
        lines.append("## 4. Chi Tiết Lỗi (Failure Details)")
        lines.append("")
        lines.append("✅ Không có lỗi nào xảy ra trên toàn bộ các ca kiểm thử khả thi.")
        lines.append("")

    # 5. Execution Metadata
    lines.append("## 5. Metadata Thực Thi")
    lines.append("")
    for k, v in sr.execution_metadata.items():
        lines.append(f"- **{k}:** `{v}`")
    lines.append("")

    return "\n".join(lines)


def export_markdown_report(suite_result: EvaluationSuiteResult, output_path: str | Path) -> None:
    """Export the evaluation report as a markdown document."""
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    content = generate_markdown_report(suite_result)
    with path.open("w", encoding="utf-8") as f:
        f.write(content)
