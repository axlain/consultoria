from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import CORS_ORIGINS
from app.data.store import load_tenants, seed_users
from app.routers import admin, admin_transactions, admin_users, auth, booking, payments, tenants


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_tenants()
    seed_users()
    yield


app = FastAPI(title="Multitenant Booking API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tenants.router)
app.include_router(booking.router)
app.include_router(admin.router)
app.include_router(payments.router)
app.include_router(admin_transactions.router)
app.include_router(admin_users.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
