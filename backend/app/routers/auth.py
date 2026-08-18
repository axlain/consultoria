import secrets
import string

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import create_access_token, require_role
from app.auth.pwd import hash_password, verify_password
from app.data import store
from app.models.schemas import (
    InviteUserRequest,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserPublic,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(body: RegisterRequest):
    if store.get_user_by_email(body.email):
        raise HTTPException(status_code=409, detail="El email ya está registrado")
    user = store.create_user(body.email, body.name, "client", body.business_id, hash_password(body.password))
    return TokenResponse(access_token=create_access_token(user), user=UserPublic(**user.model_dump()))


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    user = store.get_user_by_email(body.email)
    stored = store.get_password_hash(user.id) if user else None
    if not user or not user.is_active or not stored or not verify_password(body.password, stored):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    return TokenResponse(access_token=create_access_token(user), user=UserPublic(**user.model_dump()))


@router.post("/invite", status_code=201)
def invite_user(
    body: InviteUserRequest,
    _current_user=Depends(require_role("admin")),
):
    if store.get_user_by_email(body.email):
        raise HTTPException(status_code=409, detail="El email ya está registrado")
    temp_pwd = "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(16))
    store.create_user(body.email, body.name, body.role, body.business_id, hash_password(temp_pwd))
    # Phase 2: send invite email instead of returning temp password.
    return {"message": "Usuario creado", "temp_password": temp_pwd}
