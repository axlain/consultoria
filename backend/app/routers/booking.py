import time as _time
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth import jwt_hs256
from app.core.config import JWT_SECRET
from app.core.rate_limit import enforce_booking_rate_limit
from app.data import store
from app.models.schemas import Appointment, BookingRequest, DayAvailability, Professional, TenantConfig
from app.services.booking_service import (
    SlotUnavailableError,
    create_appointment,
    get_day_slots,
    get_professionals_available_at,
)

# QR tokens expire 24 h after the appointment date (gives day-of slack).
_QR_TTL_HOURS = 48

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


@router.get("/appointments/{apt_id}")
def get_appointment(slug: str, apt_id: str) -> Appointment:
    """Return a single appointment by ID (used by the cita-view page)."""
    tenant = _get_tenant_or_404(slug)
    for apt in store.get_appointments(slug):
        if apt.id == apt_id:
            return apt
    raise HTTPException(status_code=404, detail="Cita no encontrada")


@router.get("/appointments/{apt_id}/qr")
def appointment_qr(slug: str, apt_id: str, base_url: str = Query(default="http://localhost:5173")):
    """
    Generate a JWT-signed QR URL for the appointment.
    Implements the same contract as @consultoria/qr generateAppointmentQr().
    The token is signed with HMAC-SHA256 and expires in QR_TTL_HOURS hours.
    """
    _get_tenant_or_404(slug)
    # Verify the appointment exists.
    appointments = store.get_appointments(slug)
    if not any(a.id == apt_id for a in appointments):
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    exp = int(_time.time()) + _QR_TTL_HOURS * 3600
    token = jwt_hs256.encode({"appointmentId": apt_id, "slug": slug, "exp": exp}, JWT_SECRET)
    url = f"{base_url}/demo/{slug}/cita/{apt_id}?t={token}"
    return {"url": url, "token": token, "expires_in_hours": _QR_TTL_HOURS}


@router.get("/appointments/{apt_id}/validate-qr")
def validate_qr(slug: str, apt_id: str, t: str = Query(...)):
    """
    Validate a QR token and return appointment details.
    Equivalent to @consultoria/qr validateQrToken() + DB lookup.
    """
    try:
        payload = jwt_hs256.decode(t, JWT_SECRET)
    except jwt_hs256.TokenExpiredError:
        raise HTTPException(status_code=410, detail="QR expirado")
    except jwt_hs256.InvalidTokenError:
        raise HTTPException(status_code=401, detail="QR inválido")

    if payload.get("appointmentId") != apt_id or payload.get("slug") != slug:
        raise HTTPException(status_code=401, detail="QR no corresponde a esta cita")

    tenant = _get_tenant_or_404(slug)
    for apt in store.get_appointments(slug):
        if apt.id == apt_id:
            service = next((s for s in tenant.services if s.id == apt.service_id), None)
            professional = next((p for p in tenant.professionals if p.id == apt.professional_id), None)
            return {
                **apt.model_dump(),
                "service_name": service.name if service else apt.service_id,
                "professional_name": professional.name if professional else apt.professional_id,
                "business_name": tenant.business.name,
            }
    raise HTTPException(status_code=404, detail="Cita no encontrada")
