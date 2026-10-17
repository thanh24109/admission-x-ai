"""Report generation engine for Admission X AI evaluation framework.

Exports machine-readable JSON reports and human-readable Markdown reports.
Follows Phase 1 Task 5 Section 10 and Task 5.1 audit requirements.
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
    ss = sr.scenario_summary
    tc = sr.tier_coverage
    lines: list[str] = []

    lines.append("# BÁO CÁO KẾT QUẢ KIỂM THỬ ĐÁNH GIÁ (EVALUATION REPORT)")
    lines.append("")
    lines.append(f"- **Dataset Version:** `{sr.dataset_version}`")
    lines.append(f"- **Tổng số kịch bản (Total Scenarios):** `{sr.total_scenarios}`")
    lines.append(f"- **Kịch bản đạt chuẩn (Passed Scenarios):** `{ss.passed_scenarios}`")
    lines.append(f"- **Kịch bản độ phủ một phần (Partial Coverage Scenarios):** `{ss.partial_coverage_scenarios}` (Đạt chiều chính sách/khế ước, chiều thực tế chưa thể đánh giá)")
    lines.append(f"- **Kịch bản chưa thể đánh giá (NOT_EVALUABLE Scenarios):** `{ss.not_evaluable_scenarios}` (Chờ kiểm chứng PDF)")
    lines.append(f"- **Kịch bản không đạt (Failed Scenarios):** `{ss.failed_scenarios}`")
    lines.append(f"- **Kịch bản lỗi (Error Scenarios):** `{ss.error_scenarios}`")
    lines.append(f"- **Kịch bản không có adapter (Unsupported Scenarios):** `{ss.unsupported_scenarios}`")
    lines.append(f"- **Tổng số lượt đánh giá adapter (Total Adapter Evaluations):** `{sr.total_adapter_evaluations}`")
    lines.append("")

    # 1. Tier Coverage Table
    lines.append("## 1. Phân Tầng Dữ Liệu Kiểm Thử (Dataset Tier Coverage)")
    lines.append("")
    lines.append("| Tầng dữ liệu (Dataset Tier) | Số kịch bản | Tỷ lệ | Trạng thái đánh giá Phase 1 |")
    lines.append("| :--- | :---: | :---: | :--- |")
    tier_a_pct = f"{tc.tier_a_policy_only / tc.total_cases * 100:.1f}%" if tc.total_cases > 0 else "0%"
    tier_b_pct = f"{tc.tier_b_pending_factual / tc.total_cases * 100:.1f}%" if tc.total_cases > 0 else "0%"
    tier_c_pct = f"{tc.tier_c_synthetic / tc.total_cases * 100:.1f}%" if tc.total_cases > 0 else "0%"
    lines.append(f"| **Tier A — Policy-Only** | {tc.tier_a_policy_only} | {tier_a_pct} | Khả thi thực thi tất định (Controlled Context) |")
    lines.append(f"| **Tier B — Pending Factual** | {tc.tier_b_pending_factual} | {tier_b_pct} | `NOT_EVALUABLE` (Chờ gắn chứng cứ PDF EPU) |")
    lines.append(f"| **Tier C — Synthetic Fixtures** | {tc.tier_c_synthetic} | {tier_c_pct} | Khế ước phần mềm giả lập độc lập |")
    lines.append("")

    # 2. Per-Adapter Accounting Table
    lines.append("## 2. Thống Kê Theo Bộ Điều Hợp (Per-Adapter Accounting)")
    lines.append("")
    lines.append("| Bộ điều hợp (Adapter) | Lượt chạy (Runs) | PASS | FAIL | NOT_EVALUABLE | ERROR |")
    lines.append("| :--- | :---: | :---: | :---: | :---: | :---: |")
    for a_name, a_sum in sr.adapter_breakdown.items():
        lines.append(f"| `{a_name}` | {a_sum.total_evaluations} | {a_sum.passed} | {a_sum.failed} | {a_sum.not_evaluable} | {a_sum.error} |")
    lines.append("")

    # 3. Summary Metrics Table
    lines.append("## 3. Các Chỉ Số Đánh Giá (Evaluation Metrics)")
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

    # 4. Category Breakdown
    lines.append("## 4. Phân Tích Theo Danh Mục Kịch Bản (Category Breakdown)")
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

    # 5. NOT_EVALUABLE Audit Explanation
    lines.append("## 5. Giải Trình Trạng Thái NOT_EVALUABLE (Audit Explanation)")
    lines.append("")
    lines.append(
        "> [!IMPORTANT]\n"
        "> Trong Phase 1, các câu hỏi tra cứu dữ liệu thực tế (curriculum, program details, credits, comparison) "
        "được giữ nguyên trạng thái `pending_pdf_verification` và được đánh giá là `NOT_EVALUABLE`. "
        "Hệ thống kiên quyết KHÔNG bịa đặt đáp án chuẩn hay tính điểm ảo trước khi tài liệu chính thức "
        "được thẩm định độc lập."
    )
    lines.append("")
    lines.append(f"- Số kịch bản `pending_pdf_verification` (Tier B): **{tc.tier_b_pending_factual}**")
    lines.append(f"- Số lượt đánh giá `NOT_EVALUABLE`: **{sr.not_evaluable_cases}**")
    if ss.partial_coverage_scenarios > 0:
        lines.append(
            f"- Số kịch bản `partial_coverage`: **{ss.partial_coverage_scenarios}** "
            "(Đạt chuẩn ở chiều chính sách hoặc khế ước nhưng chiều dữ liệu thực tế đang chờ PDF. "
            "Không đại diện cho độ chính xác factual end-to-end của chatbot)."
        )
    if sr.unsupported_case_ids:
        lines.append(f"- Kịch bản không có adapter hỗ trợ: `{', '.join(sr.unsupported_case_ids)}`")
    lines.append("")

    # 6. Failure details (if any)
    failures = [r for r in sr.results if r.result in {EvaluationResultStatus.FAIL, EvaluationResultStatus.ERROR}]
    if failures:
        lines.append("## 6. Chi Tiết Lỗi (Failure Details)")
        lines.append("")
        for f in failures:
            lines.append(f"### Case: `{f.case_id}` ({f.result.value})")
            lines.append(f"- **Adapter:** `{f.adapter_name}`")
            lines.append(f"- **Expected Behavior:** `{f.expected_behavior}`")
            lines.append(f"- **Observed Behavior:** `{f.observed_behavior}`")
            for r in f.failure_reasons:
                lines.append(f"  - ❌ {r}")
            lines.append("")
    else:
        lines.append("## 6. Chi Tiết Lỗi (Failure Details)")
        lines.append("")
        lines.append("✅ Không có lỗi nào xảy ra trên toàn bộ các ca kiểm thử khả thi.")
        lines.append("")

    # 7. Execution Metadata
    lines.append("## 7. Metadata Thực Thi")
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
