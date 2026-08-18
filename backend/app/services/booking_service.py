from datetime import date, datetime, timedelta

from app.data import db, store
from app.models.schemas import Appointment, BookingRequest, Schedule, TenantConfig

_WEEKDAY_CODES = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


class SlotUnavailableError(Exception):
    pass


def _generate_daily_slots(schedule: Schedule) -> list[str]:
    slots = []
    current = datetime.strptime(schedule.start, "%H:%M")
    end = datetime.strptime(schedule.end, "%H:%M")
    step = timedelta(minutes=schedule.slot_minutes)
    while current + step <= end:
        slots.append(current.strftime("%H:%M"))
        current += step
    return slots


def _get_appointments(tenant_slug: str) -> list:
    """Return appointments as Appointment models, from DB or memory."""
    if db.IS_ENABLED:
        return [Appointment(**row) for row in db.get_appointments(tenant_slug)]
    return store.get_appointments(tenant_slug)


def get_available_slots(tenant: TenantConfig, professional_id: str, date_str: str) -> list[str]:
    professional = next((p for p in tenant.professionals if p.id == professional_id), None)
    if professional is None or not professional.active:
        return []

    weekday_code = _WEEKDAY_CODES[date.fromisoformat(date_str).weekday()]
    if weekday_code in professional.days_off:
        return []

    all_slots = _generate_daily_slots(professional.schedule)
    booked = {
        apt.time
        for apt in _get_appointments(tenant.slug)
        if apt.professional_id == professional_id
        and apt.date == date_str
        and apt.status != "no_show"
    }
    return [slot for slot in all_slots if slot not in booked]


def get_day_slots(
    tenant: TenantConfig,
    date_str: str,
    *,
    service_id: str | None = None,
    professional_id: str | None = None,
) -> dict:
    """Full grid of possible slots for the day, each tagged with availability — never
    hides a taken slot, just marks it unavailable (frontend renders it disabled).
    Also reports `open`: whether anyone in scope is even working that day, so the
    frontend can tell "nobody's in today" apart from "fully booked" instead of
    rendering both as an identical wall of disabled slots."""
    if professional_id:
        professionals = [p for p in tenant.professionals if p.id == professional_id]
    elif service_id:
        professionals = [p for p in tenant.professionals if service_id in p.service_ids]
    else:
        professionals = tenant.professionals

    weekday_code = _WEEKDAY_CODES[date.fromisoformat(date_str).weekday()]
    is_open = any(
        p.active and weekday_code not in p.days_off for p in professionals
    )

    times: dict[str, bool] = {}
    for prof in professionals:
        free = set(get_available_slots(tenant, prof.id, date_str))
        for slot in _generate_daily_slots(prof.schedule):
            times[slot] = times.get(slot, False) or slot in free

    slots = [{"time": t, "available": a} for t, a in sorted(times.items())]
    return {"open": is_open, "slots": slots}


def get_professionals_available_at(
    tenant: TenantConfig, service_id: str, date_str: str, time_str: str
):
    return [
        professional
        for professional in tenant.professionals
        if service_id in professional.service_ids
        and time_str in get_available_slots(tenant, professional.id, date_str)
    ]


def pick_least_busy(tenant: TenantConfig, professionals: list, date_str: str):
    """Load-balances the 'cualquier profesional' option: fewest active appointments
    that day wins; ties keep the input order (deterministic)."""
    apts = _get_appointments(tenant.slug)
    counts = {
        professional.id: sum(
            1
            for apt in apts
            if apt.professional_id == professional.id
            and apt.date == date_str
            and apt.status != "no_show"
        )
        for professional in professionals
    }
    return min(professionals, key=lambda p: counts[p.id])


def _is_slot_taken(
    tenant_slug: str,
    professional_id: str,
    date_str: str,
    time_str: str,
    exclude_appointment_id: str | None = None,
) -> bool:
    return any(
        apt.professional_id == professional_id
        and apt.date == date_str
        and apt.time == time_str
        and apt.status != "no_show"
        and apt.id != exclude_appointment_id
        for apt in _get_appointments(tenant_slug)
    )


def create_appointment(tenant: TenantConfig, booking: BookingRequest) -> Appointment:
    """RF05: the slot is re-checked and locked at confirmation time to avoid double-booking."""
    professional_id = booking.professional_id
    if professional_id == "any":
        candidates = get_professionals_available_at(
            tenant, booking.service_id, booking.date, booking.time
        )
        if not candidates:
            raise SlotUnavailableError("El horario seleccionado ya no está disponible.")
        professional_id = pick_least_busy(tenant, candidates, booking.date).id

    available = get_available_slots(tenant, professional_id, booking.date)
    if booking.time not in available:
        raise SlotUnavailableError("El horario seleccionado ya no está disponible.")

    appointment = Appointment(
        id=store.next_appointment_id(),
        tenant_slug=tenant.slug,
        service_id=booking.service_id,
        professional_id=professional_id,
        date=booking.date,
        time=booking.time,
        customer_name=booking.customer_name,
        customer_last_name=booking.customer_last_name,
        customer_phone=booking.customer_phone,
        client_user_id=booking.client_user_id,
    )
    if db.IS_ENABLED:
        row = appointment.model_dump()
        db.insert_appointment(row)
    else:
        store.add_appointment(tenant.slug, appointment)
    return appointment


def reschedule_appointment(
    tenant: TenantConfig,
    appointment: Appointment,
    professional_id: str,
    date_str: str,
    time_str: str,
) -> None:
    """Admin drag & drop on the resource calendar: move an appointment to a new slot/professional."""
    if _is_slot_taken(
        tenant.slug, professional_id, date_str, time_str, exclude_appointment_id=appointment.id
    ):
        raise SlotUnavailableError("Ese horario ya está ocupado.")

    appointment.professional_id = professional_id
    appointment.date = date_str
    appointment.time = time_str
