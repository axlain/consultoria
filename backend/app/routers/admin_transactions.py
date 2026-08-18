import csv
import io
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse

from app.auth.dependencies import require_role
from app.data import store
from app.models.schemas import Payment, UserProfile

router = APIRouter(prefix="/api/admin/transactions", tags=["admin-transactions"])

_admin_only = require_role("admin")


def _parse_date(s: str | None) -> datetime | None:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s)
    except ValueError:
        return None


@router.get("", response_model=list[Payment])
def list_transactions(
    status: str | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    current_user: UserProfile = Depends(_admin_only),
):
    payments = store.list_payments(current_user.business_id)
    if status:
        payments = [p for p in payments if p.status == status]
    df = _parse_date(date_from)
    dt = _parse_date(date_to)
    if df:
        payments = [p for p in payments if datetime.fromisoformat(p.created_at) >= df]
    if dt:
        payments = [p for p in payments if datetime.fromisoformat(p.created_at) <= dt]
    return sorted(payments, key=lambda p: p.created_at, reverse=True)


@router.get("/summary")
def transactions_summary(current_user: UserProfile = Depends(_admin_only)):
    payments = store.list_payments(current_user.business_id)
    total_paid = sum(p.amount_cents for p in payments if p.status == "paid")
    total_refunded = sum(p.amount_cents for p in payments if p.status == "refunded")
    return {
        "total_paid_cents": total_paid,
        "total_refunded_cents": total_refunded,
        "net_cents": total_paid - total_refunded,
        "count_paid": sum(1 for p in payments if p.status == "paid"),
        "count_refunded": sum(1 for p in payments if p.status == "refunded"),
        "count_failed": sum(1 for p in payments if p.status == "failed"),
        "count_pending": sum(1 for p in payments if p.status == "pending"),
    }


@router.get("/{payment_id}/events")
def payment_events(payment_id: str, current_user: UserProfile = Depends(_admin_only)):
    return store.get_payment_events(payment_id)


@router.get("/export/csv")
def export_csv(current_user: UserProfile = Depends(_admin_only)):
    payments = store.list_payments(current_user.business_id)
    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=["id", "appointment_id", "amount_cents", "currency", "status", "provider", "created_at"],
    )
    writer.writeheader()
    for p in sorted(payments, key=lambda x: x.created_at, reverse=True):
        writer.writerow({
            "id": p.id,
            "appointment_id": p.appointment_id,
            "amount_cents": p.amount_cents,
            "currency": p.currency,
            "status": p.status,
            "provider": p.provider,
            "created_at": p.created_at,
        })
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transacciones.csv"},
    )
