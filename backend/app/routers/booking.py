import time as _time

from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth import jwt_hs256
from app.auth.dependencies import get_current_user
from app.core.config import JWT_SECRET
from app.core.rate_limit import enforce_booking_rate_limit
from app.data import db, store
from app.models.schemas import Appointment, BookingRequest, DayAvailability, Professional, TenantConfig, UserProfile
from app.services.booking_service import (
    SlotUnavailableError,
    create_appointment,
    get_day_slots,
    get_professionals_available_at,
)

_QR_TTL_HOURS = 48

router = APIRouter(prefix="/api/tenants/{slug}", tags=["booking"])


def _get_tenant_or_404(slug: str) -> TenantConfig:
    tenant = store.get_tenant(slug)
    if tenant is None:
        raise HTTPException(status_code=404, detail=f"Negocio '{slug}' no encontrado")
    return tenant


def _get_appointments_for_tenant(slug: str) -> list[Appointment]:
    if db.IS_ENABLED:
        return [Appointment(**row) for row in db.get_appointments(slug)]
    return store.get_appointments(slug)


@router.get("/availability", response_model=DayAvailability)
def get_availability(
    slug: str, date: str, service_id: str | None = None, professional_id: str | None = None
) -> dict:
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


@router.get("/appointments/{apt_id}", response_model=Appointment)
def get_appointment(slug: str, apt_id: str) -> Appointment:
    _get_tenant_or_404(slug)
    if db.IS_ENABLED:
        row = db.get_appointment(slug, apt_id)
        if row:
            return Appointment(**row)
    else:
        for apt in store.get_appointments(slug):
            if apt.id == apt_id:
                return apt
    raise HTTPException(status_code=404, detail="Cita no encontrada")


@router.get("/my-appointments", response_model=list[Appointment])
def my_appointments(
    slug: str,
    current_user: UserProfile = Depends(get_current_user),
) -> list[Appointment]:
    """Return appointments linked to the authenticated user in this tenant."""
    _get_tenant_or_404(slug)
    if db.IS_ENABLED:
        rows = db.get_user_appointments(current_user.id, slug)
        return [Appointment(**r) for r in rows]
    # Fallback: filter in-memory
    return [
        apt for apt in store.get_appointments(slug)
        if apt.client_user_id == current_user.id
    ]


@router.get("/appointments/{apt_id}/qr")
def appointment_qr(slug: str, apt_id: str, base_url: str = Query(default="http://localhost:5173")):
    _get_tenant_or_404(slug)
    found = False
    if db.IS_ENABLED:
        found = db.get_appointment(slug, apt_id) is not None
    else:
        found = any(a.id == apt_id for a in store.get_appointments(slug))
    if not found:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    exp = int(_time.time()) + _QR_TTL_HOURS * 3600
    token = jwt_hs256.encode({"appointmentId": apt_id, "slug": slug, "exp": exp}, JWT_SECRET)
    url = f"{base_url}/demo/{slug}/cita/{apt_id}?t={token}"
    return {"url": url, "token": token, "expires_in_hours": _QR_TTL_HOURS}


@router.get("/appointments/{apt_id}/validate-qr")
def validate_qr(slug: str, apt_id: str, t: str = Query(...)):
    try:
        payload = jwt_hs256.decode(t, JWT_SECRET)
    except jwt_hs256.TokenExpiredError as exc:
        raise HTTPException(status_code=410, detail="QR expirado") from exc
    except jwt_hs256.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="QR inválido") from exc

    if payload.get("appointmentId") != apt_id or payload.get("slug") != slug:
        raise HTTPException(status_code=401, detail="QR no corresponde a esta cita")

    tenant = _get_tenant_or_404(slug)

    apt = None
    if db.IS_ENABLED:
        row = db.get_appointment(slug, apt_id)
        if row:
            apt = Appointment(**row)
    else:
        for a in store.get_appointments(slug):
            if a.id == apt_id:
                apt = a
                break

    if apt is None:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    service = next((s for s in tenant.services if s.id == apt.service_id), None)
    professional = next((p for p in tenant.professionals if p.id == apt.professional_id), None)
    return {
        **apt.model_dump(),
        "service_name": service.name if service else apt.service_id,
        "professional_name": professional.name if professional else apt.professional_id,
        "business_name": tenant.business.name,
    }
