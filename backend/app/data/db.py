"""
Supabase data access layer.

IS_ENABLED = True when SUPABASE_URL + SUPABASE_SERVICE_KEY are set.
When False, callers fall back to the in-memory store.
"""
from datetime import datetime, timezone

from app.core.config import SUPABASE_SERVICE_KEY, SUPABASE_URL

IS_ENABLED = bool(SUPABASE_URL and SUPABASE_SERVICE_KEY)

_client_instance = None


def _client():
    # Reused across calls — creating a fresh supabase-py client per query (the
    # previous behavior) opens a new underlying httpx client with no connection
    # reuse, paying a full TCP/TLS handshake on every single db.* call.
    global _client_instance
    if _client_instance is None:
        from supabase import create_client
        _client_instance = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _client_instance


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


def get_user_profile(user_id: str, business_id: str) -> dict | None:
    return get_user_role_row(user_id, business_id)


def update_user_phone(user_id: str, business_id: str, phone: str) -> dict | None:
    rows = (
        _client()
        .table("user_business_roles")
        .update({"phone": phone})
        .eq("user_id", user_id)
        .eq("business_id", business_id)
        .execute()
        .data
    )
    return rows[0] if rows else None


def get_user_roles(user_id: str) -> list[dict]:
    """All business-role rows for a user, active or not — used to detect
    multi-tenant membership at login time."""
    return (
        _client()
        .table("user_business_roles")
        .select("*")
        .eq("user_id", user_id)
        .execute()
        .data
    )


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


def get_appointments_for_date(tenant_slug: str, date_str: str) -> list[dict]:
    """Same as get_appointments but scoped to one day — availability/slot-picking
    only ever needs that day's appointments, not the tenant's full history."""
    return (
        _client()
        .table("appointments")
        .select("*")
        .eq("tenant_slug", tenant_slug)
        .eq("date", date_str)
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


def update_appointment(apt_id: str, fields: dict) -> dict | None:
    rows = (
        _client()
        .table("appointments")
        .update(fields)
        .eq("id", apt_id)
        .execute()
        .data
    )
    return rows[0] if rows else None


def delete_appointment(tenant_slug: str, apt_id: str) -> bool:
    rows = (
        _client()
        .table("appointments")
        .delete()
        .eq("tenant_slug", tenant_slug)
        .eq("id", apt_id)
        .execute()
        .data
    )
    return bool(rows)


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


def delete_payments_for_appointment(appointment_id: str) -> None:
    """Payments FK-reference appointments without cascade, so a canceled/unpaid
    appointment's payment intent (and its cascaded events) must go first or the
    appointment delete fails with a foreign-key violation."""
    _client().table("payments").delete().eq("appointment_id", appointment_id).execute()


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
