from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.models import (
    User, PatientProfile, ProfessionalProfile, Facility, Specialty,
    Appointment, AuditLog, Notification
)
from app.schemas.schemas import (
    AdminDashboardStats, FacilityCreate, FacilityOut,
    ProfessionalVerificationUpdate, AuditLogOut
)
from app.api.deps import require_role
from app.api.appointments import serialize_appointment

router = APIRouter(prefix="/admin", tags=["Admin Portal"], dependencies=[Depends(require_role("admin"))])

@router.get("/dashboard", response_model=AdminDashboardStats)
def get_admin_dashboard(db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_patients = db.query(PatientProfile).count()
    total_professionals = db.query(ProfessionalProfile).count()
    pending_verifications = db.query(ProfessionalProfile).filter(ProfessionalProfile.verification_status == "pending").count()
    total_facilities = db.query(Facility).count()
    total_appointments = db.query(Appointment).count()
    active_delays = db.query(Appointment).filter(Appointment.status == "delay_reported").count()

    # Appointment breakdown by status
    status_counts = db.query(Appointment.status, func.count(Appointment.id)).group_by(Appointment.status).all()
    status_dict = {s: c for s, c in status_counts}

    # Schemes count
    from app.models.models import HealthScheme
    total_schemes = db.query(HealthScheme).count()

    return AdminDashboardStats(
        total_users=total_users,
        total_patients=total_patients,
        total_professionals=total_professionals,
        pending_verifications=pending_verifications,
        total_facilities=total_facilities,
        total_appointments=total_appointments,
        appointments_by_status=status_dict,
        active_delays=active_delays,
        total_schemes=total_schemes
    )

@router.get("/users")
def list_users(
    role: Optional[str] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if q:
        query = query.filter(
            (User.email.ilike(f"%{q}%")) | (User.full_name.ilike(f"%{q}%"))
        )
    users = query.order_by(User.created_at.desc()).limit(100).all()
    return [{
        "id": u.id,
        "email": u.email,
        "full_name": u.full_name,
        "phone": u.phone,
        "role": u.role,
        "is_active": u.is_active,
        "created_at": u.created_at
    } for u in users]

@router.patch("/users/{id}/status")
def toggle_user_active(
    id: int,
    is_active: bool,
    admin_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    target = db.query(User).filter(User.id == id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")
    
    if target.id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself.")

    target.is_active = is_active
    audit = AuditLog(
        user_id=admin_user.id,
        action="USER_STATUS_CHANGE",
        target_entity="User",
        target_id=str(target.id),
        details=f"User {target.email} active state changed to {is_active}"
    )
    db.add(audit)
    db.commit()
    return {"status": "success", "user_id": target.id, "is_active": target.is_active}

@router.get("/verifications")
def list_verifications(
    status_filter: Optional[str] = Query(None, description="pending, verified, rejected"),
    db: Session = Depends(get_db)
):
    q = db.query(ProfessionalProfile)
    if status_filter:
        q = q.filter(ProfessionalProfile.verification_status == status_filter)
    else:
        # Default to showing pending first
        q = q.order_by(ProfessionalProfile.verification_status.asc(), ProfessionalProfile.created_at.desc())
    
    profs = q.all()
    results = []
    for p in profs:
        results.append({
            "id": p.id,
            "user_id": p.user_id,
            "doctor_name": f"{p.title} {p.user.full_name}" if p.user else "Doctor",
            "email": p.user.email if p.user else "",
            "registration_number": p.registration_number,
            "qualification": p.qualification,
            "bio": p.bio,
            "consultation_fee": p.consultation_fee,
            "experience_years": p.experience_years,
            "verification_status": p.verification_status,
            "verification_notes": p.verification_notes,
            "created_at": p.created_at
        })
    return results

@router.post("/verifications/{id}")
def process_verification(
    id: int,
    payload: ProfessionalVerificationUpdate,
    admin_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    prof = db.query(ProfessionalProfile).filter(ProfessionalProfile.id == id).first()
    if not prof:
        raise HTTPException(status_code=404, detail="Professional not found.")

    if payload.status not in ["verified", "rejected"]:
        raise HTTPException(status_code=400, detail="Status must be 'verified' or 'rejected'.")

    prof.verification_status = payload.status
    prof.verification_notes = payload.verification_notes
    prof.verified_at = datetime.now(timezone.utc)
    prof.verified_by_id = admin_user.id

    # Audit
    audit = AuditLog(
        user_id=admin_user.id,
        action=f"PROFESSIONAL_{payload.status.upper()}",
        target_entity="ProfessionalProfile",
        target_id=str(prof.id),
        details=f"Status set to {payload.status}. Notes: {payload.verification_notes or 'None'}"
    )
    db.add(audit)

    # Notify Doctor
    notif = Notification(
        user_id=prof.user_id,
        title=f"Verification Application {payload.status.title()}",
        message=f"Your professional credentials have been {payload.status}. Reason/Notes: {payload.verification_notes or 'Application approved.'}",
        link="/professional/dashboard"
    )
    db.add(notif)

    db.commit()
    db.refresh(prof)
    return {"status": "success", "profile_id": prof.id, "verification_status": prof.verification_status}

@router.get("/facilities", response_model=List[FacilityOut])
def list_facilities_admin(db: Session = Depends(get_db)):
    return db.query(Facility).order_by(Facility.name.asc()).all()

@router.post("/facilities", response_model=FacilityOut)
def create_facility(
    payload: FacilityCreate,
    admin_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    fac = Facility(
        name=payload.name,
        facility_type=payload.facility_type,
        address=payload.address,
        city=payload.city,
        state=payload.state,
        pincode=payload.pincode,
        phone=payload.phone,
        email=payload.email,
        is_verified=True
    )
    db.add(fac)
    db.flush()

    audit = AuditLog(
        user_id=admin_user.id,
        action="FACILITY_CREATED",
        target_entity="Facility",
        target_id=str(fac.id),
        details=f"Created facility: {fac.name}"
    )
    db.add(audit)
    db.commit()
    db.refresh(fac)
    return fac

@router.get("/appointments")
def list_all_appointments(
    status: Optional[str] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Appointment)
    if status:
        query = query.filter(Appointment.status == status)
    if q:
        query = query.filter(Appointment.booking_reference.ilike(f"%{q}%"))
    
    appts = query.order_by(Appointment.appointment_date.desc(), Appointment.slot_time.desc()).limit(150).all()
    return [serialize_appointment(a) for a in appts]

@router.get("/audit", response_model=List[AuditLogOut])
def get_audit_trail(db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()
    res = []
    for l in logs:
        res.append(AuditLogOut(
            id=l.id,
            user_id=l.user_id,
            user_email=l.user.email if l.user else "System",
            action=l.action,
            target_entity=l.target_entity,
            target_id=l.target_id,
            details=l.details,
            created_at=l.created_at
        ))
    return res
