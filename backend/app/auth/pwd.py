import hashlib
import hmac
import os


def hash_password(plain: str) -> str:
    salt = os.urandom(16).hex()
    key = hashlib.pbkdf2_hmac("sha256", plain.encode(), salt.encode(), 260_000).hex()
    return f"pbkdf2:{salt}:{key}"


def verify_password(plain: str, stored: str) -> bool:
    try:
        _, salt, key = stored.split(":", 2)
    except ValueError:
        return False
    expected = hashlib.pbkdf2_hmac("sha256", plain.encode(), salt.encode(), 260_000).hex()
    return hmac.compare_digest(expected, key)
