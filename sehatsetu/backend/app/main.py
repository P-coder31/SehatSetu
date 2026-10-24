from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, Base
from app.db.seed import seed_database
from app.api import (
    auth, discovery, appointments, care_continuity,
    professional, admin, schemes
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure all tables exist on startup
    Base.metadata.create_all(bind=engine)
    # Seed database idempotently
    try:
        seed_database()
    except Exception as e:
        print(f"Warning during auto-seed: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="SehatSetu Healthcare Appointment and Care-Continuity Platform API. Connecting care before, during, and after booking.",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(discovery.router, prefix=settings.API_V1_STR)
app.include_router(appointments.router, prefix=settings.API_V1_STR)
app.include_router(care_continuity.router, prefix=settings.API_V1_STR)
app.include_router(professional.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(schemes.router, prefix=settings.API_V1_STR)

# Root and health checks
@app.get("/")
def root():
    return {
        "name": "SehatSetu API",
        "tagline": "Care, connected.",
        "version": settings.VERSION,
        "status": "healthy",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": "connected"
    }

# Also support backwards-compatible top-level legacy endpoints from initial starter
@app.get("/api/facilities")
def legacy_facilities():
    from app.db.session import SessionLocal
    from app.models.models import Facility
    db = SessionLocal()
    try:
        facs = db.query(Facility).all()
        return {
            "items": [{
                "id": f"facility-{f.id}",
                "name": f.name,
                "service": f.facility_type,
                "distance_km": round(1.2 + (f.id * 0.8), 1),
                "example_fee_inr": 300,
                "sample_slots": ["10:00", "11:30", "14:00", "16:00"],
                "is_sample": True
            } for f in facs],
            "sample_data": True
        }
    finally:
        db.close()
