"""
Crea los 4 usuarios de prueba en Supabase Auth y los inserta en user_business_roles.

Uso:
    cd backend
    source .venv/bin/activate
    python scripts/create_test_users.py

Requiere SUPABASE_URL y SUPABASE_SERVICE_KEY en backend/.env
"""
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("ERROR: Falta SUPABASE_URL o SUPABASE_SERVICE_KEY en .env")
    sys.exit(1)

from supabase import create_client

sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

BUSINESS_ID = "barberia"
TEST_PASSWORD = "Test1234!"  # cámbiala después de la primera prueba

USERS = [
    {"email": "client@test.local",   "name": "Cliente Test",   "role": "client"},
    {"email": "employee@test.local",  "name": "Empleado Test",  "role": "employee"},
    {"email": "host@test.local",      "name": "Host Test",      "role": "host"},
    {"email": "admin@test.local",     "name": "Admin Test",     "role": "admin"},
]

for u in USERS:
    print(f"Creando {u['role']}: {u['email']} ...", end=" ", flush=True)
    try:
        res = sb.auth.admin.create_user({
            "email": u["email"],
            "password": TEST_PASSWORD,
            "email_confirm": True,
            "user_metadata": {"name": u["name"]},
        })
        user_id = res.user.id
        sb.table("user_business_roles").upsert(
            {
                "user_id": user_id,
                "email": u["email"],
                "name": u["name"],
                "role": u["role"],
                "business_id": BUSINESS_ID,
                "is_active": True,
            },
            on_conflict="user_id,business_id",
        ).execute()
        print(f"OK  ({user_id})")
    except Exception as exc:
        print(f"ERROR: {exc}")

print("\nListo. Usa la contraseña:", TEST_PASSWORD)
