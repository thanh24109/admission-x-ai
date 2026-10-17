"""Modular System Prompt Builder for Admission X AI.

Composes system prompt modules in a deterministic, validated order.
Follows docs/ai/phase-1/prompt-architecture.md and scope-and-source-policy.md.
"""

from __future__ import annotations

from pathlib import Path
from typing import Final

from pydantic import BaseModel, ConfigDict, Field, field_validator

PROMPT_VERSION: Final[str] = "1.0.0"

REQUIRED_MODULES: Final[tuple[str, ...]] = (
    "01_identity.md",
    "02_scope_source_priority.md",
    "03_grounding_citations.md",
    "04_general_knowledge.md",
    "05_uncertainty_abstention.md",
    "06_safety_privacy.md",
    "07_response_contract.md",
)


class PromptBuilderError(Exception):
    """Base exception for prompt builder failures."""


class PromptModuleNotFoundError(PromptBuilderError):
    """Raised when a required prompt module file does not exist."""


class PromptModuleEmptyError(PromptBuilderError):
    """Raised when a prompt module file is empty or contains only whitespace."""


class PromptContext(BaseModel):
    """Typed, allowlisted context for system prompt composition.

    Never place untrusted user queries or unverified runtime text into this context.
    """

    model_config = ConfigDict(frozen=True)

    admissions_year: int | None = Field(
        default=None,
        ge=2000,
        le=2100,
        description="Official admissions year if verified by metadata.",
    )
    default_language: str = Field(
        default="vi",
        min_length=2,
        max_length=10,
        description="Default language code for user interaction.",
    )
    institution_name: str = Field(
        default="Trường Đại học Điện lực",
        min_length=1,
        max_length=100,
        description="Public institution name (EPU).",
    )
    portal_name: str = Field(
        default="Cổng thông tin tuyển sinh",
        min_length=1,
        max_length=100,
        description="Public portal brand identity.",
    )
    extra_allowed_metadata: dict[str, str] = Field(
        default_factory=dict,
        description="Allowlisted key-value metadata from trusted system configuration.",
    )

    @field_validator("extra_allowed_metadata")
    @classmethod
    def validate_metadata_content(cls, v: dict[str, str]) -> dict[str, str]:
        for key, val in v.items():
            if len(key) > 64 or len(val) > 256:
                raise ValueError(f"Metadata key/value exceeds length limit: {key}")
            # Guard against control character injection
            if "\n" in key or "\r" in key or "\n" in val or "\r" in val:
                raise ValueError(f"Metadata cannot contain newlines: {key}")
        return v


class SystemPromptBuilder:
    """Builder that composes versioned, modular system prompts."""

    def __init__(
        self,
        modules_dir: Path | str | None = None,
        prompt_version: str = PROMPT_VERSION,
    ) -> None:
        if modules_dir is None:
            self.modules_dir = Path(__file__).resolve().parent / "modules"
        else:
            self.modules_dir = Path(modules_dir).resolve()
        self.prompt_version = prompt_version

    def load_module(self, filename: str) -> str:
        """Load and validate a single module file."""
        module_path = self.modules_dir / filename
        if not module_path.is_file():
            raise PromptModuleNotFoundError(f"Required prompt module file not found: {module_path}")

        try:
            content = module_path.read_text(encoding="utf-8").strip()
        except Exception as exc:
            raise PromptBuilderError(f"Failed to read prompt module {filename}: {exc}") from exc

        if not content:
            raise PromptModuleEmptyError(
                f"Prompt module file is empty or contains only whitespace: {module_path}"
            )
        return content

    def build(self, context: PromptContext | None = None) -> str:
        """Deterministically compose all required modules into the system prompt."""
        sections: list[str] = []

        # 1. Header with version and public identity
        header = (
            f"<!-- prompt_version: {self.prompt_version} -->\n"
            f"# HỆ THỐNG TRỢ LÝ TƯ VẤN TUYỂN SINH — {context.institution_name if context else 'Trường Đại học Điện lực'}\n"
            f"Đại diện: {context.portal_name if context else 'Cổng thông tin tuyển sinh'}"
        )
        sections.append(header)

        # 2. Iterate deterministically over required modules
        for module_filename in REQUIRED_MODULES:
            module_content = self.load_module(module_filename)
            sections.append(module_content)

        # 3. Optional trusted context section
        if context:
            ctx_lines: list[str] = ["# THÔNG TIN NGỮ CẢNH HỆ THỐNG ĐÃ ĐƯỢC XÁC THỰC"]
            ctx_lines.append(f"- Ngôn ngữ mặc định: {context.default_language}")
            if context.admissions_year is not None:
                ctx_lines.append(f"- Niên khóa tuyển sinh xác thực: {context.admissions_year}")
            for k, v in sorted(context.extra_allowed_metadata.items()):
                ctx_lines.append(f"- {k}: {v}")
            sections.append("\n".join(ctx_lines))

        return "\n\n---\n\n".join(sections)


def build_system_prompt(context: PromptContext | None = None) -> str:
    """Convenience function to build the default system prompt."""
    builder = SystemPromptBuilder()
    return builder.build(context)


def get_system_prompt_version() -> str:
    """Return the current system prompt version."""
    return PROMPT_VERSION
