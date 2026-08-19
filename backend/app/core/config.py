import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR.parent / ".env")
TENANTS_DIR = BASE_DIR / "data" / "tenants"

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# RNF02: max appointment-creation requests per IP within the window.
BOOKING_RATE_LIMIT_MAX_REQUESTS = 100
BOOKING_RATE_LIMIT_WINDOW_SECONDS = 60

# Auth — override via environment variable in production.
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 8  # 8 hours

# Supabase — set these in .env to enable persistent storage.
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

# Where the frontend runs — used to build redirect links for Supabase emails
# (invite, magic link). Override in production.
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")
