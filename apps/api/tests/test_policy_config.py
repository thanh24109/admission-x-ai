"""Unit tests for Typed Policy Configuration.

Validates schema adherence, rulebase-v1.yaml loading, negative error cases,
and helper lookup methods according to docs/ai/phase-1/rulebase-v1.yaml.
"""

import os
from pathlib import Path

import pytest
import yaml

from app.ai.config.policy_config import (
    PolicyConfig,
    PolicyConfigError,
    PolicyFileNotFoundError,
    PolicyValidationError,
    RulePriority,
    find_default_rulebase_path,
    load_policy_config,
)


def test_canonical_rulebase_loads_successfully() -> None:
    """Verify that the project's actual rulebase-v1.yaml loads without error."""
    config = load_policy_config()
    assert isinstance(config, PolicyConfig)
    assert config.version == "1.0-design"
    assert config.status == "proposed_for_review"
    assert config.default_language == "vi"
    assert config.source_tiers.official_epu
    assert len(config.precedence) >= 4


def test_canonical_rulebase_contains_exactly_13_unique_rules() -> None:
    """Ensure all 13 rules (RB-01 to RB-13) are present, unique, and ordered."""
    config = load_policy_config()
    assert len(config.rules) == 13

    expected_ids = [f"RB-{i:02d}" for i in range(1, 14)]
    assert config.rule_ids == expected_ids

    # Verify no duplicate rule IDs exist
    assert len(set(config.rule_ids)) == 13


def test_rule_definitions_properties_and_helpers() -> None:
    """Verify RuleDefinition attributes and PolicyConfig lookup helpers."""
    config = load_policy_config()

    # Test get_rule
    rb01 = config.get_rule("RB-01")
    assert rb01 is not None
    assert rb01.id == "RB-01"
    assert rb01.priority == RulePriority.CRITICAL
    assert "Tier 1" in rb01.action
    assert "official-01" in rb01.test_cases

    # Test non-existent rule
    assert config.get_rule("RB-99") is None

    # Test get_rules_by_priority
    critical_rules = config.get_rules_by_priority(RulePriority.CRITICAL)
    high_rules = config.get_rules_by_priority("high")
    assert len(critical_rules) == 7
    assert len(high_rules) == 6
    assert len(critical_rules) + len(high_rules) == 13

    # Test get_rules_by_layer
    evidence_gate_rules = config.get_rules_by_layer("evidence_gate")
    assert len(evidence_gate_rules) >= 3


def test_load_policy_config_from_explicit_path_and_different_cwd(tmp_path: Path) -> None:
    """Ensure rulebase can be loaded from an explicit path or when CWD changes."""
    canonical_path = find_default_rulebase_path()
    assert canonical_path.is_file()

    # Load from canonical path explicitly
    config = load_policy_config(canonical_path)
    assert len(config.rules) == 13

    # Simulate changing working directory to tmp_path
    original_cwd = os.getcwd()
    try:
        os.chdir(tmp_path)
        # Even when CWD is tmp_path, default path resolution should find the repository's rulebase
        config_from_sub = load_policy_config()
        assert len(config_from_sub.rules) == 13
    finally:
        os.chdir(original_cwd)


def test_missing_file_raises_policy_file_not_found(tmp_path: Path) -> None:
    """Ensure non-existent path raises PolicyFileNotFoundError."""
    fake_path = tmp_path / "non_existent_rulebase.yaml"
    with pytest.raises(PolicyFileNotFoundError) as exc_info:
        load_policy_config(fake_path)

    assert issubclass(PolicyFileNotFoundError, PolicyConfigError)
    assert str(fake_path) in str(exc_info.value)


def test_invalid_yaml_syntax_raises_policy_validation_error(tmp_path: Path) -> None:
    """Ensure malformed YAML triggers PolicyValidationError safely."""
    bad_yaml = tmp_path / "broken.yaml"
    bad_yaml.write_text("version: 1.0\nrules: [ unclosed bracket", encoding="utf-8")

    with pytest.raises(PolicyValidationError) as exc_info:
        load_policy_config(bad_yaml)

    assert "Invalid YAML syntax" in str(exc_info.value)


def test_non_dict_yaml_content_raises_policy_validation_error(tmp_path: Path) -> None:
    """Ensure YAML scalar or list at root triggers PolicyValidationError."""
    list_yaml = tmp_path / "list_root.yaml"
    list_yaml.write_text("- item1\n- item2", encoding="utf-8")

    with pytest.raises(PolicyValidationError) as exc_info:
        load_policy_config(list_yaml)

    assert "must be a mapping/dict" in str(exc_info.value)


def test_duplicate_rule_ids_rejected(tmp_path: Path) -> None:
    """Ensure duplicate rule IDs are strictly rejected."""
    canonical = load_policy_config()
    raw = canonical.model_dump(mode="json")

    # Duplicate RB-01
    raw["rules"].append(raw["rules"][0].copy())

    dup_path = tmp_path / "duplicate_rules.yaml"
    with open(dup_path, "w", encoding="utf-8") as f:
        yaml.safe_dump(raw, f)

    with pytest.raises(PolicyValidationError) as exc_info:
        load_policy_config(dup_path)

    assert "Duplicate rule IDs detected" in str(
        exc_info.value
    ) or "Expected exactly 13 rules" in str(exc_info.value)


def test_missing_required_fields_rejected(tmp_path: Path) -> None:
    """Ensure omission of mandatory fields triggers validation error."""
    canonical = load_policy_config()
    raw = canonical.model_dump(mode="json")

    # Remove mandatory field 'source_tiers'
    del raw["source_tiers"]

    bad_path = tmp_path / "missing_tiers.yaml"
    with open(bad_path, "w", encoding="utf-8") as f:
        yaml.safe_dump(raw, f)

    with pytest.raises(PolicyValidationError) as exc_info:
        load_policy_config(bad_path)

    assert "Field required" in str(exc_info.value) or "source_tiers" in str(exc_info.value)


def test_invalid_rule_priority_rejected(tmp_path: Path) -> None:
    """Ensure unknown priority value is rejected."""
    canonical = load_policy_config()
    raw = canonical.model_dump(mode="json")

    # Modify priority of RB-01 to unknown value
    raw["rules"][0]["priority"] = "urgent_emergency"

    bad_path = tmp_path / "invalid_priority.yaml"
    with open(bad_path, "w", encoding="utf-8") as f:
        yaml.safe_dump(raw, f)

    with pytest.raises(PolicyValidationError) as exc_info:
        load_policy_config(bad_path)

    assert "priority" in str(exc_info.value).lower()
