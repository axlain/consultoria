import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth.dependencies import get_current_user
from app.data import db, store
from app.models.schemas import UserProfile

router = APIRouter(prefix="/api/me", tags=["me"])

_PHONE_RE = re.compile(r"^\d{10}$")


class ProfileResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    business_id: str
    phone: str | None = None


class UpdateProfileRequest(BaseModel):
    phone: str | None = None


@router.get("/profile", response_model=ProfileResponse)
def get_profile(current_user: UserProfile = Depends(get_current_user)) -> ProfileResponse:
    phone = None
    if db.IS_ENABLED:
        row = db.get_user_profile(current_user.id, current_user.business_id)
        phone = row.get("phone") if row else None
    return ProfileResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role,
        business_id=current_user.business_id,
        phone=phone,
    )


@router.patch("/profile", response_model=ProfileResponse)
def update_profile(
    body: UpdateProfileRequest,
    current_user: UserProfile = Depends(get_current_user),
) -> ProfileResponse:
    if body.phone is not None and not _PHONE_RE.match(body.phone):
        raise HTTPException(status_code=422, detail="El teléfono debe tener exactamente 10 dígitos.")

    phone = body.phone
    if db.IS_ENABLED and body.phone is not None:
        db.update_user_phone(current_user.id, current_user.business_id, body.phone)

    return ProfileResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role,
        business_id=current_user.business_id,
        phone=phone,
    )
