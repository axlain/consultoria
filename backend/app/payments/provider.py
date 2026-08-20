from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Literal


@dataclass
class CreatePaymentInput:
    appointment_id: str
    business_id: str
    amount_cents: int
    currency: str


@dataclass
class PaymentResult:
    payment_id: str
    status: Literal["pending", "authorized", "paid", "failed", "refunded"]
    provider_reference: str | None = None
    client_secret: str | None = None  # Stripe only — used by frontend Elements


class PaymentProvider(ABC):
    @abstractmethod
    async def create_payment(self, input: CreatePaymentInput) -> PaymentResult: ...

    @abstractmethod
    async def confirm_payment(self, payment_id: str) -> PaymentResult: ...

    @abstractmethod
    async def refund_payment(self, payment_id: str) -> PaymentResult: ...
