"""Prompt templates and modular system prompt builder for Admission X AI."""

from app.ai.prompts.builder import (
    PROMPT_VERSION,
    REQUIRED_MODULES,
    PromptBuilderError,
    PromptContext,
    PromptModuleEmptyError,
    PromptModuleNotFoundError,
    SystemPromptBuilder,
    build_system_prompt,
    get_system_prompt_version,
)

__all__ = [
    "PROMPT_VERSION",
    "REQUIRED_MODULES",
    "PromptBuilderError",
    "PromptContext",
    "PromptModuleEmptyError",
    "PromptModuleNotFoundError",
    "SystemPromptBuilder",
    "build_system_prompt",
    "get_system_prompt_version",
]
