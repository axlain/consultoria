import json
import re

from app.core.config import TENANTS_DIR
from app.models.schemas import (
    Appointment,
    Professional,
    ProfessionalInput,
    ProfessionalUpdate,
    Service,
    ServiceInput,
    ServiceUpdate,
    TenantConfig,
)

_tenants: dict[str, TenantConfig] = {}
_appointments: dict[str, list[Appointment]] = {}
_next_appointment_id = 1


def load_tenants() -> None:
    """RF08: tenants are loaded from static JSON files, not a registration flow."""
    _tenants.clear()
    for json_file in TENANTS_DIR.glob("*.json"):
        data = json.loads(json_file.read_text(encoding="utf-8"))
        tenant = TenantConfig(**data)
        _tenants[tenant.slug] = tenant
        _appointments.setdefault(tenant.slug, [])


def get_tenant(slug: str) -> TenantConfig | None:
    return _tenants.get(slug)


def list_tenant_slugs() -> list[str]:
    return list(_tenants.keys())


def get_appointments(tenant_slug: str) -> list[Appointment]:
    return _appointments.setdefault(tenant_slug, [])


def add_appointment(tenant_slug: str, appointment: Appointment) -> None:
    _appointments.setdefault(tenant_slug, []).append(appointment)


def next_appointment_id() -> str:
    global _next_appointment_id
    appointment_id = f"apt-{_next_appointment_id}"
    _next_appointment_id += 1
    return appointment_id


def _slugify(name: str, existing_ids: set[str]) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.strip().lower()).strip("-") or "item"
    slug = base
    suffix = 2
    while slug in existing_ids:
        slug = f"{base}-{suffix}"
        suffix += 1
    return slug


# ---- Services (catalog CRUD) --------------------------------------------

def add_service(tenant: TenantConfig, data: ServiceInput) -> Service:
    service_id = _slugify(data.name, {s.id for s in tenant.services})
    service = Service(id=service_id, **data.model_dump())
    tenant.services.append(service)
    return service


def update_service(tenant: TenantConfig, service_id: str, data: ServiceUpdate) -> Service | None:
    for index, service in enumerate(tenant.services):
        if service.id == service_id:
            updated = service.model_copy(update=data.model_dump(exclude_unset=True))
            tenant.services[index] = updated
            return updated
    return None


def delete_service(tenant: TenantConfig, service_id: str) -> bool:
    before = len(tenant.services)
    tenant.services[:] = [s for s in tenant.services if s.id != service_id]
    return len(tenant.services) < before


# ---- Professionals (team CRUD) -------------------------------------------

def add_professional(tenant: TenantConfig, data: ProfessionalInput) -> Professional:
    professional_id = _slugify(data.name, {p.id for p in tenant.professionals})
    professional = Professional(id=professional_id, **data.model_dump())
    tenant.professionals.append(professional)
    return professional


def update_professional(
    tenant: TenantConfig, professional_id: str, data: ProfessionalUpdate
) -> Professional | None:
    for index, professional in enumerate(tenant.professionals):
        if professional.id == professional_id:
            updated = professional.model_copy(update=data.model_dump(exclude_unset=True))
            tenant.professionals[index] = updated
            return updated
    return None


def delete_professional(tenant: TenantConfig, professional_id: str) -> bool:
    before = len(tenant.professionals)
    tenant.professionals[:] = [p for p in tenant.professionals if p.id != professional_id]
    return len(tenant.professionals) < before
