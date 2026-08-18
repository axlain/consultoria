from app.data import store
from app.payments.provider import CreatePaymentInput, PaymentProvider, PaymentResult

# Valid state transitions — no skipping steps.
_VALID_TRANSITIONS: dict[str, set[str]] = {
    "pending": {"authorized", "failed"},
    "authorized": {"paid", "refunded", "failed"},
    "paid": {"refunded"},
    "failed": set(),
    "refunded": set(),
    "canceled": set(),
}


def _assert_transition(current: str, target: str) -> None:
    if target not in _VALID_TRANSITIONS.get(current, set()):
        raise ValueError(f"Transición inválida: {current} → {target}")


class MockPaymentProvider(PaymentProvider):
    async def create_payment(self, input: CreatePaymentInput) -> PaymentResult:
        payment = store.create_payment(
            appointment_id=input.appointment_id,
            business_id=input.business_id,
            amount_cents=input.amount_cents,
            currency=input.currency,
        )
        store.add_payment_event(payment.id, "created", {"simulated": True})
        return PaymentResult(payment_id=payment.id, status="pending")

    async def confirm_payment(self, payment_id: str) -> PaymentResult:
        payment = store.get_payment(payment_id)
        if payment is None:
            raise ValueError(f"Pago {payment_id} no encontrado")
        # Mock goes pending → authorized → paid in one shot.
        _assert_transition(payment.status, "authorized")
        store.update_payment_status(payment_id, "authorized")
        store.add_payment_event(payment_id, "authorized", {"simulated": True})
        _assert_transition("authorized", "paid")
        store.update_payment_status(payment_id, "paid")
        store.add_payment_event(payment_id, "captured", {"simulated": True})
        return PaymentResult(payment_id=payment_id, status="paid")

    async def refund_payment(self, payment_id: str) -> PaymentResult:
        payment = store.get_payment(payment_id)
        if payment is None:
            raise ValueError(f"Pago {payment_id} no encontrado")
        _assert_transition(payment.status, "refunded")
        store.update_payment_status(payment_id, "refunded")
        store.add_payment_event(payment_id, "refunded", {"simulated": True})
        return PaymentResult(payment_id=payment_id, status="refunded")
