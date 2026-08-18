from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import require_role
from app.data import db, store
from app.models.schemas import UpdateUserRoleRequest, UserProfile, UserPublic

router = APIRouter(prefix="/api/admin/users", tags=["admin-users"])

_admin_only = require_role("admin")


def _row_to_public(row: dict) -> UserPublic:
    return UserPublic(
        id=row["user_id"],
        email=row.get("email", ""),
        name=row.get("name", ""),
        role=row["role"],
        business_id=row["business_id"],
    )


@router.get("", response_model=list[UserPublic])
def list_users(current_user: UserProfile = Depends(_admin_only)):
    if db.IS_ENABLED:
        rows = db.list_users_for_business(current_user.business_id)
        return [_row_to_public(r) for r in rows]
    return [UserPublic(**u.model_dump()) for u in store.list_users(current_user.business_id)]


@router.patch("/{user_id}/role", response_model=UserPublic)
def update_role(
    user_id: str,
    body: UpdateUserRoleRequest,
    current_user: UserProfile = Depends(_admin_only),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes cambiar tu propio rol")

    if db.IS_ENABLED:
        row = db.update_user_role(user_id, current_user.business_id, body.role)
        if not row:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return _row_to_public(row)
    else:
        updated = store.update_user_role(user_id, body.role)
        if not updated:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return UserPublic(**updated.model_dump())


@router.patch("/{user_id}/deactivate", response_model=UserPublic)
def deactivate(user_id: str, current_user: UserProfile = Depends(_admin_only)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes desactivarte a ti mismo")

    if db.IS_ENABLED:
        row = db.deactivate_user(user_id, current_user.business_id)
        if not row:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return _row_to_public(row)
    else:
        updated = store.deactivate_user(user_id)
        if not updated:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return UserPublic(**updated.model_dump())
