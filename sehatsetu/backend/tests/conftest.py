import os
import pytest
from app.db.session import engine, Base, SessionLocal
from app.db.seed import seed_database
from app.models.models import Appointment

@pytest.fixture(autouse=True)
def clean_test_appointments():
    """Ensure clean appointment state for reliable test assertions"""
    db = SessionLocal()
    try:
        # Delete test-created appointments so each run starts fresh with the seed state
        db.query(Appointment).filter(Appointment.chief_complaint.like("%test%")).delete()
        db.commit()
    finally:
        db.close()
    yield
