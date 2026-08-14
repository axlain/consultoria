from datetime import date, datetime, timedelta

from app.data import store
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
        for apt in store.get_appointments(tenant.slug)
        if apt.professional_id == professional_id
        and apt.date == date_str
        and apt.status != "no_show"
    }
    return [slot for slot in all_slots if slot not in booked]


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
        for apt in store.get_appointments(tenant_slug)
    )


def create_appointment(tenant: TenantConfig, booking: BookingRequest) -> Appointment:
    """RF05: the slot is re-checked and locked at confirmation time to avoid double-booking."""
    available = get_available_slots(tenant, booking.professional_id, booking.date)
    if booking.time not in available:
        raise SlotUnavailableError("El horario seleccionado ya no está disponible.")

    appointment = Appointment(
        id=store.next_appointment_id(),
        tenant_slug=tenant.slug,
        service_id=booking.service_id,
        professional_id=booking.professional_id,
        date=booking.date,
        time=booking.time,
        customer_name=booking.customer_name,
        customer_phone=booking.customer_phone,
        tattoo_details=booking.tattoo_details,
    )
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
