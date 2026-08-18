from datetime import datetime, timedelta, timezone
from typing import Literal

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import JWT_ALGORITHM, JWT_EXPIRE_MINUTES, JWT_SECRET
from app.data import store
from app.models.schemas import UserProfile, UserRole

_bearer = HTTPBearer(auto_error=True)


def create_access_token(user: UserProfile) -> str:
    payload = {
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "business_id": user.business_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> UserProfile:
    payload = _decode_token(credentials.credentials)
    user = store.get_user_by_id(payload["sub"])
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado")
    return user


def require_role(*allowed: UserRole):
    """FastAPI dependency factory — raises 403 if the token's role is not in allowed."""
    def _guard(current_user: UserProfile = Depends(get_current_user)) -> UserProfile:
        if current_user.role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
        return current_user
    return _guard
