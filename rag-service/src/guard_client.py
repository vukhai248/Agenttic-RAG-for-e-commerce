"""A4 extension points; Phase B supplies the actual FOX guard implementation."""
import os


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
