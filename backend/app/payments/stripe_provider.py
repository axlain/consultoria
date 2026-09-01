import uuid
from datetime import datetime, timezone

import stripe
from starlette.concurrency import run_in_threadpool

from app.core.config import STRIPE_SECRET_KEY
from app.data import db, store
from app.payments.provider import CreatePaymentInput, PaymentProvider, PaymentResult


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class StripePaymentProvider(PaymentProvider):
    def __init__(self, secret_key: str = "") -> None:
        stripe.api_key = secret_key or STRIPE_SECRET_KEY

    async def create_payment(self, input: CreatePaymentInput) -> PaymentResult:
        # stripe-py and supabase-py are both synchronous (blocking) clients — run
        # them off the event loop so this request doesn't stall every other
        # concurrent request on this worker for the duration of the network call.
        intent = await run_in_threadpool(
            stripe.PaymentIntent.create,
            amount=input.amount_cents,
            currency=input.currency.lower(),
            automatic_payment_methods={"enabled": True},
            metadata={"appointment_id": input.appointment_id, "business_id": input.business_id},
        )
        payment_id = str(uuid.uuid4())
        if db.IS_ENABLED:
            await run_in_threadpool(db.insert_payment, {
                "id": payment_id,
                "appointment_id": input.appointment_id,
                "business_id": input.business_id,
                "amount_cents": input.amount_cents,
                "currency": input.currency,
                "status": "pending",
                "provider": "stripe",
                "provider_reference": intent.id,
                "created_at": _now_iso(),
                "updated_at": _now_iso(),
            })
        else:
            payment = store.create_payment(
                appointment_id=input.appointment_id,
                business_id=input.business_id,
                amount_cents=input.amount_cents,
                currency=input.currency,
            )
            payment_id = payment.id

        return PaymentResult(
            payment_id=payment_id,
            status="pending",
            provider_reference=intent.id,
            client_secret=intent.client_secret,
        )

    async def confirm_payment(self, payment_id: str) -> PaymentResult:
        # Verify the actual PaymentIntent status with Stripe so the frontend
        # gets 'paid' immediately after stripe.confirmPayment() succeeds.
        if db.IS_ENABLED:
            row = await run_in_threadpool(db.get_payment, payment_id)
        else:
            p = store.get_payment(payment_id)
            row = {"status": p.status, "provider_reference": getattr(p, "provider_reference", None)} if p else None

        if not row:
            return PaymentResult(payment_id=payment_id, status="pending")

        ref_id = row.get("provider_reference")
        if ref_id:
            intent = await run_in_threadpool(stripe.PaymentIntent.retrieve, ref_id)
            if intent.status == "succeeded":
                if db.IS_ENABLED:
                    await run_in_threadpool(db.update_payment_status, payment_id, "paid")
                    await run_in_threadpool(db.insert_payment_event, {
                        "payment_id": payment_id,
                        "event_type": "captured",
                        "metadata": {"provider": "stripe", "intent": ref_id},
                    })
                else:
                    store.update_payment_status(payment_id, "paid")
                return PaymentResult(payment_id=payment_id, status="paid", provider_reference=ref_id)

        return PaymentResult(payment_id=payment_id, status=row.get("status", "pending"))

    async def refund_payment(self, payment_id: str) -> PaymentResult:
        ref_id = None
        if db.IS_ENABLED:
            row = await run_in_threadpool(db.get_payment, payment_id)
            if row:
                ref_id = row.get("provider_reference")
        else:
            p = store.get_payment(payment_id)
            if p:
                ref_id = p.provider_reference

        if ref_id:
            await run_in_threadpool(stripe.Refund.create, payment_intent=ref_id)

        if db.IS_ENABLED:
            await run_in_threadpool(db.update_payment_status, payment_id, "refunded")
            await run_in_threadpool(db.insert_payment_event, {
                "payment_id": payment_id,
                "event_type": "refunded",
                "metadata": {"provider": "stripe"},
            })
        else:
            store.update_payment_status(payment_id, "refunded")
            store.add_payment_event(payment_id, "refunded", {"provider": "stripe"})

        return PaymentResult(payment_id=payment_id, status="refunded")
