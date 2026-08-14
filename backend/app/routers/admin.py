from fastapi import APIRouter, HTTPException

from app.data import store
from app.models.schemas import (
    Appointment,
    AppointmentUpdate,
    Professional,
    ProfessionalInput,
    ProfessionalUpdate,
    Service,
    ServiceInput,
    ServiceUpdate,
    TenantConfig,
)
from app.services.booking_service import SlotUnavailableError, reschedule_appointment

router = APIRouter(prefix="/api/tenants/{slug}/admin", tags=["admin"])


def _get_tenant_or_404(slug: str) -> TenantConfig:
    tenant = store.get_tenant(slug)
    if tenant is None:
        raise HTTPException(status_code=404, detail=f"Negocio '{slug}' no encontrado")
    return tenant


# ---- Agenda (RF06) ---------------------------------------------------------

@router.get("/appointments", response_model=list[Appointment])
def list_appointments(slug: str, date: str | None = None) -> list[Appointment]:
    """Daily agenda for the business panel, optionally filtered by date."""
    _get_tenant_or_404(slug)
    appointments = store.get_appointments(slug)
    if date:
        appointments = [apt for apt in appointments if apt.date == date]
    return appointments


@router.patch("/appointments/{appointment_id}", response_model=Appointment)
def update_appointment(slug: str, appointment_id: str, update: AppointmentUpdate) -> Appointment:
    """Status change and/or reschedule (drag & drop on the resource calendar)."""
    tenant = _get_tenant_or_404(slug)
    appointment = next(
        (apt for apt in store.get_appointments(slug) if apt.id == appointment_id), None
    )
    if appointment is None:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    if update.professional_id or update.date or update.time:
        try:
            reschedule_appointment(
                tenant,
                appointment,
                update.professional_id or appointment.professional_id,
                update.date or appointment.date,
                update.time or appointment.time,
            )
        except SlotUnavailableError as exc:
            raise HTTPException(status_code=409, detail=str(exc)) from exc

    if update.status is not None:
        appointment.status = update.status

    return appointment


# ---- Service catalog CRUD --------------------------------------------------

@router.get("/services", response_model=list[Service])
def list_services(slug: str) -> list[Service]:
    return _get_tenant_or_404(slug).services


@router.post("/services", response_model=Service, status_code=201)
def create_service(slug: str, data: ServiceInput) -> Service:
    tenant = _get_tenant_or_404(slug)
    return store.add_service(tenant, data)


@router.put("/services/{service_id}", response_model=Service)
def edit_service(slug: str, service_id: str, data: ServiceUpdate) -> Service:
    tenant = _get_tenant_or_404(slug)
    service = store.update_service(tenant, service_id, data)
    if service is None:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return service


@router.delete("/services/{service_id}", status_code=204)
def remove_service(slug: str, service_id: str) -> None:
    tenant = _get_tenant_or_404(slug)
    if not store.delete_service(tenant, service_id):
        raise HTTPException(status_code=404, detail="Servicio no encontrado")


# ---- Team CRUD (RF: dar de alta/baja barberos) -----------------------------

@router.get("/professionals", response_model=list[Professional])
def list_professionals(slug: str) -> list[Professional]:
    return _get_tenant_or_404(slug).professionals


@router.post("/professionals", response_model=Professional, status_code=201)
def create_professional(slug: str, data: ProfessionalInput) -> Professional:
    tenant = _get_tenant_or_404(slug)
    return store.add_professional(tenant, data)


@router.put("/professionals/{professional_id}", response_model=Professional)
def edit_professional(slug: str, professional_id: str, data: ProfessionalUpdate) -> Professional:
    tenant = _get_tenant_or_404(slug)
    professional = store.update_professional(tenant, professional_id, data)
    if professional is None:
        raise HTTPException(status_code=404, detail="Profesional no encontrado")
    return professional


@router.delete("/professionals/{professional_id}", status_code=204)
def remove_professional(slug: str, professional_id: str) -> None:
    tenant = _get_tenant_or_404(slug)
    if not store.delete_professional(tenant, professional_id):
        raise HTTPException(status_code=404, detail="Profesional no encontrado")
