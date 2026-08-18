from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import require_role
from app.data import store
from app.models.schemas import UpdateUserRoleRequest, UserProfile, UserPublic

router = APIRouter(prefix="/api/admin/users", tags=["admin-users"])

_admin_only = require_role("admin")


@router.get("", response_model=list[UserPublic])
def list_users(current_user: UserProfile = Depends(_admin_only)):
    return [UserPublic(**u.model_dump()) for u in store.list_users(current_user.business_id)]


@router.patch("/{user_id}/role", response_model=UserPublic)
def update_role(
    user_id: str,
    body: UpdateUserRoleRequest,
    current_user: UserProfile = Depends(_admin_only),
):
    # Prevent self-demotion.
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes cambiar tu propio rol")
    updated = store.update_user_role(user_id, body.role)
    if not updated:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return UserPublic(**updated.model_dump())


@router.patch("/{user_id}/deactivate", response_model=UserPublic)
def deactivate(user_id: str, current_user: UserProfile = Depends(_admin_only)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes desactivarte a ti mismo")
    updated = store.deactivate_user(user_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return UserPublic(**updated.model_dump())
