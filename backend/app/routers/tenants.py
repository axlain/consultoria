from fastapi import APIRouter, HTTPException

from app.data import store
from app.models.schemas import TenantConfig

router = APIRouter(prefix="/api/tenants", tags=["tenants"])


@router.get("/{slug}", response_model=TenantConfig)
def get_tenant_config(slug: str) -> TenantConfig:
    """RF01/RF02: the frontend resolves the tenant from the URL slug and fetches this config."""
    tenant = store.get_tenant(slug)
    if tenant is None:
        raise HTTPException(status_code=404, detail=f"Negocio '{slug}' no encontrado")
    return tenant
