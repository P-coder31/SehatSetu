from datetime import datetime, date, timezone
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Date, DateTime, Float,
    ForeignKey, Table, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from app.db.session import Base

def utcnow():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="patient")  # patient, professional, admin
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
    
    # Relationships
    patient_profile = relationship("PatientProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    professional_profile = relationship("ProfessionalProfile", back_populates="user", uselist=False, cascade="all, delete-orphan", foreign_keys="[ProfessionalProfile.user_id]")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")

class PatientProfile(Base):
    __tablename__ = "patient_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    dob = Column(Date, nullable=True)
    gender = Column(String(50), nullable=True)
    emergency_contact = Column(String(100), nullable=True)
    blood_group = Column(String(10), nullable=True)
    city = Column(String(100), nullable=True, default="Sonipat")
    state = Column(String(100), nullable=True, default="Haryana")
    pincode = Column(String(20), nullable=True, default="131001")
    is_aadhaar_verified = Column(Boolean, default=False)
    masked_aadhaar = Column(String(20), nullable=True)
    aadhaar_verified_at = Column(DateTime, nullable=True)
    abha_number = Column(String(30), nullable=True)
    abha_address = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=utcnow)
    
    user = relationship("User", back_populates="patient_profile")
    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")
    timeline_events = relationship("CareTimelineEvent", back_populates="patient", cascade="all, delete-orphan")
    reminders = relationship("FollowUpReminder", back_populates="patient", cascade="all, delete-orphan")

class ProfessionalProfile(Base):
    __tablename__ = "professional_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    title = Column(String(50), default="Dr.")
    registration_number = Column(String(100), nullable=False)
    qualification = Column(String(255), nullable=False)
    bio = Column(Text, nullable=True)
    consultation_fee = Column(Integer, nullable=False, default=300)
    experience_years = Column(Integer, nullable=False, default=5)
    verification_status = Column(String(50), default="pending")  # pending, verified, rejected
    verification_notes = Column(Text, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    verified_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    gender = Column(String(20), nullable=True, default="Any")  # Male, Female, Other
    languages = Column(String(255), nullable=True, default="English, Hindi")
    teleconsultation_available = Column(Boolean, default=True)
    in_person_available = Column(Boolean, default=True)
    is_sample = Column(Boolean, default=True)
    rating = Column(Float, nullable=True)
    review_count = Column(Integer, default=0)
    avatar_seed = Column(String(50), nullable=True)
    services_offered = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    
    user = relationship("User", back_populates="professional_profile", foreign_keys=[user_id])
    verified_by = relationship("User", foreign_keys=[verified_by_id])
    facilities = relationship("ProfessionalFacility", back_populates="professional", cascade="all, delete-orphan")
    specialties = relationship("ProfessionalSpecialty", back_populates="professional", cascade="all, delete-orphan")
    availability_rules = relationship("AvailabilityRule", back_populates="professional", cascade="all, delete-orphan")
    availability_exceptions = relationship("AvailabilityException", back_populates="professional", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="professional")

class Facility(Base):
    __tablename__ = "facilities"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    facility_type = Column(String(100), default="Government")  # Government, Private, Community
    address = Column(String(500), nullable=False)
    city = Column(String(100), nullable=False, default="Sonipat")
    state = Column(String(100), nullable=False, default="Haryana")
    pincode = Column(String(20), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    
    professionals = relationship("ProfessionalFacility", back_populates="facility", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="facility")

class Specialty(Base):
    __tablename__ = "specialties"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(255), nullable=True)
    icon_name = Column(String(50), default="Stethoscope")
    
    professionals = relationship("ProfessionalSpecialty", back_populates="specialty", cascade="all, delete-orphan")

class ProfessionalFacility(Base):
    __tablename__ = "professional_facilities"
    
    id = Column(Integer, primary_key=True, index=True)
    professional_id = Column(Integer, ForeignKey("professional_profiles.id", ondelete="CASCADE"), nullable=False)
    facility_id = Column(Integer, ForeignKey("facilities.id", ondelete="CASCADE"), nullable=False)
    is_primary = Column(Boolean, default=True)
    
    professional = relationship("ProfessionalProfile", back_populates="facilities")
    facility = relationship("Facility", back_populates="professionals")
    
    __table_args__ = (
        UniqueConstraint("professional_id", "facility_id", name="uq_prof_facility"),
    )

class ProfessionalSpecialty(Base):
    __tablename__ = "professional_specialties"
    
    id = Column(Integer, primary_key=True, index=True)
    professional_id = Column(Integer, ForeignKey("professional_profiles.id", ondelete="CASCADE"), nullable=False)
    specialty_id = Column(Integer, ForeignKey("specialties.id", ondelete="CASCADE"), nullable=False)
    
    professional = relationship("ProfessionalProfile", back_populates="specialties")
    specialty = relationship("Specialty", back_populates="professionals")
    
    __table_args__ = (
        UniqueConstraint("professional_id", "specialty_id", name="uq_prof_specialty"),
    )

class AvailabilityRule(Base):
    __tablename__ = "availability_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    professional_id = Column(Integer, ForeignKey("professional_profiles.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(String(10), nullable=False)  # "09:00"
    end_time = Column(String(10), nullable=False)    # "17:00"
    slot_duration_minutes = Column(Integer, default=30)
    is_active = Column(Boolean, default=True)
    
    professional = relationship("ProfessionalProfile", back_populates="availability_rules")

class AvailabilityException(Base):
    __tablename__ = "availability_exceptions"
    
    id = Column(Integer, primary_key=True, index=True)
    professional_id = Column(Integer, ForeignKey("professional_profiles.id", ondelete="CASCADE"), nullable=False)
    exception_date = Column(Date, nullable=False)
    is_blocked = Column(Boolean, default=True)
    start_time = Column(String(10), nullable=True)  # if null, full day is blocked
    end_time = Column(String(10), nullable=True)
    reason = Column(String(255), nullable=True)
    
    professional = relationship("ProfessionalProfile", back_populates="availability_exceptions")

class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    booking_reference = Column(String(50), unique=True, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patient_profiles.id", ondelete="CASCADE"), nullable=False)
    professional_id = Column(Integer, ForeignKey("professional_profiles.id", ondelete="CASCADE"), nullable=False)
    facility_id = Column(Integer, ForeignKey("facilities.id", ondelete="CASCADE"), nullable=False)
    appointment_date = Column(Date, nullable=False, index=True)
    slot_time = Column(String(10), nullable=False, index=True)  # "10:30"
    status = Column(String(50), nullable=False, default="confirmed")  # confirmed, delay_reported, rescheduled, completed, cancelled, noshow
    chief_complaint = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    delay_minutes = Column(Integer, default=0)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
    
    patient = relationship("PatientProfile", back_populates="appointments")
    professional = relationship("ProfessionalProfile", back_populates="appointments")
    facility = relationship("Facility", back_populates="appointments")
    status_history = relationship("AppointmentStatusHistory", back_populates="appointment", cascade="all, delete-orphan")
    delay_events = relationship("DelayEvent", back_populates="appointment", cascade="all, delete-orphan")
    proposals = relationship("AlternativeSlotProposal", back_populates="appointment", cascade="all, delete-orphan")
    reminders = relationship("FollowUpReminder", back_populates="appointment", cascade="all, delete-orphan")
    timeline_events = relationship("CareTimelineEvent", back_populates="appointment", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_prof_date_slot", "professional_id", "appointment_date", "slot_time"),
    )

class AppointmentStatusHistory(Base):
    __tablename__ = "appointment_status_histories"
    
    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    changed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    
    appointment = relationship("Appointment", back_populates="status_history")
    changed_by = relationship("User")

class DelayEvent(Base):
    __tablename__ = "delay_events"
    
    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False)
    reported_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    delay_minutes = Column(Integer, nullable=False, default=15)
    reason = Column(String(255), nullable=True)
    clinic_response = Column(String(50), default="pending")  # pending, approved, declined
    created_at = Column(DateTime, default=utcnow)
    
    appointment = relationship("Appointment", back_populates="delay_events")
    reported_by = relationship("User")

class AlternativeSlotProposal(Base):
    __tablename__ = "alternative_slot_proposals"
    
    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False)
    proposed_date = Column(Date, nullable=False)
    proposed_slot_time = Column(String(10), nullable=False)
    status = Column(String(50), default="proposed")  # proposed, accepted, rejected, expired
    created_at = Column(DateTime, default=utcnow)
    
    appointment = relationship("Appointment", back_populates="proposals")

class CareTimelineEvent(Base):
    __tablename__ = "care_timeline_events"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patient_profiles.id", ondelete="CASCADE"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True)
    event_type = Column(String(50), nullable=False)  # booked, delay_reported, rescheduled, cancelled, completed, reminder_created, reminder_completed
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    
    patient = relationship("PatientProfile", back_populates="timeline_events")
    appointment = relationship("Appointment", back_populates="timeline_events")

class FollowUpReminder(Base):
    __tablename__ = "follow_up_reminders"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patient_profiles.id", ondelete="CASCADE"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True)
    reminder_date = Column(Date, nullable=False)
    title = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(String(50), default="pending")  # pending, completed, dismissed
    created_at = Column(DateTime, default=utcnow)
    
    patient = relationship("PatientProfile", back_populates="reminders")
    appointment = relationship("Appointment", back_populates="reminders")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    link = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)
    
    user = relationship("User", back_populates="notifications")

class HealthScheme(Base):
    __tablename__ = "health_schemes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    short_description = Column(Text, nullable=False)
    target_audience = Column(Text, nullable=False)
    benefits = Column(Text, nullable=False)
    required_documents = Column(Text, nullable=False)
    official_url = Column(String(500), nullable=False)
    last_reviewed_date = Column(Date, nullable=False)
    verification_status = Column(String(50), default="Official Verified Source")
    created_at = Column(DateTime, default=utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    target_entity = Column(String(100), nullable=False)
    target_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=utcnow)
    
    user = relationship("User", back_populates="audit_logs")
