import logging

from fastapi import APIRouter, HTTPException, Request

from app.data import db, store
from app.models.schemas import (
    ConfirmPaymentRequest,
    CreatePaymentRequest,
    Payment,
    PaymentResponse,
    RefundPaymentRequest,
)
from app.payments.mock_provider import MockPaymentProvider
from app.payments.provider import CreatePaymentInput

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payments", tags=["payments"])

# Single point of instantiation — swap MockPaymentProvider for StripeProvider
# or MercadoPagoProvider here in Phase 2; nothing else in the codebase changes.
_provider = MockPaymentProvider()


@router.post("/create", response_model=PaymentResponse)
async def create_payment(body: CreatePaymentRequest) -> PaymentResponse:
    result = await _provider.create_payment(
        CreatePaymentInput(
            appointment_id=body.appointment_id,
            business_id=body.business_id,
            amount_cents=body.amount_cents,
            currency=body.currency,
        )
    )
    return PaymentResponse(payment_id=result.payment_id, status=result.status)


@router.post("/confirm", response_model=PaymentResponse)
async def confirm_payment(body: ConfirmPaymentRequest) -> PaymentResponse:
    try:
        result = await _provider.confirm_payment(body.payment_id)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return PaymentResponse(payment_id=result.payment_id, status=result.status)


@router.post("/refund", response_model=PaymentResponse)
async def refund_payment(body: RefundPaymentRequest) -> PaymentResponse:
    try:
        result = await _provider.refund_payment(body.payment_id)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return PaymentResponse(payment_id=result.payment_id, status=result.status)


# webhook must be declared before /{payment_id} so the literal path wins.
@router.post("/webhook")
async def webhook(request: Request) -> dict:
    event = await request.json()
    logger.info("Webhook recibido (simulado): %s", event)
    # TODO Phase 2: validate provider signature before trusting the payload.
    return {"received": True}


@router.get("/{payment_id}", response_model=Payment)
def get_payment(payment_id: str) -> Payment:
    if db.IS_ENABLED:
        row = db.get_payment(payment_id)
        if row is None:
            raise HTTPException(status_code=404, detail=f"Pago '{payment_id}' no encontrado")
        return Payment(**row)
    payment = store.get_payment(payment_id)
    if payment is None:
        raise HTTPException(status_code=404, detail=f"Pago '{payment_id}' no encontrado")
    return payment
