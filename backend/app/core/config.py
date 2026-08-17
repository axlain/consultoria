from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
TENANTS_DIR = BASE_DIR / "data" / "tenants"

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# RNF02: max appointment-creation requests per IP within the window.
BOOKING_RATE_LIMIT_MAX_REQUESTS = 100
BOOKING_RATE_LIMIT_WINDOW_SECONDS = 60
