"""Minimal HS256 JWT using stdlib only — no pyjwt / cryptography dependency."""
import base64
import hashlib
import hmac
import json
import time


class TokenExpiredError(Exception):
    pass


class InvalidTokenError(Exception):
    pass


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(s: str) -> bytes:
    pad = (4 - len(s) % 4) % 4
    return base64.urlsafe_b64decode(s + "=" * pad)


_HEADER = _b64url_encode(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())


def encode(payload: dict, secret: str) -> str:
    body = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode())
    msg = f"{_HEADER}.{body}".encode()
    sig = hmac.new(secret.encode(), msg, hashlib.sha256).digest()
    return f"{_HEADER}.{body}.{_b64url_encode(sig)}"


def decode(token: str, secret: str) -> dict:
    parts = token.split(".")
    if len(parts) != 3:
        raise InvalidTokenError("Malformed token")
    header, body, sig = parts
    msg = f"{header}.{body}".encode()
    expected = hmac.new(secret.encode(), msg, hashlib.sha256).digest()
    try:
        actual = _b64url_decode(sig)
    except Exception:
        raise InvalidTokenError("Bad signature encoding")
    if not hmac.compare_digest(expected, actual):
        raise InvalidTokenError("Signature mismatch")
    try:
        payload = json.loads(_b64url_decode(body))
    except Exception:
        raise InvalidTokenError("Bad payload encoding")
    if "exp" in payload and time.time() > payload["exp"]:
        raise TokenExpiredError("Token expired")
    return payload
