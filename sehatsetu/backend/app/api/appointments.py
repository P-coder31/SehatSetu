from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import (
    Appointment, PatientProfile, ProfessionalProfile, User
)
from app.schemas.schemas import (
    BookingCreate, AppointmentOut, AppointmentReschedule, AppointmentCancel, PatientRescheduleDecision
)
from app.api.deps import get_current_user, get_current_patient
from app.services.booking_service import (
    create_booking_atomic, cancel_appointment, reschedule_appointment_atomic,
    patient_accept_reschedule, patient_decline_reschedule
)

router = APIRouter(prefix="/appointments", tags=["Appointments & Bookings"])

def serialize_appointment(appt: Appointment) -> dict:
    doc_prof = appt.professional
    doc_user = doc_prof.user if doc_prof else None
    patient_user = appt.patient.user if appt.patient else None
    
    spec_names = []
    if doc_prof and doc_prof.specialties:
        spec_names = [ps.specialty.name for ps in doc_prof.specialties if ps.specialty]

    # Proposals
    proposals_data = []
    if hasattr(appt, "proposals") and appt.proposals:
        proposals_data = [{
            "id": p.id,
            "proposed_date": str(p.proposed_date),
            "proposed_slot_time": p.proposed_slot_time,
            "status": p.status,
            "created_at": str(p.created_at) if p.created_at else None
        } for p in appt.proposals]

    latest_proposal = proposals_data[-1] if proposals_data else None

    return {
        "id": appt.id,
        "booking_reference": appt.booking_reference,
        "patient_id": appt.patient_id,
        "patient_name": patient_user.full_name if patient_user else "Patient",
        "professional_id": appt.professional_id,
        "doctor_name": f"{doc_prof.title} {doc_user.full_name}" if (doc_prof and doc_user) else "Doctor",
        "doctor_specialties": spec_names,
        "facility_id": appt.facility_id,
        "facility_name": appt.facility.name if appt.facility else "Clinic",
        "facility_address": appt.facility.address if appt.facility else "",
        "appointment_date": appt.appointment_date,
        "slot_time": appt.slot_time,
        "status": appt.status,
        "chief_complaint": appt.chief_complaint,
        "notes": appt.notes,
        "delay_minutes": appt.delay_minutes or 0,
        "proposals": proposals_data,
        "latest_proposal": latest_proposal,
        "created_at": appt.created_at,
        "updated_at": appt.updated_at
    }

@router.post("/bookings", status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreate,
    current_patient: PatientProfile = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    appt = create_booking_atomic(
        db=db,
        patient_id=current_patient.id,
        professional_id=payload.professional_id,
        facility_id=payload.facility_id,
        appointment_date=payload.appointment_date,
        slot_time=payload.slot_time,
        chief_complaint=payload.chief_complaint,
        notes=payload.notes
    )
    return serialize_appointment(appt)

@router.get("/bookings")
def list_my_appointments(
    current_user: User = Depends(get_current_user),
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Appointment)
    if current_user.role == "patient":
        patient = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
        if not patient:
            return []
        q = q.filter(Appointment.patient_id == patient.id)
    elif current_user.role == "professional":
        prof = db.query(ProfessionalProfile).filter(ProfessionalProfile.user_id == current_user.id).first()
        if not prof:
            return []
        q = q.filter(Appointment.professional_id == prof.id)
    elif current_user.role == "admin":
        pass  # Admin can view all
    else:
        return []

    if status_filter:
        q = q.filter(Appointment.status == status_filter)

    appts = q.order_by(Appointment.appointment_date.desc(), Appointment.slot_time.desc()).all()
    return [serialize_appointment(a) for a in appts]

@router.get("/bookings/{id}")
def get_appointment(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appt = db.query(Appointment).filter(Appointment.id == id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    # Authorization check
    if current_user.role == "patient" and appt.patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to view this appointment.")
    if current_user.role == "professional" and appt.professional.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to view this appointment.")

    res = serialize_appointment(appt)
    # Include history & delay events
    res["history"] = [{
        "new_status": h.new_status,
        "notes": h.notes,
        "created_at": h.created_at
    } for h in appt.status_history]
    
    res["delay_events"] = [{
        "id": d.id,
        "delay_minutes": d.delay_minutes,
        "reason": d.reason,
        "clinic_response": d.clinic_response,
        "created_at": d.created_at
    } for d in appt.delay_events]

    res["proposals"] = [{
        "id": p.id,
        "proposed_date": p.proposed_date,
        "proposed_slot_time": p.proposed_slot_time,
        "status": p.status
    } for p in appt.proposals]

    return res

@router.post("/bookings/{id}/cancel")
def cancel_booking(
    id: int,
    payload: AppointmentCancel = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appt = db.query(Appointment).filter(Appointment.id == id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    if current_user.role == "patient" and appt.patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to cancel this appointment.")
    if current_user.role == "professional" and appt.professional.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to cancel this appointment.")

    reason = payload.reason if payload else "Cancelled by user"
    cancelled_appt = cancel_appointment(db, id, current_user.id, reason)
    return serialize_appointment(cancelled_appt)

@router.post("/bookings/{id}/reschedule")
def reschedule_booking(
    id: int,
    payload: AppointmentReschedule,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appt = db.query(Appointment).filter(Appointment.id == id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    if current_user.role == "patient" and appt.patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to reschedule this appointment.")
    if current_user.role == "professional" and appt.professional.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to reschedule this appointment.")

    updated_appt = reschedule_appointment_atomic(
        db, id, current_user.id, payload.new_date, payload.new_slot_time
    )
    return serialize_appointment(updated_appt)

@router.post("/bookings/{id}/accept-reschedule")
def accept_reschedule_endpoint(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appt = db.query(Appointment).filter(Appointment.id == id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    if current_user.role != "patient" or appt.patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    updated_appt = patient_accept_reschedule(db, id, current_user.id)
    return serialize_appointment(updated_appt)

@router.post("/bookings/{id}/decline-reschedule")
def decline_reschedule_endpoint(
    id: int,
    payload: PatientRescheduleDecision,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appt = db.query(Appointment).filter(Appointment.id == id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    if current_user.role != "patient" or appt.patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    updated_appt = patient_decline_reschedule(
        db=db,
        appointment_id=id,
        patient_user_id=current_user.id,
        action=payload.action or "cancel",
        alternate_date=payload.alternate_date,
        alternate_slot_time=payload.alternate_slot_time
    )
    return serialize_appointment(updated_appt)
