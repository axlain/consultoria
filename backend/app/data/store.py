import json
import re
import uuid
from datetime import datetime, timezone

from app.core.config import TENANTS_DIR
from app.models.schemas import (
    Appointment,
    Payment,
    PaymentEvent,
    Professional,
    ProfessionalInput,
    ProfessionalUpdate,
    Service,
    ServiceInput,
    ServiceUpdate,
    TenantConfig,
    UserProfile,
)

_tenants: dict[str, TenantConfig] = {}
_appointments: dict[str, list[Appointment]] = {}
_next_appointment_id = 1

_payments: dict[str, Payment] = {}
_payment_events: list[PaymentEvent] = []

# Keyed by email for fast lookup on login.
_users: dict[str, UserProfile] = {}
# Keyed by user_id for hash storage.
_password_hashes: dict[str, str] = {}


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


# ---- Payments (Fase 1 — mock) -------------------------------------------

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def create_payment(
    appointment_id: str,
    business_id: str,
    amount_cents: int,
    currency: str,
) -> Payment:
    payment = Payment(
        id=str(uuid.uuid4()),
        appointment_id=appointment_id,
        business_id=business_id,
        amount_cents=amount_cents,
        currency=currency,
        status="pending",
        provider="mock",
        created_at=_now_iso(),
        updated_at=_now_iso(),
    )
    _payments[payment.id] = payment
    return payment


def get_payment(payment_id: str) -> Payment | None:
    return _payments.get(payment_id)


def update_payment_status(payment_id: str, status: str) -> None:
    payment = _payments.get(payment_id)
    if payment:
        _payments[payment_id] = payment.model_copy(update={"status": status, "updated_at": _now_iso()})


def add_payment_event(payment_id: str, event_type: str, metadata: dict | None = None) -> PaymentEvent:
    event = PaymentEvent(
        id=str(uuid.uuid4()),
        payment_id=payment_id,
        event_type=event_type,
        metadata=metadata,
        created_at=_now_iso(),
    )
    _payment_events.append(event)
    return event


def get_payment_events(payment_id: str) -> list[PaymentEvent]:
    return [e for e in _payment_events if e.payment_id == payment_id]


def list_payments(business_id: str) -> list[Payment]:
    return [p for p in _payments.values() if p.business_id == business_id]


# ---- Users (mock auth store) --------------------------------------------

def seed_users() -> None:
    """Pre-load demo users so the app is usable without a real DB."""
    from app.auth.pwd import hash_password

    demo = [
        ("admin@barberia.com", "admin123", "Admin Barbería", "admin"),
        ("host@barberia.com", "host123", "Host Barbería", "host"),
        ("empleado@barberia.com", "empleado123", "Juan Empleado", "employee"),
        ("cliente@barberia.com", "cliente123", "Ana Cliente", "client"),
    ]
    for email, password, name, role in demo:
        if email not in _users:
            uid = str(uuid.uuid4())
            _users[email] = UserProfile(
                id=uid,
                email=email,
                name=name,
                role=role,
                business_id="barberia",
                created_at=_now_iso(),
            )
            _password_hashes[uid] = hash_password(password)


def get_user_by_email(email: str) -> UserProfile | None:
    return _users.get(email)


def get_user_by_id(user_id: str) -> UserProfile | None:
    for u in _users.values():
        if u.id == user_id:
            return u
    return None


def create_user(email: str, name: str, role: str, business_id: str, hashed_password: str) -> UserProfile:
    uid = str(uuid.uuid4())
    user = UserProfile(
        id=uid,
        email=email,
        name=name,
        role=role,
        business_id=business_id,
        created_at=_now_iso(),
    )
    _users[email] = user
    _password_hashes[uid] = hashed_password
    return user


def get_password_hash(user_id: str) -> str | None:
    return _password_hashes.get(user_id)


def list_users(business_id: str) -> list[UserProfile]:
    return [u for u in _users.values() if u.business_id == business_id]


def update_user_role(user_id: str, role: str) -> UserProfile | None:
    user = get_user_by_id(user_id)
    if not user:
        return None
    updated = user.model_copy(update={"role": role})
    _users[user.email] = updated
    return updated


def deactivate_user(user_id: str) -> UserProfile | None:
    user = get_user_by_id(user_id)
    if not user:
        return None
    updated = user.model_copy(update={"is_active": False})
    _users[user.email] = updated
    return updated
