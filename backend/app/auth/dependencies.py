import time

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth import jwt_hs256
from app.core.config import JWT_EXPIRE_MINUTES, JWT_SECRET
from app.models.schemas import UserProfile, UserRole

_bearer = HTTPBearer(auto_error=True)


def create_access_token(user: UserProfile) -> str:
    payload = {
        "sub": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "business_id": user.business_id,
        "exp": int(time.time()) + JWT_EXPIRE_MINUTES * 60,
    }
    return jwt_hs256.encode(payload, JWT_SECRET)


def _decode_token(token: str) -> dict:
    try:
        return jwt_hs256.decode(token, JWT_SECRET)
    except jwt_hs256.TokenExpiredError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expirado") from exc
    except jwt_hs256.InvalidTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido") from exc


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> UserProfile:
    payload = _decode_token(credentials.credentials)
    # Trust the JWT claims — role and business_id are embedded at login time.
    # This avoids a DB round-trip on every request. Tokens expire in 8 h.
    return UserProfile(
        id=payload["sub"],
        email=payload.get("email", ""),
        name=payload.get("name", ""),
        role=payload["role"],
        business_id=payload["business_id"],
        created_at="",
    )


def require_role(*allowed: UserRole):
    """FastAPI dependency factory — raises 403 if the token's role is not in allowed."""
    def _guard(current_user: UserProfile = Depends(get_current_user)) -> UserProfile:
        if current_user.role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
        return current_user
    return _guard
