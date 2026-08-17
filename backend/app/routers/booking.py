from fastapi import APIRouter, Depends, HTTPException

from app.core.rate_limit import enforce_booking_rate_limit
from app.data import store
from app.models.schemas import Appointment, BookingRequest, DayAvailability, Professional, TenantConfig
from app.services.booking_service import (
    SlotUnavailableError,
    create_appointment,
    get_day_slots,
    get_professionals_available_at,
)

router = APIRouter(prefix="/api/tenants/{slug}", tags=["booking"])


def _get_tenant_or_404(slug: str) -> TenantConfig:
    tenant = store.get_tenant(slug)
    if tenant is None:
        raise HTTPException(status_code=404, detail=f"Negocio '{slug}' no encontrado")
    return tenant


@router.get("/availability", response_model=DayAvailability)
def get_availability(
    slug: str, date: str, service_id: str | None = None, professional_id: str | None = None
) -> dict:
    """Full grid of the day's slots, each tagged available/unavailable — used both by
    the wizard's datetime step (service_id) and the public availability calendar
    (professional_id or neither)."""
    tenant = _get_tenant_or_404(slug)
    return get_day_slots(tenant, date, service_id=service_id, professional_id=professional_id)


@router.get("/available-professionals", response_model=list[Professional])
def available_professionals(slug: str, service_id: str, date: str, time: str) -> list[Professional]:
    tenant = _get_tenant_or_404(slug)
    return get_professionals_available_at(tenant, service_id, date, time)


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
