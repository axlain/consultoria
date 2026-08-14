from typing import Literal, Optional

from pydantic import BaseModel


# ---- Tenant configuration (RF02, RF08) --------------------------------

class BusinessInfo(BaseModel):
    name: str
    type: Literal["barberia", "tattoo"]
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
    requires_tattoo_details: bool = False
    color: str = "#c9a24b"


class ServiceInput(BaseModel):
    name: str
    duration_minutes: int
    price: float
    requires_tattoo_details: bool = False
    color: str = "#c9a24b"


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    duration_minutes: Optional[int] = None
    price: Optional[float] = None
    requires_tattoo_details: Optional[bool] = None
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


# ---- Booking wizard (RF03, RF04, RF05) ---------------------------------

class TattooDetails(BaseModel):
    width_cm: float
    height_cm: float
    body_zone: str
    reference_image_url: Optional[str] = None


class BookingRequest(BaseModel):
    service_id: str
    professional_id: str
    date: str  # "YYYY-MM-DD"
    time: str  # "HH:MM"
    customer_name: str
    customer_phone: str
    tattoo_details: Optional[TattooDetails] = None


# scheduled: just booked by a client, awaiting staff confirmation (yellow).
# confirmed: staff confirmed it will happen (green).
# completed: the appointment happened (gray). no_show: client didn't show (red).
AppointmentStatus = Literal["scheduled", "confirmed", "completed", "no_show"]


class Appointment(BaseModel):
    id: str
    tenant_slug: str
    service_id: str
    professional_id: str
    date: str
    time: str
    customer_name: str
    customer_phone: str
    status: AppointmentStatus = "scheduled"
    tattoo_details: Optional[TattooDetails] = None


class AppointmentUpdate(BaseModel):
    """Partial update: status change and/or reschedule (drag & drop on the admin calendar)."""

    status: Optional[AppointmentStatus] = None
    professional_id: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
