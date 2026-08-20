from datetime import date as date_cls

from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import require_role
from app.data import db, store
from app.models.schemas import (
    Appointment,
    AppointmentUpdate,
    AppointmentValidation,
    Professional,
    ProfessionalInput,
    ProfessionalUpdate,
    Service,
    ServiceInput,
    ServiceUpdate,
    TenantConfig,
    UserProfile,
)
from app.services.booking_service import SlotUnavailableError, reschedule_appointment

router = APIRouter(prefix="/api/tenants/{slug}/admin", tags=["admin"])

_staff = require_role("employee", "host", "admin")
_managers = require_role("host", "admin")
_admin_only = require_role("admin")


def _get_tenant_or_404(slug: str) -> TenantConfig:
    tenant = store.get_tenant(slug)
    if tenant is None:
        raise HTTPException(status_code=404, detail=f"Negocio '{slug}' no encontrado")
    return tenant


def _get_appointments(slug: str) -> list[Appointment]:
    if db.IS_ENABLED:
        return [Appointment(**row) for row in db.get_appointments(slug)]
    return store.get_appointments(slug)


# ---- Agenda (RF06) ---------------------------------------------------------

@router.get("/appointments", response_model=list[Appointment])
def list_appointments(
    slug: str,
    date: str | None = None,
    _: UserProfile = Depends(_staff),
) -> list[Appointment]:
    _get_tenant_or_404(slug)
    appointments = _get_appointments(slug)
    if date:
        appointments = [apt for apt in appointments if apt.date == date]
    return appointments


@router.patch("/appointments/{appointment_id}", response_model=Appointment)
def update_appointment(
    slug: str,
    appointment_id: str,
    update: AppointmentUpdate,
    _: UserProfile = Depends(_managers),
) -> Appointment:
    tenant = _get_tenant_or_404(slug)
    appointments = _get_appointments(slug)
    appointment = next((apt for apt in appointments if apt.id == appointment_id), None)
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

    if db.IS_ENABLED:
        fields = {}
        if update.professional_id:
            fields["professional_id"] = update.professional_id
        if update.date:
            fields["date"] = update.date
        if update.time:
            fields["time"] = update.time
        if update.status is not None:
            fields["status"] = update.status
        if fields:
            db.update_appointment(appointment_id, fields)

    return appointment


@router.get("/appointments/validate/{appointment_id}", response_model=AppointmentValidation)
def validate_appointment(
    slug: str,
    appointment_id: str,
    _: UserProfile = Depends(_staff),
) -> AppointmentValidation:
    tenant = _get_tenant_or_404(slug)
    appointments = _get_appointments(slug)
    appointment = next((apt for apt in appointments if apt.id == appointment_id), None)
    if appointment is None:
        raise HTTPException(status_code=404, detail="Código QR inválido: la cita no existe.")

    if appointment.date != date_cls.today().isoformat():
        raise HTTPException(status_code=410, detail="Este código QR es de otro día.")

    if appointment.status in ("completed", "no_show"):
        raise HTTPException(status_code=410, detail="Este código QR ya fue utilizado.")

    service = next((s for s in tenant.services if s.id == appointment.service_id), None)
    professional = next(
        (p for p in tenant.professionals if p.id == appointment.professional_id), None
    )

    return AppointmentValidation(
        id=appointment.id,
        customer_name=appointment.customer_name,
        customer_last_name=appointment.customer_last_name,
        customer_phone=appointment.customer_phone,
        service_name=service.name if service else appointment.service_id,
        professional_name=professional.name if professional else appointment.professional_id,
        date=appointment.date,
        time=appointment.time,
        status=appointment.status,
    )


# ---- Service catalog CRUD --------------------------------------------------

@router.get("/services", response_model=list[Service])
def list_services(slug: str, _: UserProfile = Depends(_staff)) -> list[Service]:
    return _get_tenant_or_404(slug).services


@router.post("/services", response_model=Service, status_code=201)
def create_service(slug: str, data: ServiceInput, _: UserProfile = Depends(_managers)) -> Service:
    tenant = _get_tenant_or_404(slug)
    return store.add_service(tenant, data)


@router.put("/services/{service_id}", response_model=Service)
def edit_service(
    slug: str,
    service_id: str,
    data: ServiceUpdate,
    _: UserProfile = Depends(_managers),
) -> Service:
    tenant = _get_tenant_or_404(slug)
    service = store.update_service(tenant, service_id, data)
    if service is None:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return service


@router.delete("/services/{service_id}", status_code=204)
def remove_service(
    slug: str,
    service_id: str,
    _: UserProfile = Depends(_admin_only),
) -> None:
    tenant = _get_tenant_or_404(slug)
    if not store.delete_service(tenant, service_id):
        raise HTTPException(status_code=404, detail="Servicio no encontrado")


# ---- Team CRUD (RF: dar de alta/baja barberos) -----------------------------

@router.get("/professionals", response_model=list[Professional])
def list_professionals(slug: str, _: UserProfile = Depends(_staff)) -> list[Professional]:
    return _get_tenant_or_404(slug).professionals


@router.post("/professionals", response_model=Professional, status_code=201)
def create_professional(
    slug: str,
    data: ProfessionalInput,
    _: UserProfile = Depends(_managers),
) -> Professional:
    tenant = _get_tenant_or_404(slug)
    return store.add_professional(tenant, data)


@router.put("/professionals/{professional_id}", response_model=Professional)
def edit_professional(
    slug: str,
    professional_id: str,
    data: ProfessionalUpdate,
    _: UserProfile = Depends(_managers),
) -> Professional:
    tenant = _get_tenant_or_404(slug)
    professional = store.update_professional(tenant, professional_id, data)
    if professional is None:
        raise HTTPException(status_code=404, detail="Profesional no encontrado")
    return professional


@router.delete("/professionals/{professional_id}", status_code=204)
def remove_professional(
    slug: str,
    professional_id: str,
    _: UserProfile = Depends(_admin_only),
) -> None:
    tenant = _get_tenant_or_404(slug)
    if not store.delete_professional(tenant, professional_id):
        raise HTTPException(status_code=404, detail="Profesional no encontrado")
