import time
from collections import defaultdict

from fastapi import HTTPException, Request, status

from app.core.config import (
    BOOKING_RATE_LIMIT_MAX_REQUESTS,
    BOOKING_RATE_LIMIT_WINDOW_SECONDS,
)

# ip -> list of request timestamps (epoch seconds) within the current window.
_request_log: dict[str, list[float]] = defaultdict(list)


def enforce_booking_rate_limit(request: Request) -> None:
    """RNF02: cap appointment-creation requests per IP within a rolling window."""
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    window_start = now - BOOKING_RATE_LIMIT_WINDOW_SECONDS

    recent = [ts for ts in _request_log[client_ip] if ts > window_start]
    if len(recent) >= BOOKING_RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiadas solicitudes de reserva. Intenta de nuevo en unos minutos.",
        )

    recent.append(now)
    _request_log[client_ip] = recent
