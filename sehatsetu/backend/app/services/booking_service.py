import threading
from datetime import date, datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from uuid import uuid4
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.models import (
    Appointment, AppointmentStatusHistory, AvailabilityRule,
    AvailabilityException, PatientProfile, ProfessionalProfile,
    CareTimelineEvent, Notification, User, DelayEvent, AlternativeSlotProposal
)

# Concurrency lock for in-process SQLite safety alongside DB transactions
_booking_lock = threading.Lock()

ACTIVE_STATUSES = ["confirmed", "delay_reported", "rescheduled", "reschedule_requested"]

def generate_booking_reference() -> str:
    now = datetime.now(timezone.utc)
    short_uuid = uuid4().hex[:6].upper()
    return f"SS-{now.year}-{short_uuid}"

def get_slots_for_date(
    db: Session,
    professional_id: int,
    target_date: date
) -> List[Dict[str, Any]]:
    # 1. Check if date is in the past
    today = date.today()
    if target_date < today:
        return []

    # 2. Check full-day exception
    exception = db.query(AvailabilityException).filter(
        AvailabilityException.professional_id == professional_id,
        AvailabilityException.exception_date == target_date
    ).first()
    
    if exception and exception.is_blocked and (not exception.start_time or exception.start_time == "00:00"):
        return []

    # 3. Find availability rule for day of week (0=Mon, 6=Sun)
    day_of_week = target_date.weekday()
    rule = db.query(AvailabilityRule).filter(
        AvailabilityRule.professional_id == professional_id,
        AvailabilityRule.day_of_week == day_of_week,
        AvailabilityRule.is_active == True
    ).first()

    # Fallback default hours if no custom rule exists: 09:00 to 17:00 (Mon-Sat), slot 30m
    if not rule:
        if day_of_week == 6:  # Sunday closed by default
            return []
        start_str = "09:00"
        end_str = "17:00"
        duration_mins = 30
    else:
        start_str = rule.start_time
        end_str = rule.end_time
        duration_mins = rule.slot_duration_minutes or 30

    # 4. Generate all slot time strings
    slots = []
    curr = datetime.strptime(start_str, "%H:%M")
    end = datetime.strptime(end_str, "%H:%M")
    
    # 5. Fetch all existing active bookings for this doctor on this date
    existing_bookings = db.query(Appointment).filter(
        Appointment.professional_id == professional_id,
        Appointment.appointment_date == target_date,
        Appointment.status.in_(ACTIVE_STATUSES)
    ).all()
    booked_times = {b.slot_time for b in existing_bookings}

    while curr < end:
        slot_time_str = curr.strftime("%H:%M")
        
        # Check partial exception
        is_blocked = False
        if exception and exception.is_blocked and exception.start_time and exception.end_time:
            ex_start = datetime.strptime(exception.start_time, "%H:%M")
            ex_end = datetime.strptime(exception.end_time, "%H:%M")
            if ex_start <= curr < ex_end:
                is_blocked = True

        is_available = (not is_blocked) and (slot_time_str not in booked_times)
        
        slots.append({
            "slot_time": slot_time_str,
            "is_available": is_available,
            "reason": "Booked" if slot_time_str in booked_times else ("Unavailable" if is_blocked else None)
        })
        curr += timedelta(minutes=duration_mins)

    return slots

def create_booking_atomic(
    db: Session,
    patient_id: int,
    professional_id: int,
    facility_id: int,
    appointment_date: date,
    slot_time: str,
    chief_complaint: Optional[str] = None,
    notes: Optional[str] = None,
) -> Appointment:
    today = date.today()
    if appointment_date < today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Appointment date cannot be in the past."
        )

    # 1. FairSlot check: Maximum 2 active bookings per patient
    active_count = db.query(Appointment).filter(
        Appointment.patient_id == patient_id,
        Appointment.status.in_(ACTIVE_STATUSES)
    ).count()
    if active_count >= 2:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="FairSlot limit: You already have 2 active bookings. Cancel or complete one before booking another."
        )

    # 2. Concurrency Lock + DB Level check for double booking
    with _booking_lock:
        # Check if doctor has an active booking for this exact date & slot
        existing = db.query(Appointment).filter(
            Appointment.professional_id == professional_id,
            Appointment.appointment_date == appointment_date,
            Appointment.slot_time == slot_time,
            Appointment.status.in_(ACTIVE_STATUSES)
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This slot has already been booked by another patient. Please choose another slot."
            )

        # Revalidate that the slot is not blocked by exceptions or schedule rules
        slots_on_date = get_slots_for_date(db, professional_id, appointment_date)
        if slots_on_date:
            slot_match = next((s for s in slots_on_date if s["slot_time"] == slot_time), None)
            if slot_match and not slot_match["is_available"]:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Slot {slot_time} on {appointment_date.isoformat()} is not available. Please choose another slot."
                )

        # Create appointment record
        ref = generate_booking_reference()
        appt = Appointment(
            booking_reference=ref,
            patient_id=patient_id,
            professional_id=professional_id,
            facility_id=facility_id,
            appointment_date=appointment_date,
            slot_time=slot_time,
            status="confirmed",
            chief_complaint=chief_complaint,
            notes=notes,
            delay_minutes=0
        )
        db.add(appt)
        db.flush()

        # Add Status History
        history = AppointmentStatusHistory(
            appointment_id=appt.id,
            previous_status=None,
            new_status="confirmed",
            notes="Initial booking confirmed"
        )
        db.add(history)

        # Add Care Timeline Event
        doctor_prof = db.query(ProfessionalProfile).filter(ProfessionalProfile.id == professional_id).first()
        doctor_name = doctor_prof.user.full_name if doctor_prof and doctor_prof.user else "Doctor"
        
        timeline_event = CareTimelineEvent(
            patient_id=patient_id,
            appointment_id=appt.id,
            event_type="booked",
            title="Appointment Confirmed",
            description=f"Booked with {doctor_prof.title if doctor_prof else 'Dr.'} {doctor_name} for {appointment_date.strftime('%d %b %Y')} at {slot_time}."
        )
        db.add(timeline_event)

        # Add Notification for patient
        notif_patient = Notification(
            user_id=appt.patient.user_id,
            title="Appointment Confirmed",
            message=f"Your appointment ({ref}) is confirmed for {appointment_date.strftime('%d %b %Y')} at {slot_time}.",
            link=f"/dashboard/appointments"
        )
        db.add(notif_patient)

        # Add Notification for doctor
        if doctor_prof and doctor_prof.user_id:
            notif_doctor = Notification(
                user_id=doctor_prof.user_id,
                title="New Patient Booking",
                message=f"New booking received for {appointment_date.strftime('%d %b %Y')} at {slot_time}.",
                link=f"/professional/appointments"
            )
            db.add(notif_doctor)

        db.commit()
        db.refresh(appt)
        return appt

def cancel_appointment(
    db: Session,
    appointment_id: int,
    user_id: int,
    reason: Optional[str] = None
) -> Appointment:
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    
    if appt.status == "cancelled":
        raise HTTPException(status_code=400, detail="Appointment is already cancelled.")

    prev_status = appt.status
    appt.status = "cancelled"
    
    # History
    history = AppointmentStatusHistory(
        appointment_id=appt.id,
        previous_status=prev_status,
        new_status="cancelled",
        changed_by_user_id=user_id,
        notes=reason or "Cancelled by user"
    )
    db.add(history)

    # Timeline
    timeline_event = CareTimelineEvent(
        patient_id=appt.patient_id,
        appointment_id=appt.id,
        event_type="cancelled",
        title="Appointment Cancelled",
        description=f"Visit for {appt.appointment_date.strftime('%d %b %Y')} at {appt.slot_time} was cancelled. Slot released."
    )
    db.add(timeline_event)

    # Notification
    notif = Notification(
        user_id=appt.patient.user_id,
        title="Appointment Cancelled",
        message=f"Appointment {appt.booking_reference} has been cancelled.",
        link="/dashboard/appointments"
    )
    db.add(notif)

    db.commit()
    db.refresh(appt)
    return appt

def reschedule_appointment_atomic(
    db: Session,
    appointment_id: int,
    user_id: int,
    new_date: date,
    new_slot: str
) -> Appointment:
    today = date.today()
    if new_date < today:
        raise HTTPException(status_code=400, detail="New date cannot be in the past.")

    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    with _booking_lock:
        # Check conflict
        conflict = db.query(Appointment).filter(
            Appointment.professional_id == appt.professional_id,
            Appointment.appointment_date == new_date,
            Appointment.slot_time == new_slot,
            Appointment.status.in_(ACTIVE_STATUSES),
            Appointment.id != appt.id
        ).first()

        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="The requested slot is already booked. Please choose another slot."
            )

        old_date = appt.appointment_date
        old_slot = appt.slot_time
        prev_status = appt.status

        appt.appointment_date = new_date
        appt.slot_time = new_slot
        appt.status = "rescheduled"
        appt.delay_minutes = 0

        # History
        history = AppointmentStatusHistory(
            appointment_id=appt.id,
            previous_status=prev_status,
            new_status="rescheduled",
            changed_by_user_id=user_id,
            notes=f"Moved from {old_date} {old_slot} to {new_date} {new_slot}"
        )
        db.add(history)

        # Timeline
        timeline_event = CareTimelineEvent(
            patient_id=appt.patient_id,
            appointment_id=appt.id,
            event_type="rescheduled",
            title="Appointment Rescheduled",
            description=f"Moved from {old_date.strftime('%d %b %Y')} {old_slot} to {new_date.strftime('%d %b %Y')} at {new_slot}."
        )
        db.add(timeline_event)

        # Notification
        notif = Notification(
            user_id=appt.patient.user_id,
            title="Appointment Rescheduled",
            message=f"Appointment {appt.booking_reference} moved to {new_date.strftime('%d %b %Y')} at {new_slot}.",
            link="/dashboard/appointments"
        )
        db.add(notif)

        db.commit()
        db.refresh(appt)
        return appt

def doctor_request_reschedule(
    db: Session,
    appointment_id: int,
    doctor_user_id: int,
    new_date: date,
    new_slot_time: str,
    reason: str,
    notes: Optional[str] = None
) -> Appointment:
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    if appt.professional.user_id != doctor_user_id:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    if appt.status in ["completed", "cancelled", "cancelled_by_doctor", "noshow"]:
        raise HTTPException(status_code=400, detail=f"Cannot reschedule an appointment with status '{appt.status}'.")

    # Check that proposed slot isn't already booked
    conflict = db.query(Appointment).filter(
        Appointment.professional_id == appt.professional_id,
        Appointment.appointment_date == new_date,
        Appointment.slot_time == new_slot_time,
        Appointment.status.in_(ACTIVE_STATUSES),
        Appointment.id != appt.id
    ).first()
    if conflict:
        raise HTTPException(status_code=409, detail=f"Proposed slot {new_slot_time} on {new_date} is already booked.")

    prev_status = appt.status
    appt.status = "reschedule_requested"
    explanation = f"Doctor requested reschedule to {new_date.strftime('%d %b %Y')} at {new_slot_time}. Reason: {reason}"
    if notes:
        explanation += f" ({notes})"
    appt.notes = explanation

    # Create AlternativeSlotProposal
    proposal = AlternativeSlotProposal(
        appointment_id=appt.id,
        proposed_date=new_date,
        proposed_slot_time=new_slot_time,
        status="proposed"
    )
    db.add(proposal)

    # Status History
    history = AppointmentStatusHistory(
        appointment_id=appt.id,
        previous_status=prev_status,
        new_status="reschedule_requested",
        changed_by_user_id=doctor_user_id,
        notes=explanation
    )
    db.add(history)

    # Care Timeline Event
    doc_name = f"{appt.professional.title} {appt.professional.user.full_name}"
    timeline = CareTimelineEvent(
        patient_id=appt.patient_id,
        appointment_id=appt.id,
        event_type="reschedule_requested",
        title="Doctor Requested Reschedule",
        description=f"{doc_name} requested to move your visit to {new_date.strftime('%d %b %Y')} at {new_slot_time}. Reason: {reason}."
    )
    db.add(timeline)

    # Urgent Notification to Patient
    notif = Notification(
        user_id=appt.patient.user_id,
        title="Action Required: Doctor Reschedule Request",
        message=f"{doc_name} requested to reschedule your appointment ({appt.booking_reference}) to {new_date.strftime('%d %b %Y')} at {new_slot_time}. Reason: {reason}. Please review and confirm.",
        link="/dashboard/appointments"
    )
    db.add(notif)

    db.commit()
    db.refresh(appt)
    return appt

def doctor_cancel_appointment(
    db: Session,
    appointment_id: int,
    doctor_user_id: int,
    reason: str,
    notes: Optional[str] = None
) -> Appointment:
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    if appt.professional.user_id != doctor_user_id:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    if appt.status in ["completed", "cancelled", "cancelled_by_doctor"]:
        raise HTTPException(status_code=400, detail=f"Appointment is already {appt.status}.")

    prev_status = appt.status
    appt.status = "cancelled_by_doctor"
    explanation = f"Doctor cancelled due to: {reason}"
    if notes:
        explanation += f". Note: {notes}"
    appt.notes = explanation

    # Status History
    history = AppointmentStatusHistory(
        appointment_id=appt.id,
        previous_status=prev_status,
        new_status="cancelled_by_doctor",
        changed_by_user_id=doctor_user_id,
        notes=explanation
    )
    db.add(history)

    # Timeline
    doc_name = f"{appt.professional.title} {appt.professional.user.full_name}"
    timeline = CareTimelineEvent(
        patient_id=appt.patient_id,
        appointment_id=appt.id,
        event_type="cancelled",
        title="Appointment Cancelled by Doctor",
        description=f"{doc_name} had to cancel visit on {appt.appointment_date.strftime('%d %b %Y')} at {appt.slot_time}. Reason: {reason}. Slot released."
    )
    db.add(timeline)

    # Urgent Notification to Patient
    notif = Notification(
        user_id=appt.patient.user_id,
        title="Appointment Notice from Doctor",
        message=f"{doc_name} had to cancel your appointment ({appt.booking_reference}) due to: {reason}. {notes or ''} You can rebook with another practitioner with 0 platform fees.",
        link="/dashboard/appointments"
    )
    db.add(notif)

    db.commit()
    db.refresh(appt)
    return appt

def patient_accept_reschedule(
    db: Session,
    appointment_id: int,
    patient_user_id: int
) -> Appointment:
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    if appt.patient.user_id != patient_user_id:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    if appt.status != "reschedule_requested":
        raise HTTPException(status_code=400, detail="No pending reschedule request on this appointment.")

    # Find latest proposed slot
    latest_proposal = db.query(AlternativeSlotProposal).filter(
        AlternativeSlotProposal.appointment_id == appt.id,
        AlternativeSlotProposal.status == "proposed"
    ).order_by(AlternativeSlotProposal.created_at.desc()).first()

    if not latest_proposal:
        raise HTTPException(status_code=400, detail="No active proposal found.")

    with _booking_lock:
        conflict = db.query(Appointment).filter(
            Appointment.professional_id == appt.professional_id,
            Appointment.appointment_date == latest_proposal.proposed_date,
            Appointment.slot_time == latest_proposal.proposed_slot_time,
            Appointment.status.in_(ACTIVE_STATUSES),
            Appointment.id != appt.id
        ).first()
        if conflict:
            raise HTTPException(status_code=409, detail="The proposed slot is no longer available. Please choose another slot.")

        appt.appointment_date = latest_proposal.proposed_date
        appt.slot_time = latest_proposal.proposed_slot_time
        appt.status = "rescheduled"
        appt.delay_minutes = 0
        latest_proposal.status = "accepted"

        history = AppointmentStatusHistory(
            appointment_id=appt.id,
            previous_status="reschedule_requested",
            new_status="rescheduled",
            changed_by_user_id=patient_user_id,
            notes=f"Patient accepted doctor reschedule to {appt.appointment_date} at {appt.slot_time}"
        )
        db.add(history)

        patient_name = appt.patient.user.full_name
        timeline = CareTimelineEvent(
            patient_id=appt.patient_id,
            appointment_id=appt.id,
            event_type="rescheduled",
            title="Reschedule Confirmed",
            description=f"You accepted Dr. {appt.professional.user.full_name}'s new proposed time: {appt.appointment_date.strftime('%d %b %Y')} at {appt.slot_time}."
        )
        db.add(timeline)

        # Notify doctor
        notif = Notification(
            user_id=appt.professional.user_id,
            title="Patient Accepted Reschedule",
            message=f"Patient {patient_name} accepted the proposed time for appointment {appt.booking_reference}: {appt.appointment_date.strftime('%d %b %Y')} at {appt.slot_time}.",
            link="/professional/appointments"
        )
        db.add(notif)

        db.commit()
        db.refresh(appt)
        return appt

def patient_decline_reschedule(
    db: Session,
    appointment_id: int,
    patient_user_id: int,
    action: str = "cancel",
    alternate_date: Optional[date] = None,
    alternate_slot_time: Optional[str] = None
) -> Appointment:
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    if appt.patient.user_id != patient_user_id:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    # Mark existing proposals as rejected
    proposals = db.query(AlternativeSlotProposal).filter(
        AlternativeSlotProposal.appointment_id == appt.id,
        AlternativeSlotProposal.status == "proposed"
    ).all()
    for p in proposals:
        p.status = "rejected"

    patient_name = appt.patient.user.full_name

    if action == "cancel":
        appt.status = "cancelled"
        history = AppointmentStatusHistory(
            appointment_id=appt.id,
            previous_status="reschedule_requested",
            new_status="cancelled",
            changed_by_user_id=patient_user_id,
            notes="Patient declined doctor reschedule and cancelled the visit"
        )
        db.add(history)

        timeline = CareTimelineEvent(
            patient_id=appt.patient_id,
            appointment_id=appt.id,
            event_type="cancelled",
            title="Appointment Cancelled",
            description="You declined the proposed reschedule and cancelled this visit. Slot released."
        )
        db.add(timeline)

        # Notify doctor
        notif = Notification(
            user_id=appt.professional.user_id,
            title="Reschedule Declined - Slot Released",
            message=f"Patient {patient_name} declined the reschedule request for {appt.booking_reference} and cancelled the visit.",
            link="/professional/appointments"
        )
        db.add(notif)

    elif action == "pick_another" and alternate_date and alternate_slot_time:
        with _booking_lock:
            conflict = db.query(Appointment).filter(
                Appointment.professional_id == appt.professional_id,
                Appointment.appointment_date == alternate_date,
                Appointment.slot_time == alternate_slot_time,
                Appointment.status.in_(ACTIVE_STATUSES),
                Appointment.id != appt.id
            ).first()
            if conflict:
                raise HTTPException(status_code=409, detail="Selected slot is already booked.")

            appt.appointment_date = alternate_date
            appt.slot_time = alternate_slot_time
            appt.status = "rescheduled"
            appt.delay_minutes = 0

            history = AppointmentStatusHistory(
                appointment_id=appt.id,
                previous_status="reschedule_requested",
                new_status="rescheduled",
                changed_by_user_id=patient_user_id,
                notes=f"Patient chose alternate slot: {alternate_date} at {alternate_slot_time}"
            )
            db.add(history)

            timeline = CareTimelineEvent(
                patient_id=appt.patient_id,
                appointment_id=appt.id,
                event_type="rescheduled",
                title="Alternate Slot Selected",
                description=f"You chose an alternate time: {alternate_date.strftime('%d %b %Y')} at {alternate_slot_time}."
            )
            db.add(timeline)

            notif = Notification(
                user_id=appt.professional.user_id,
                title="Patient Picked Alternate Slot",
                message=f"Patient {patient_name} selected alternate time for {appt.booking_reference}: {alternate_date.strftime('%d %b %Y')} at {alternate_slot_time}.",
                link="/professional/appointments"
            )
            db.add(notif)

    db.commit()
    db.refresh(appt)
    return appt
