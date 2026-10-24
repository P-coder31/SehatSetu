import os
import threading
import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.db.session import SessionLocal
from app.models.models import User, PatientProfile, ProfessionalProfile, Facility

client = TestClient(app)

def test_twenty_simultaneous_bookings_exactly_one_wins():
    db = SessionLocal()
    try:
        # Get doctor and facility
        prof = db.query(ProfessionalProfile).filter(ProfessionalProfile.verification_status == "verified").first() or db.query(ProfessionalProfile).first()
        fac = prof.facilities[0].facility if prof.facilities else db.query(Facility).first()
        prof_id = int(prof.id)
        fac_id = int(fac.id)
        target_date = date.today() + timedelta(days=7)
        slot_time = "11:00"
        
        # Ensure slot is free for concurrency test
        from app.models.models import Appointment
        db.query(Appointment).filter(
            Appointment.professional_id == prof_id,
            Appointment.appointment_date == target_date,
            Appointment.slot_time == slot_time
        ).delete()
        db.commit()

        # Create 20 unique patients to avoid hitting FairSlot limit per user
        patient_tokens = []
        for i in range(20):
            email = f"testpatient_{i}@test.com"
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    email=email,
                    hashed_password="fakehashedpassword",
                    full_name=f"Test Patient {i}",
                    role="patient"
                )
                db.add(user)
                db.flush()
                profile = PatientProfile(user_id=user.id)
                db.add(profile)
                db.commit()
                db.refresh(user)
            token = create_access_token(subject=user.id, role="patient")
            patient_tokens.append(token)

        # 20 threads simultaneously booking the same slot
        status_codes = []
        def attempt_booking(token):
            res = client.post(
                "/api/appointments/bookings",
                json={
                    "professional_id": prof_id,
                    "facility_id": fac_id,
                    "appointment_date": target_date.isoformat(),
                    "slot_time": slot_time,
                    "chief_complaint": "Simultaneous concurrency race test"
                },
                headers={"Authorization": f"Bearer {token}"}
            )
            status_codes.append(res.status_code)

        threads = [threading.Thread(target=attempt_booking, args=(tok,)) for tok in patient_tokens]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        # Database transaction & lock guarantee: exactly one 201 Created and nineteen 409 Conflict
        assert status_codes.count(201) == 1, f"Expected exactly 1 success, got {status_codes.count(201)}"
        assert status_codes.count(409) == 19, f"Expected 19 conflicts, got {status_codes.count(409)}"
    finally:
        db.close()
