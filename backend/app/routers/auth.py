import secrets
import string
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import create_access_token, require_role
from app.auth.pwd import hash_password, verify_password
from app.data import db, store
from app.models.schemas import (
    InviteUserRequest,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserProfile,
    UserPublic,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _supa():
    from supabase import create_client
    from app.core.config import SUPABASE_URL, SUPABASE_SERVICE_KEY
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


# ---------------------------------------------------------------------------
# Register
# ---------------------------------------------------------------------------

@router.post("/register", response_model=TokenResponse, status_code=201)
def register(body: RegisterRequest):
    if db.IS_ENABLED:
        try:
            res = _supa().auth.admin.create_user(
                {
                    "email": body.email,
                    "password": body.password,
                    "user_metadata": {"name": body.name, "business_id": body.business_id},
                    "email_confirm": True,
                }
            )
        except Exception as exc:
            msg = str(exc).lower()
            if "already" in msg or "unique" in msg or "duplicate" in msg:
                raise HTTPException(status_code=409, detail="El email ya está registrado")
            raise HTTPException(status_code=400, detail=str(exc))

        user_id = str(res.user.id)
        db.upsert_user_role(user_id, body.email, body.name, "client", body.business_id)
        user = UserProfile(
            id=user_id, email=body.email, name=body.name,
            role="client", business_id=body.business_id, created_at=_now_iso(),
        )
    else:
        if store.get_user_by_email(body.email):
            raise HTTPException(status_code=409, detail="El email ya está registrado")
        user = store.create_user(body.email, body.name, "client", body.business_id, hash_password(body.password))

    return TokenResponse(access_token=create_access_token(user), user=UserPublic(**user.model_dump()))


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    if db.IS_ENABLED:
        try:
            res = _supa().auth.sign_in_with_password({"email": body.email, "password": body.password})
        except Exception:
            raise HTTPException(status_code=401, detail="Credenciales inválidas")

        user_id = str(res.user.id)
        # business_id not in login body — default to first active business
        role_rows = (
            _supa()
            .table("user_business_roles")
            .select("*")
            .eq("user_id", user_id)
            .eq("is_active", True)
            .limit(1)
            .execute()
            .data
        )
        if not role_rows:
            raise HTTPException(status_code=401, detail="Sin acceso a ningún negocio")
        row = role_rows[0]
        user = UserProfile(
            id=user_id,
            email=res.user.email or body.email,
            name=row.get("name", ""),
            role=row["role"],
            business_id=row["business_id"],
            created_at=str(res.user.created_at or _now_iso()),
        )
    else:
        user = store.get_user_by_email(body.email)
        stored = store.get_password_hash(user.id) if user else None
        if not user or not user.is_active or not stored or not verify_password(body.password, stored):
            raise HTTPException(status_code=401, detail="Credenciales inválidas")

    return TokenResponse(access_token=create_access_token(user), user=UserPublic(**user.model_dump()))


# ---------------------------------------------------------------------------
# Invite (admin only)
# ---------------------------------------------------------------------------

@router.post("/invite", status_code=201)
def invite_user(
    body: InviteUserRequest,
    _current_user=Depends(require_role("admin")),
):
    temp_pwd = "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(16))

    if db.IS_ENABLED:
        try:
            res = _supa().auth.admin.create_user(
                {
                    "email": body.email,
                    "password": temp_pwd,
                    "user_metadata": {"name": body.name, "business_id": body.business_id},
                    "email_confirm": True,
                }
            )
        except Exception as exc:
            msg = str(exc).lower()
            if "already" in msg or "unique" in msg or "duplicate" in msg:
                raise HTTPException(status_code=409, detail="El email ya está registrado")
            raise HTTPException(status_code=400, detail=str(exc))

        user_id = str(res.user.id)
        db.upsert_user_role(user_id, body.email, body.name, body.role, body.business_id)
    else:
        if store.get_user_by_email(body.email):
            raise HTTPException(status_code=409, detail="El email ya está registrado")
        store.create_user(body.email, body.name, body.role, body.business_id, hash_password(temp_pwd))

    return {"message": "Usuario creado", "temp_password": temp_pwd}
