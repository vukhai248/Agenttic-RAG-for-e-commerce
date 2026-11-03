"""A4 extension points; Phase B supplies the actual FOX guard implementation."""
import os
from dataclasses import dataclass, field


def build_context(**values):
    return {**values, "mode": os.getenv("FOX_GUARD_MODE", "off").lower(),
            "arm": os.getenv("FOX_GUARD_ARM", "")}


def _passthrough(value):
    mode = os.getenv("FOX_GUARD_MODE", "off").lower()
    if mode != "off":
        raise NotImplementedError("FOX guard enabled modes require the Phase B implementation")
    return value


def guard_input(text, ctx):
    return _passthrough(text)


def guard_context(segment, ctx):
    return _passthrough(segment)


def guard_output(text, ctx):
    return _passthrough(text)


@dataclass
class LogText:
    message: str
    decision_ids: list[str] = field(default_factory=list)


def guard_log(text, ctx) -> LogText:
    """B must supply irreversible audit masking here, separately from restored output.

    Never substitute Decision.text or restored customer-facing PII for audit text.
    Off intentionally retains the baseline text; enabled modes fail closed until B.
    """
    mode = os.getenv("FOX_GUARD_MODE", "off").lower()
    if mode != "off":
        raise NotImplementedError("FOX log redaction requires the Phase B implementation")
    return LogText(text)
