import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_login_demo_admin():
    res = client.post("/api/auth/login", json={
        "email": "admin@sehatsetu.gov.in",
        "password": "Admin@SehatSetu2026"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "admin"
    assert "access_token" in data

def test_login_demo_patient():
    res = client.post("/api/auth/login", json={
        "email": "asha@example.com",
        "password": "Patient@SehatSetu2026"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "patient"
    assert "access_token" in data

def test_login_invalid_password_rejected():
    res = client.post("/api/auth/login", json={
        "email": "asha@example.com",
        "password": "WrongPassword123"
    })
    assert res.status_code == 401

def test_role_authorization_enforced():
    # Patient token
    login_patient = client.post("/api/auth/login", json={
        "email": "asha@example.com",
        "password": "Patient@SehatSetu2026"
    }).json()
    p_token = login_patient["access_token"]

    # Attempt to access Admin dashboard with patient token -> 403 Forbidden
    admin_res = client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {p_token}"})
    assert admin_res.status_code == 403

    # Attempt to access Professional calendar with patient token -> 403 Forbidden
    prof_res = client.get("/api/professional/dashboard", headers={"Authorization": f"Bearer {p_token}"})
    assert prof_res.status_code == 403

    # Admin accessing Admin dashboard -> 200 OK
    login_admin = client.post("/api/auth/login", json={
        "email": "admin@sehatsetu.gov.in",
        "password": "Admin@SehatSetu2026"
    }).json()
    a_token = login_admin["access_token"]

    admin_ok = client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {a_token}"})
    assert admin_ok.status_code == 200
    stats = admin_ok.json()
    assert stats["total_users"] > 0
    assert stats["total_facilities"] > 0

def test_aadhaar_status_endpoint():
    res = client.get("/api/auth/aadhaar-status")
    assert res.status_code == 200
    data = res.json()
    assert "is_configured" in data
    assert "provider_name" in data
    assert "message" in data
    assert "Aadhaar authentication integration is not configured" in data["message"]
