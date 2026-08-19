import uuid
from datetime import datetime, timezone

from app.data import db, store
from app.payments.provider import CreatePaymentInput, PaymentProvider, PaymentResult

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


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class MockPaymentProvider(PaymentProvider):
    async def create_payment(self, input: CreatePaymentInput) -> PaymentResult:
        if db.IS_ENABLED:
            payment_id = str(uuid.uuid4())
            db.insert_payment({
                "id": payment_id,
                "appointment_id": input.appointment_id,
                "business_id": input.business_id,
                "amount_cents": input.amount_cents,
                "currency": input.currency,
                "status": "pending",
                "provider": "mock",
                "created_at": _now_iso(),
                "updated_at": _now_iso(),
            })
            db.insert_payment_event(
                {"payment_id": payment_id, "event_type": "created", "metadata": {"simulated": True}}
            )
        else:
            payment = store.create_payment(
                appointment_id=input.appointment_id,
                business_id=input.business_id,
                amount_cents=input.amount_cents,
                currency=input.currency,
            )
            payment_id = payment.id
            store.add_payment_event(payment_id, "created", {"simulated": True})

        return PaymentResult(payment_id=payment_id, status="pending")

    async def confirm_payment(self, payment_id: str) -> PaymentResult:
        if db.IS_ENABLED:
            row = db.get_payment(payment_id)
            if row is None:
                raise ValueError(f"Pago {payment_id} no encontrado")
            _assert_transition(row["status"], "authorized")
            db.update_payment_status(payment_id, "authorized")
            db.insert_payment_event(
                {"payment_id": payment_id, "event_type": "authorized", "metadata": {"simulated": True}}
            )
            _assert_transition("authorized", "paid")
            db.update_payment_status(payment_id, "paid")
            db.insert_payment_event(
                {"payment_id": payment_id, "event_type": "captured", "metadata": {"simulated": True}}
            )
        else:
            payment = store.get_payment(payment_id)
            if payment is None:
                raise ValueError(f"Pago {payment_id} no encontrado")
            _assert_transition(payment.status, "authorized")
            store.update_payment_status(payment_id, "authorized")
            store.add_payment_event(payment_id, "authorized", {"simulated": True})
            _assert_transition("authorized", "paid")
            store.update_payment_status(payment_id, "paid")
            store.add_payment_event(payment_id, "captured", {"simulated": True})

        return PaymentResult(payment_id=payment_id, status="paid")

    async def refund_payment(self, payment_id: str) -> PaymentResult:
        if db.IS_ENABLED:
            row = db.get_payment(payment_id)
            if row is None:
                raise ValueError(f"Pago {payment_id} no encontrado")
            _assert_transition(row["status"], "refunded")
            db.update_payment_status(payment_id, "refunded")
            db.insert_payment_event(
                {"payment_id": payment_id, "event_type": "refunded", "metadata": {"simulated": True}}
            )
        else:
            payment = store.get_payment(payment_id)
            if payment is None:
                raise ValueError(f"Pago {payment_id} no encontrado")
            _assert_transition(payment.status, "refunded")
            store.update_payment_status(payment_id, "refunded")
            store.add_payment_event(payment_id, "refunded", {"simulated": True})

        return PaymentResult(payment_id=payment_id, status="refunded")
