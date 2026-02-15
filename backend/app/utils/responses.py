"""Consistent { data, error, meta } response envelope helpers."""

from typing import Any


def success_response(
    data: Any, meta: dict[str, Any] | None = None
) -> dict[str, Any]:
    """Return a success envelope."""
    return {"data": data, "error": None, "meta": meta}


def error_response(
    code: str, message: str, details: list[dict[str, str]] | None = None
) -> dict[str, Any]:
    """Return an error envelope."""
    return {
        "data": None,
        "error": {
            "code": code,
            "message": message,
            "details": details or [],
        },
        "meta": None,
    }
