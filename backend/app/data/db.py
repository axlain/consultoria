"""
Supabase data access layer.

IS_ENABLED = True when SUPABASE_URL + SUPABASE_SERVICE_KEY are set.
When False, callers fall back to the in-memory store.
"""
import uuid
from datetime import datetime, timezone

from app.core.config import SUPABASE_SERVICE_KEY, SUPABASE_URL

IS_ENABLED = bool(SUPABASE_URL and SUPABASE_SERVICE_KEY)


def _client():
    from supabase import create_client
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Users / roles
# ---------------------------------------------------------------------------

def get_user_role_row(user_id: str, business_id: str) -> dict | None:
    rows = (
        _client()
        .table("user_business_roles")
        .select("*")
        .eq("user_id", user_id)
        .eq("business_id", business_id)
        .execute()
        .data
    )
    return rows[0] if rows else None


def upsert_user_role(user_id: str, email: str, name: str, role: str, business_id: str) -> dict:
    return (
        _client()
        .table("user_business_roles")
        .upsert(
            {
                "user_id": user_id,
                "email": email,
                "name": name,
                "role": role,
                "business_id": business_id,
                "is_active": True,
            },
            on_conflict="user_id,business_id",
        )
        .execute()
        .data[0]
    )


def list_users_for_business(business_id: str) -> list[dict]:
    return (
        _client()
        .table("user_business_roles")
        .select("*")
        .eq("business_id", business_id)
        .order("created_at")
        .execute()
        .data
    )


def update_user_role(user_id: str, business_id: str, role: str) -> dict | None:
    rows = (
        _client()
        .table("user_business_roles")
        .update({"role": role})
        .eq("user_id", user_id)
        .eq("business_id", business_id)
        .execute()
        .data
    )
    return rows[0] if rows else None


def deactivate_user(user_id: str, business_id: str) -> dict | None:
    rows = (
        _client()
        .table("user_business_roles")
        .update({"is_active": False})
        .eq("user_id", user_id)
        .eq("business_id", business_id)
        .execute()
        .data
    )
    return rows[0] if rows else None


# ---------------------------------------------------------------------------
# Appointments
# ---------------------------------------------------------------------------

def get_appointments(tenant_slug: str) -> list[dict]:
    return (
        _client()
        .table("appointments")
        .select("*")
        .eq("tenant_slug", tenant_slug)
        .execute()
        .data
    )


def get_appointment(tenant_slug: str, apt_id: str) -> dict | None:
    rows = (
        _client()
        .table("appointments")
        .select("*")
        .eq("tenant_slug", tenant_slug)
        .eq("id", apt_id)
        .execute()
        .data
    )
    return rows[0] if rows else None


def insert_appointment(row: dict) -> dict:
    return _client().table("appointments").insert(row).execute().data[0]


def get_user_appointments(user_id: str, tenant_slug: str) -> list[dict]:
    return (
        _client()
        .table("appointments")
        .select("*")
        .eq("tenant_slug", tenant_slug)
        .eq("client_user_id", user_id)
        .order("date", desc=True)
        .execute()
        .data
    )


# ---------------------------------------------------------------------------
# Payments
# ---------------------------------------------------------------------------

def insert_payment(row: dict) -> dict:
    return _client().table("payments").insert(row).execute().data[0]


def get_payment(payment_id: str) -> dict | None:
    rows = (
        _client()
        .table("payments")
        .select("*")
        .eq("id", payment_id)
        .execute()
        .data
    )
    return rows[0] if rows else None


def update_payment_status(payment_id: str, status: str) -> None:
    _client().table("payments").update({"status": status, "updated_at": _now_iso()}).eq("id", payment_id).execute()


def get_payments_for_business(business_id: str) -> list[dict]:
    return (
        _client()
        .table("payments")
        .select("*")
        .eq("business_id", business_id)
        .execute()
        .data
    )


def insert_payment_event(row: dict) -> dict:
    return _client().table("payment_events").insert(row).execute().data[0]


def get_payment_events(payment_id: str) -> list[dict]:
    return (
        _client()
        .table("payment_events")
        .select("*")
        .eq("payment_id", payment_id)
        .order("created_at")
        .execute()
        .data
    )
