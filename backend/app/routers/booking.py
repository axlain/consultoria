from fastapi import APIRouter, Depends, HTTPException

from app.core.rate_limit import enforce_booking_rate_limit
from app.data import store
from app.models.schemas import Appointment, BookingRequest, TenantConfig
from app.services.booking_service import (
    SlotUnavailableError,
    create_appointment,
    get_available_slots,
)

router = APIRouter(prefix="/api/tenants/{slug}", tags=["booking"])


def _get_tenant_or_404(slug: str) -> TenantConfig:
    tenant = store.get_tenant(slug)
    if tenant is None:
        raise HTTPException(status_code=404, detail=f"Negocio '{slug}' no encontrado")
    return tenant


@router.get("/availability", response_model=list[str])
def get_availability(slug: str, professional_id: str, date: str) -> list[str]:
    tenant = _get_tenant_or_404(slug)
    return get_available_slots(tenant, professional_id, date)


@router.post(
    "/appointments",
    response_model=Appointment,
    dependencies=[Depends(enforce_booking_rate_limit)],
)
def book_appointment(slug: str, booking: BookingRequest) -> Appointment:
    tenant = _get_tenant_or_404(slug)
    try:
        return create_appointment(tenant, booking)
    except SlotUnavailableError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
