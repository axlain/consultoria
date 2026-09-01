"""Smoke tests — catch import-time errors (missing deps, broken module
graph, syntax errors) before they reach production. Runs with
SUPABASE_URL/SUPABASE_SERVICE_KEY unset, so db.IS_ENABLED is False and
everything falls back to the in-memory store (no network calls)."""
from fastapi.testclient import TestClient


def test_imports():
    from app.auth.dependencies import create_access_token, require_role
    from app.data import db, store
    from app.payments.mock_provider import MockPaymentProvider
    from app.routers import admin_transactions, admin_users, auth, booking, payments
    from app.services.booking_service import create_appointment

    assert db is not None
    assert store is not None
    assert create_access_token is not None
    assert require_role is not None
    assert auth.router is not None
    assert booking.router is not None
    assert admin_transactions.router is not None
    assert admin_users.router is not None
    assert payments.router is not None
    assert MockPaymentProvider is not None
    assert create_appointment is not None


def test_app_creates_and_boots():
    from app.main import app
    assert app is not None

    with TestClient(app) as client:
        res = client.get("/api/health")
        assert res.status_code == 200
        assert res.json() == {"status": "ok"}


def test_tenants_loaded_at_startup():
    from app.data import store
    from app.main import app

    with TestClient(app):
        assert "levisalon-keratinas" in store.list_tenant_slugs()


def test_login_requires_valid_credentials():
    from app.main import app

    with TestClient(app) as client:
        res = client.post(
            "/api/auth/login",
            json={"email": "no-existe@example.com", "password": "wrong"},
        )
        assert res.status_code == 401
