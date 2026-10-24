from datetime import date, datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import (
    Appointment, AppointmentStatusHistory, DelayEvent,
    AlternativeSlotProposal, CareTimelineEvent, FollowUpReminder,
    Notification, User, PatientProfile, ProfessionalProfile
)
from app.schemas.schemas import (
    DelayReportIn, ClinicDelayResponseIn, AlternativeSlotProposalOut,
    AlternativeSlotActionIn, CareTimelineEventOut, FollowUpReminderCreate,
    FollowUpReminderOut, NotificationOut
)
from app.api.deps import get_current_user, get_current_patient
from app.services.booking_service import reschedule_appointment_atomic, ACTIVE_STATUSES

router = APIRouter(prefix="/care-continuity", tags=["Care Continuity Loop"])

# --- DELAY UPDATES ---
@router.post("/delay")
def report_delay(
    payload: DelayReportIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appt = db.query(Appointment).filter(Appointment.id == payload.appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    if current_user.role == "patient" and appt.patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized.")
    if current_user.role == "professional" and appt.professional.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    appt.status = "delay_reported"
    appt.delay_minutes = payload.delay_minutes

    delay_event = DelayEvent(
        appointment_id=appt.id,
        reported_by_user_id=current_user.id,
        delay_minutes=payload.delay_minutes,
        reason=payload.reason or "Patient running late",
        clinic_response="pending"
    )
    db.add(delay_event)

    # Status History
    history = AppointmentStatusHistory(
        appointment_id=appt.id,
        previous_status=appt.status,
        new_status="delay_reported",
        changed_by_user_id=current_user.id,
        notes=f"Reported {payload.delay_minutes} min delay: {payload.reason or 'Traffic/transit delay'}"
    )
    db.add(history)

    # Timeline event
    timeline = CareTimelineEvent(
        patient_id=appt.patient_id,
        appointment_id=appt.id,
        event_type="delay_reported",
        title="Delay Reported",
        description=f"Reported arrival {payload.delay_minutes} mins late for appointment at {appt.slot_time}. Waiting for clinic response."
    )
    db.add(timeline)

    # Notify doctor
    if appt.professional and appt.professional.user_id:
        notif = Notification(
            user_id=appt.professional.user_id,
            title="Patient Delay Reported",
            message=f"Patient for {appt.slot_time} reported a {payload.delay_minutes} min delay.",
            link=f"/professional/appointments"
        )
        db.add(notif)

    db.commit()
    db.refresh(delay_event)
    return {
        "status": "success",
        "message": f"Delay of {payload.delay_minutes} minutes reported. Clinic has been notified.",
        "appointment_id": appt.id,
        "delay_minutes": appt.delay_minutes
    }

@router.post("/clinic-response")
def respond_to_delay(
    payload: ClinicDelayResponseIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appt = db.query(Appointment).filter(Appointment.id == payload.appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    if current_user.role not in ["professional", "admin"]:
        raise HTTPException(status_code=403, detail="Only the professional or admin can respond to a delay request.")

    delay_ev = db.query(DelayEvent).filter(
        DelayEvent.appointment_id == appt.id
    ).order_by(DelayEvent.id.desc()).first()

    if payload.approve:
        if delay_ev:
            delay_ev.clinic_response = "approved"
        appt.status = "confirmed"  # Confirmed with late arrival approved
        
        timeline = CareTimelineEvent(
            patient_id=appt.patient_id,
            appointment_id=appt.id,
            event_type="delay_approved",
            title="Late Arrival Confirmed",
            description=f"Clinic approved your {appt.delay_minutes} min late arrival. Your slot at {appt.slot_time} is held."
        )
        db.add(timeline)

        notif = Notification(
            user_id=appt.patient.user_id,
            title="Clinic Approved Late Arrival",
            message=f"Clinic confirmed you can arrive {appt.delay_minutes} mins late for your appointment ({appt.booking_reference}).",
            link="/dashboard/appointments"
        )
        db.add(notif)
    else:
        if delay_ev:
            delay_ev.clinic_response = "declined"
        
        # If alternative slot proposed
        proposal_created = False
        if payload.propose_alternative_date and payload.propose_alternative_slot:
            prop = AlternativeSlotProposal(
                appointment_id=appt.id,
                proposed_date=payload.propose_alternative_date,
                proposed_slot_time=payload.propose_alternative_slot,
                status="proposed"
            )
            db.add(prop)
            proposal_created = True

            notif = Notification(
                user_id=appt.patient.user_id,
                title="Clinic Proposed Alternative Time",
                message=f"Clinic cannot accommodate delay, but proposed an alternative time: {payload.propose_alternative_date} at {payload.propose_alternative_slot}.",
                link="/dashboard/appointments"
            )
            db.add(notif)
        else:
            notif = Notification(
                user_id=appt.patient.user_id,
                title="Delay Could Not Be Accommodated",
                message=f"Clinic cannot accommodate the delay for {appt.booking_reference}. Please reschedule your visit.",
                link="/dashboard/appointments"
            )
            db.add(notif)

        timeline = CareTimelineEvent(
            patient_id=appt.patient_id,
            appointment_id=appt.id,
            event_type="delay_declined",
            title="Delay Could Not Be Accommodated",
            description=payload.notes or "Clinic is running on a tight schedule. Please select another time or reschedule."
        )
        db.add(timeline)

    db.commit()
    return {"status": "success", "approved": payload.approve, "appointment_status": appt.status}

# --- ALTERNATIVE SLOT ACCEPTANCE ---
@router.post("/alternative-proposal/action")
def handle_alternative_proposal(
    payload: AlternativeSlotActionIn,
    current_patient: PatientProfile = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    prop = db.query(AlternativeSlotProposal).filter(AlternativeSlotProposal.id == payload.proposal_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Proposal not found.")

    appt = prop.appointment
    if appt.patient_id != current_patient.id:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    if prop.status != "proposed":
        raise HTTPException(status_code=400, detail="This proposal is no longer active.")

    if payload.action == "accept":
        # Atomically move appointment to new slot
        updated = reschedule_appointment_atomic(
            db=db,
            appointment_id=appt.id,
            user_id=current_patient.user_id,
            new_date=prop.proposed_date,
            new_slot=prop.proposed_slot_time
        )
        prop.status = "accepted"
        db.commit()
        return {"status": "accepted", "message": "Alternative slot accepted and confirmed.", "appointment_id": updated.id}
    else:
        prop.status = "rejected"
        db.commit()
        return {"status": "rejected", "message": "Alternative slot rejected. Retaining existing booking options."}

# --- MY CARE PASSPORT ---
@router.get("/passport", response_model=List[CareTimelineEventOut])
def get_care_passport_timeline(
    current_patient: PatientProfile = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    events = db.query(CareTimelineEvent).filter(
        CareTimelineEvent.patient_id == current_patient.id
    ).order_by(CareTimelineEvent.created_at.desc()).all()
    return events

# --- FOLLOW-UP REMINDERS ---
@router.get("/reminders", response_model=List[FollowUpReminderOut])
def list_reminders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "patient":
        pat = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
        if not pat:
            return []
        return db.query(FollowUpReminder).filter(
            FollowUpReminder.patient_id == pat.id
        ).order_by(FollowUpReminder.reminder_date.asc()).all()
    elif current_user.role == "professional":
        prof = db.query(ProfessionalProfile).filter(ProfessionalProfile.user_id == current_user.id).first()
        if not prof:
            return []
        appts = db.query(Appointment.id).filter(Appointment.professional_id == prof.id).all()
        appt_ids = [a[0] for a in appts]
        return db.query(FollowUpReminder).filter(
            FollowUpReminder.appointment_id.in_(appt_ids)
        ).order_by(FollowUpReminder.reminder_date.asc()).all()
    else:
        return db.query(FollowUpReminder).order_by(FollowUpReminder.reminder_date.asc()).limit(50).all()

@router.post("/reminders", response_model=FollowUpReminderOut, status_code=status.HTTP_201_CREATED)
def create_reminder(
    payload: FollowUpReminderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient_id = None
    if current_user.role == "patient":
        pat = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
        if not pat:
            raise HTTPException(status_code=400, detail="Patient profile not found.")
        patient_id = pat.id
    elif payload.appointment_id:
        appt = db.query(Appointment).filter(Appointment.id == payload.appointment_id).first()
        if appt:
            patient_id = appt.patient_id
    
    if not patient_id:
        pat = db.query(PatientProfile).first()
        patient_id = pat.id if pat else 1

    rem = FollowUpReminder(
        patient_id=patient_id,
        appointment_id=payload.appointment_id,
        reminder_date=payload.reminder_date,
        title=payload.title,
        notes=payload.notes,
        status="pending"
    )
    db.add(rem)
    db.flush()

    # Timeline event
    timeline = CareTimelineEvent(
        patient_id=patient_id,
        appointment_id=payload.appointment_id,
        event_type="reminder_created",
        title="Follow-up Reminder Created",
        description=f"Reminder set for {payload.reminder_date.strftime('%d %b %Y')}: {payload.title}"
    )
    db.add(timeline)
    db.commit()
    db.refresh(rem)
    return rem

@router.patch("/reminders/{id}")
def update_reminder_status(
    id: int,
    action: str,  # "complete" or "dismiss"
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rem = db.query(FollowUpReminder).filter(FollowUpReminder.id == id).first()
    if not rem:
        raise HTTPException(status_code=404, detail="Reminder not found.")

    if action == "complete":
        rem.status = "completed"
        timeline = CareTimelineEvent(
            patient_id=rem.patient_id,
            appointment_id=rem.appointment_id,
            event_type="reminder_completed",
            title="Follow-up Completed",
            description=f"Marked completed: {rem.title}"
        )
        db.add(timeline)
    elif action == "dismiss":
        rem.status = "dismissed"
    else:
        raise HTTPException(status_code=400, detail="Action must be 'complete' or 'dismiss'.")

    db.commit()
    db.refresh(rem)
    return rem

# --- NOTIFICATIONS ---
@router.get("/notifications", response_model=List[NotificationOut])
def list_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(30).all()

@router.patch("/notifications/{id}/read")
def mark_notification_read(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(
        Notification.id == id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    notif.is_read = True
    db.commit()
    return {"status": "success"}

@router.post("/notifications/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"status": "success"}

# --- AADHAAR & ABHA DIGITAL HEALTH CARD ENDPOINTS ---
from app.services.aadhaar_service import aadhaar_service
from app.schemas.schemas import AadhaarGenerateOtpIn, AadhaarVerifyOtpIn

@router.post("/aadhaar/generate-otp")
def generate_aadhaar_otp(
    payload: AadhaarGenerateOtpIn,
    current_user: User = Depends(get_current_user),
):
    try:
        res = aadhaar_service.generate_otp(payload.aadhaar_number)
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/aadhaar/verify-and-link")
def verify_and_link_aadhaar(
    payload: AadhaarVerifyOtpIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pat = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not pat:
        raise HTTPException(status_code=400, detail="Only patient accounts can link an Aadhaar health profile.")

    try:
        verified = aadhaar_service.verify_otp(payload.txn_id, payload.otp, current_user.full_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Update patient profile
    pat.is_aadhaar_verified = True
    pat.masked_aadhaar = verified["masked_aadhaar"]
    pat.aadhaar_verified_at = datetime.now(timezone.utc)
    pat.abha_number = verified["abha_number"]
    pat.abha_address = verified["abha_address"]
    pat.state = verified.get("state", "Haryana")
    pat.pincode = verified.get("pincode", "131001")

    # Add Care Timeline Event
    timeline = CareTimelineEvent(
        patient_id=pat.id,
        appointment_id=None,
        event_type="aadhaar_verified",
        title="Aadhaar & ABHA Health ID Linked",
        description=f"Successfully authenticated via UIDAI/ABDM OTP. Masked UID: {verified['masked_aadhaar']}, ABHA ID: {verified['abha_number']}"
    )
    db.add(timeline)

    # Add notification
    notif = Notification(
        user_id=current_user.id,
        title="Aadhaar & ABHA Health Card Verified",
        message=f"Your ABHA Health Card ({verified['abha_number']}) is now linked to your SehatSetu profile. Enjoy 1-click cashless registration at Sonipat hospitals.",
        link="/dashboard/care-passport"
    )
    db.add(notif)

    db.commit()
    db.refresh(pat)

    return {
        "success": True,
        "message": "Aadhaar and ABHA Health ID linked successfully.",
        "card": {
            "is_verified": True,
            "patient_name": current_user.full_name,
            "masked_aadhaar": pat.masked_aadhaar,
            "abha_number": pat.abha_number,
            "abha_address": pat.abha_address,
            "state": pat.state,
            "district": pat.city or "Sonipat",
            "pincode": pat.pincode,
            "verified_at": pat.aadhaar_verified_at.isoformat() if pat.aadhaar_verified_at else None,
            "qr_code_payload": verified.get("qr_code_payload")
        }
    }

@router.get("/aadhaar-card")
def get_aadhaar_card(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pat = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not pat or not pat.is_aadhaar_verified:
        return {"is_verified": False}

    qr_payload = f"ABDM:V2|ID:{pat.abha_number}|ADDR:{pat.abha_address}|UID:{pat.masked_aadhaar}|DIST:{pat.city or 'Sonipat'}|ST:{pat.state or 'Haryana'}"
    return {
        "is_verified": True,
        "patient_name": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "gender": pat.gender or "Not Specified",
        "dob": pat.dob.isoformat() if pat.dob else "1992-05-14",
        "masked_aadhaar": pat.masked_aadhaar,
        "abha_number": pat.abha_number,
        "abha_address": pat.abha_address,
        "state": pat.state or "Haryana",
        "district": pat.city or "Sonipat",
        "pincode": pat.pincode or "131001",
        "verified_at": pat.aadhaar_verified_at.isoformat() if pat.aadhaar_verified_at else None,
        "qr_code_payload": qr_payload
    }

@router.delete("/aadhaar/unlink")
def unlink_aadhaar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pat = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not pat or not pat.is_aadhaar_verified:
        raise HTTPException(status_code=400, detail="No Aadhaar card is currently linked to this profile.")

    pat.is_aadhaar_verified = False
    pat.masked_aadhaar = None
    pat.abha_number = None
    pat.abha_address = None
    pat.aadhaar_verified_at = None

    timeline = CareTimelineEvent(
        patient_id=pat.id,
        appointment_id=None,
        event_type="aadhaar_unlinked",
        title="Aadhaar Health ID Unlinked",
        description="Patient unlinked their Aadhaar credentials from SehatSetu."
    )
    db.add(timeline)
    db.commit()

    return {"success": True, "message": "Aadhaar and ABHA Health ID unlinked successfully."}
