import re
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

# Letters (incl. accented/ñ) and spaces only — used for customer name fields.
_NAME_RE = re.compile(r"^[A-Za-zÀ-ÿ\s]+$")


def _validate_name(value: str) -> str:
    stripped = value.strip()
    if not stripped or not _NAME_RE.match(stripped):
        raise ValueError("Solo se permiten letras.")
    return stripped


# ---- Tenant configuration (RF02, RF08) --------------------------------

class BusinessInfo(BaseModel):
    name: str
    type: str
    address: str
    phone: str
    map_embed_url: str
    lat: float
    lng: float
    google_rating: Optional[float] = None
    google_review_count: Optional[int] = None
    google_reviews_url: Optional[str] = None


class Theme(BaseModel):
    primary_color: str
    secondary_color: str
    logo_url: str
    font_family: str


class Seo(BaseModel):
    title: str
    description: str
    og_image: str


class Service(BaseModel):
    id: str
    name: str
    duration_minutes: int
    price: float
    color: str = "#c9a24b"


class ServiceInput(BaseModel):
    name: str
    duration_minutes: int
    price: float
    color: str = "#c9a24b"


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    duration_minutes: Optional[int] = None
    price: Optional[float] = None
    color: Optional[str] = None


class Schedule(BaseModel):
    start: str  # "HH:MM"
    end: str  # "HH:MM"
    slot_minutes: int


DayOfWeek = Literal["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


class Professional(BaseModel):
    id: str
    name: str
    service_ids: list[str]
    schedule: Schedule
    active: bool = True
    days_off: list[DayOfWeek] = []


class ProfessionalInput(BaseModel):
    name: str
    service_ids: list[str]
    schedule: Schedule
    active: bool = True
    days_off: list[DayOfWeek] = []


class ProfessionalUpdate(BaseModel):
    name: Optional[str] = None
    service_ids: Optional[list[str]] = None
    schedule: Optional[Schedule] = None
    active: Optional[bool] = None
    days_off: Optional[list[DayOfWeek]] = None


class Faq(BaseModel):
    question: str
    answer: str


class Review(BaseModel):
    author: str
    rating: int
    comment: str


class TenantConfig(BaseModel):
    slug: str
    business: BusinessInfo
    theme: Theme
    seo: Seo
    services: list[Service]
    professionals: list[Professional]
    faqs: list[Faq]
    reviews: list[Review]
    privacy_policy_url: str
    analytics_id: Optional[str] = None


# ---- Booking wizard (RF03, RF05) ---------------------------------------

class SlotAvailability(BaseModel):
    time: str
    available: bool


class DayAvailability(BaseModel):
    # Whether anyone in scope is working at all that day — lets the frontend tell
    # "closed" apart from "fully booked" instead of showing an identical wall of
    # disabled slots for both.
    open: bool
    slots: list[SlotAvailability]


class BookingRequest(BaseModel):
    service_id: str
    professional_id: str  # or the sentinel "any" for "cualquier profesional"
    date: str  # "YYYY-MM-DD"
    time: str  # "HH:MM"
    customer_name: str
    customer_last_name: str
    customer_phone: str = Field(pattern=r"^\d{10}$")

    _validate_names = field_validator("customer_name", "customer_last_name")(_validate_name)


# scheduled: booked and still upcoming — the only non-terminal state; if it's in the
# list, it's on. completed: the appointment happened (set via QR check-in or manually).
# no_show: client didn't show (always manual).
AppointmentStatus = Literal["scheduled", "completed", "no_show"]


class Appointment(BaseModel):
    id: str
    tenant_slug: str
    service_id: str
    professional_id: str
    date: str
    time: str
    customer_name: str
    customer_last_name: str
    customer_phone: str
    status: AppointmentStatus = "scheduled"


class AppointmentUpdate(BaseModel):
    """Partial update: status change and/or reschedule (drag & drop on the admin calendar)."""

    status: Optional[AppointmentStatus] = None
    professional_id: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None


class AppointmentValidation(BaseModel):
    """Response for the front-desk QR scan: the raw Appointment plus the service/
    professional names, which the QR itself doesn't carry (it only encodes the id)."""

    id: str
    customer_name: str
    customer_last_name: str
    customer_phone: str
    service_name: str
    professional_name: str
    date: str
    time: str
    status: AppointmentStatus


# ---- Payments (Fase 1 — mock provider) ------------------------------------

PaymentStatus = Literal["pending", "authorized", "paid", "failed", "refunded", "canceled"]


class Payment(BaseModel):
    id: str
    appointment_id: str
    business_id: str
    amount_cents: int
    currency: str = "MXN"
    status: PaymentStatus = "pending"
    provider: str = "mock"
    provider_reference: Optional[str] = None
    created_at: str
    updated_at: str


class PaymentEvent(BaseModel):
    id: str
    payment_id: str
    event_type: str  # created | authorized | captured | failed | refunded
    metadata: Optional[dict] = None
    created_at: str


class CreatePaymentRequest(BaseModel):
    appointment_id: str
    business_id: str
    amount_cents: int
    currency: str = "MXN"


class ConfirmPaymentRequest(BaseModel):
    payment_id: str


class RefundPaymentRequest(BaseModel):
    payment_id: str


class PaymentResponse(BaseModel):
    payment_id: str
    status: PaymentStatus
    provider_reference: Optional[str] = None
