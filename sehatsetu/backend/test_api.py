import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.db.session import SessionLocal
from app.models.models import User, PatientProfile, ProfessionalProfile, Facility, Appointment

client = TestClient(app)

def test_api_concurrency_race():
    db = SessionLocal()
    try:
        prof = db.query(ProfessionalProfile).filter(ProfessionalProfile.verification_status == "verified").first()
        fac = prof.facilities[0].facility if prof.facilities else db.query(Facility).first()
        prof_id = int(prof.id)
        fac_id = int(fac.id)
        target_date = date.today() + timedelta(days=12)
        slot_time = "10:30"
        
        # Clean slot
        db.query(Appointment).filter(
            Appointment.professional_id == prof_id,
            Appointment.appointment_date == target_date,
            Appointment.slot_time == slot_time
        ).delete()
        db.commit()

        # Create two patients
        p1 = db.query(User).filter(User.email == "asha@example.com").first()
        p2 = db.query(User).filter(User.email == "ravi@example.com").first()
        tok1 = create_access_token(subject=p1.id, role="patient")
        tok2 = create_access_token(subject=p2.id, role="patient")

        import threading
        codes = []
        def book(tok):
            r = client.post("/api/appointments/bookings", json={
                "professional_id": prof_id,
                "facility_id": fac_id,
                "appointment_date": target_date.isoformat(),
                "slot_time": slot_time,
                "chief_complaint": "test double booking race"
            }, headers={"Authorization": f"Bearer {tok}"})
            codes.append(r.status_code)

        t1 = threading.Thread(target=book, args=(tok1,))
        t2 = threading.Thread(target=book, args=(tok2,))
        t1.start(); t2.start()
        t1.join(); t2.join()

        assert codes.count(201) == 1 and codes.count(409) == 1
    finally:
        db.close()
