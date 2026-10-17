"""Typed Policy Configuration for Admission X AI.

Loads and validates docs/ai/phase-1/rulebase-v1.yaml with strict Pydantic schemas.
Follows docs/ai/phase-1/rulebase-v1.yaml and scope-and-source-policy.md.
Task 1: Loading and validation only. Rulebase execution engine belongs to Task 2.
"""

from __future__ import annotations

import os
from enum import Enum
from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class PolicyConfigError(Exception):
    """Base exception for policy configuration errors."""


class PolicyFileNotFoundError(PolicyConfigError):
    """Raised when the rulebase configuration file is not found."""


class PolicyValidationError(PolicyConfigError):
    """Raised when the policy configuration fails schema or business validation."""


class RulePriority(str, Enum):
    """Priority levels for admission policy rules."""

    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class SourceTiers(BaseModel):
    """Definitions of source tiers according to scope-and-source-policy.md."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    official_epu: str = Field(..., min_length=1, description="Official EPU evidence definition.")
    general: str = Field(
        ..., min_length=1, description="General educational/career knowledge definition."
    )
    restricted: str = Field(
        ..., min_length=1, description="Restricted/unverified EPU claims definition."
    )


class RuleDefinition(BaseModel):
    """Typed schema for a single deterministic admission rule."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    id: str = Field(..., pattern=r"^RB-\d{2}$", description="Rule identifier, e.g. RB-01.")
    priority: RulePriority = Field(..., description="Rule priority level.")
    condition: str = Field(..., min_length=1, description="Condition triggering this rule.")
    action: str = Field(..., min_length=1, description="Prescribed behavior or constraint.")
    fallback: str = Field(
        ..., min_length=1, description="Fallback behavior if condition cannot be satisfied."
    )
    enforcement_layer: str = Field(
        ..., min_length=1, description="Target component or layer enforcing this rule."
    )
    test_cases: list[str] = Field(
        ..., min_length=1, description="Identifiers of golden evaluation test cases."
    )

    @field_validator("condition", "action", "fallback", "enforcement_layer")
    @classmethod
    def validate_non_blank_string(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Field cannot be blank or contain only whitespace.")
        return stripped

    @field_validator("test_cases")
    @classmethod
    def validate_test_cases(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("test_cases cannot be empty.")
        validated: list[str] = []
        for tc in v:
            if not isinstance(tc, str) or not tc.strip():
                raise ValueError(f"Invalid test case reference: {tc!r}")
            validated.append(tc.strip())
        return validated


class PolicyConfig(BaseModel):
    """Complete typed configuration for Phase 1 Rulebase."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    version: str = Field(..., min_length=1, description="Policy version string.")
    status: str = Field(
        ..., min_length=1, description="Lifecycle status, e.g. proposed_for_review."
    )
    default_language: str = Field(default="vi", min_length=2, max_length=10)
    source_tiers: SourceTiers = Field(..., description="Definitions of source tiers.")
    precedence: list[str] = Field(
        ..., min_length=1, description="Precedence hierarchy of policy layers."
    )
    rules: list[RuleDefinition] = Field(..., min_length=1, description="List of rule definitions.")

    @field_validator("precedence")
    @classmethod
    def validate_precedence(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("precedence cannot be empty.")
        for item in v:
            if not isinstance(item, str) or not item.strip():
                raise ValueError(f"Invalid precedence item: {item!r}")
        return v

    @model_validator(mode="after")
    def validate_rules_integrity(self) -> PolicyConfig:
        rule_ids = [rule.id for rule in self.rules]
        if len(rule_ids) != len(set(rule_ids)):
            seen: set[str] = set()
            duplicates = [rid for rid in rule_ids if rid in seen or seen.add(rid)]
            raise ValueError(f"Duplicate rule IDs detected: {duplicates}")

        if len(self.rules) != 13:
            raise ValueError(
                f"Expected exactly 13 rules (RB-01 through RB-13) in Phase 1 rulebase, found {len(self.rules)}."
            )

        expected_ids = {f"RB-{i:02d}" for i in range(1, 14)}
        actual_ids = set(rule_ids)
        if actual_ids != expected_ids:
            missing = sorted(expected_ids - actual_ids)
            unexpected = sorted(actual_ids - expected_ids)
            msg_parts = []
            if missing:
                msg_parts.append(f"Missing rules: {missing}")
            if unexpected:
                msg_parts.append(f"Unexpected rules: {unexpected}")
            raise ValueError(f"Rule ID sequence mismatch: {'; '.join(msg_parts)}")

        return self

    @property
    def rule_ids(self) -> list[str]:
        """Return list of rule IDs in order."""
        return [r.id for r in self.rules]

    def get_rule(self, rule_id: str) -> RuleDefinition | None:
        """Find a rule by ID (e.g. 'RB-01')."""
        for rule in self.rules:
            if rule.id == rule_id:
                return rule
        return None

    def get_rules_by_priority(self, priority: RulePriority | str) -> list[RuleDefinition]:
        """Filter rules by priority level."""
        p_val = priority.value if isinstance(priority, RulePriority) else str(priority).lower()
        return [rule for rule in self.rules if rule.priority.value == p_val]

    def get_rules_by_layer(self, layer_substring: str) -> list[RuleDefinition]:
        """Find rules enforced by a specific architectural layer."""
        sub = layer_substring.lower().strip()
        return [rule for rule in self.rules if sub in rule.enforcement_layer.lower()]


def find_default_rulebase_path() -> Path:
    """Find docs/ai/phase-1/rulebase-v1.yaml independently of current working directory."""
    # 1. Environment variable override if provided
    env_path = os.getenv("RULEBASE_CONFIG_PATH")
    if env_path:
        p = Path(env_path).resolve()
        if p.is_file():
            return p

    # 2. Walk upwards from this file location to find repository root containing docs/ai/phase-1/rulebase-v1.yaml
    current = Path(__file__).resolve()
    for parent in [current] + list(current.parents):
        candidate = parent / "docs" / "ai" / "phase-1" / "rulebase-v1.yaml"
        if candidate.is_file():
            return candidate

    # 3. Fallback to expected standard relative location
    return Path(__file__).resolve().parents[4] / "docs" / "ai" / "phase-1" / "rulebase-v1.yaml"


def load_policy_config(config_path: str | Path | None = None) -> PolicyConfig:
    """Safely load and validate the Phase 1 rulebase YAML configuration.

    Args:
        config_path: Optional explicit file path to rulebase YAML.
                     If None, resolves path independently of process CWD.

    Returns:
        Validated PolicyConfig instance.

    Raises:
        PolicyFileNotFoundError: If the configuration file cannot be found.
        PolicyValidationError: If YAML syntax or schema validation fails.
        PolicyConfigError: For other loading failures.
    """
    target_path = (
        Path(config_path).resolve() if config_path is not None else find_default_rulebase_path()
    )
    if not target_path.is_file():
        raise PolicyFileNotFoundError(f"Policy configuration file not found at: {target_path}")

    try:
        with open(target_path, "r", encoding="utf-8") as f:
            raw_data: Any = yaml.safe_load(f)
    except yaml.YAMLError as exc:
        raise PolicyValidationError(f"Invalid YAML syntax in {target_path}: {exc}") from exc
    except Exception as exc:
        raise PolicyConfigError(
            f"Failed to read policy configuration at {target_path}: {exc}"
        ) from exc

    if not isinstance(raw_data, dict):
        raise PolicyValidationError(
            f"Policy configuration must be a mapping/dict, got {type(raw_data).__name__}"
        )

    try:
        return PolicyConfig.model_validate(raw_data)
    except Exception as exc:
        raise PolicyValidationError(f"Policy configuration validation failed: {exc}") from exc
