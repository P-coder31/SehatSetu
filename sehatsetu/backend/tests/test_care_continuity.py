import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_care_continuity_and_delay_workflow():
    # 1. Login as patient Ravi
    p_login = client.post("/api/auth/login", json={
        "email": "ravi@example.com",
        "password": "Patient@SehatSetu2026"
    }).json()
    patient_token = p_login["access_token"]
    p_headers = {"Authorization": f"Bearer {patient_token}"}

    # 2. Login as Doctor Rajesh
    d_login = client.post("/api/auth/login", json={
        "email": "dr.rajesh@sehatsetu.demo",
        "password": "Doctor@SehatSetu2026"
    }).json()
    doctor_token = d_login["access_token"]
    d_headers = {"Authorization": f"Bearer {doctor_token}"}

    # 3. Doctor ID & Facility
    providers = client.get("/api/discovery/providers").json()
    rajesh = next(p for p in providers if "Rajesh" in p["full_name"])
    fac_id = rajesh["facilities"][0]["id"]
    appt_date = (date.today() + timedelta(days=4)).isoformat()

    # 4. Book appointment
    book_res = client.post(
        "/api/appointments/bookings",
        json={
            "professional_id": rajesh["id"],
            "facility_id": fac_id,
            "appointment_date": appt_date,
            "slot_time": "15:00",
            "chief_complaint": "Joint pain check test"
        },
        headers=p_headers
    )
    assert book_res.status_code == 201
    appt_id = book_res.json()["id"]

    # 5. Patient reports a 15-min delay
    delay_res = client.post(
        "/api/care-continuity/delay",
        json={"appointment_id": appt_id, "delay_minutes": 15, "reason": "Metro train delayed"},
        headers=p_headers
    )
    assert delay_res.status_code == 200

    # 6. Check that appointment status is now 'delay_reported'
    appt_check = client.get(f"/api/appointments/bookings/{appt_id}", headers=p_headers).json()
    assert appt_check["status"] == "delay_reported"
    assert appt_check["delay_minutes"] == 15

    # 7. Clinic approves the delay
    clinic_res = client.post(
        "/api/care-continuity/clinic-response",
        json={"appointment_id": appt_id, "approve": True, "notes": "Delay noted, see you at 14:15"},
        headers=d_headers
    )
    assert clinic_res.status_code == 200

    # 8. Check Care Passport timeline contains the events
    passport_res = client.get("/api/care-continuity/passport", headers=p_headers)
    assert passport_res.status_code == 200
    events = passport_res.json()
    event_titles = [e["title"] for e in events]
    assert "Appointment Confirmed" in event_titles
    assert "Delay Reported" in event_titles

    # 9. Follow-up reminder creation
    rem_res = client.post(
        "/api/care-continuity/reminders",
        json={
            "appointment_id": appt_id,
            "reminder_date": appt_date,
            "title": "Bring previous X-rays",
            "notes": "Doctor requested past X-ray scans"
        },
        headers=p_headers
    )
    assert rem_res.status_code == 201
    rem_id = rem_res.json()["id"]

    # 10. Mark reminder complete
    rem_patch = client.patch(f"/api/care-continuity/reminders/{rem_id}?action=complete", headers=p_headers)
    assert rem_patch.status_code == 200
    assert rem_patch.json()["status"] == "completed"

def test_health_scheme_plain_language_explanation():
    schemes = client.get("/api/schemes").json()
    assert len(schemes) >= 3
    pmjay = next(s for s in schemes if "PM-JAY" in s["name"])

    # Test English explanation
    res_en = client.post("/api/schemes/explain", json={"scheme_id": pmjay["id"], "language": "en"})
    assert res_en.status_code == 200
    data_en = res_en.json()
    assert "summary_simple" in data_en
    assert "5 lakh" in data_en["summary_simple"] or "5 lakh" in data_en["key_benefits"]
    assert data_en["official_url"] == "https://pmjay.gov.in"

    # Test Hindi explanation
    res_hi = client.post("/api/schemes/explain", json={"scheme_id": pmjay["id"], "language": "hi"})
    assert res_hi.status_code == 200
    data_hi = res_hi.json()
    assert data_hi["language"] == "hi"
    assert "आयुष्मान" in data_hi["summary_simple"] or "5 लाख" in data_hi["summary_simple"]
