import time

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth import jwt_hs256
from app.core.config import JWT_EXPIRE_MINUTES, JWT_SECRET
from app.data import store
from app.models.schemas import UserProfile, UserRole

_bearer = HTTPBearer(auto_error=True)


def create_access_token(user: UserProfile) -> str:
    payload = {
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "business_id": user.business_id,
        "exp": int(time.time()) + JWT_EXPIRE_MINUTES * 60,
    }
    return jwt_hs256.encode(payload, JWT_SECRET)


def _decode_token(token: str) -> dict:
    try:
        return jwt_hs256.decode(token, JWT_SECRET)
    except jwt_hs256.TokenExpiredError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expirado")
    except jwt_hs256.InvalidTokenError:
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
