from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# --- AUTH & USER ---
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str
    role: str = Field(default="patient")  # patient, professional
    phone: Optional[str] = None
    # If professional:
    registration_number: Optional[str] = None
    qualification: Optional[str] = None
    consultation_fee: Optional[int] = 300
    specialty_id: Optional[int] = None
    facility_id: Optional[int] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    full_name: str
    email: str

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# --- SPECIALTY & FACILITY ---
class SpecialtyOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    icon_name: Optional[str] = "Stethoscope"
    
    model_config = ConfigDict(from_attributes=True)

class FacilityOut(BaseModel):
    id: int
    name: str
    facility_type: str
    address: str
    city: str
    state: str
    pincode: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_verified: bool
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    model_config = ConfigDict(from_attributes=True)

class FacilityCreate(BaseModel):
    name: str
    facility_type: str = "Government"
    address: str
    city: str = "Sonipat"
    state: str = "Haryana"
    pincode: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

# --- PROFESSIONAL ---
class ProfessionalProfileOut(BaseModel):
    id: int
    user_id: int
    title: str
    full_name: str
    email: str
    registration_number: str
    qualification: str
    bio: Optional[str] = None
    consultation_fee: int
    experience_years: int
    verification_status: str
    verification_notes: Optional[str] = None
    facilities: List[FacilityOut] = []
    specialties: List[SpecialtyOut] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ProfessionalOnboarding(BaseModel):
    title: str = "Dr."
    registration_number: str
    qualification: str
    bio: Optional[str] = None
    consultation_fee: int = 300
    experience_years: int = 5
    facility_ids: List[int] = []
    specialty_ids: List[int] = []

class ProfessionalVerificationUpdate(BaseModel):
    status: str = Field(description="verified or rejected")
    verification_notes: Optional[str] = None

class AvailabilityRuleIn(BaseModel):
    day_of_week: int  # 0 to 6
    start_time: str   # "09:00"
    end_time: str     # "17:00"
    slot_duration_minutes: int = 30

class AvailabilityRuleOut(AvailabilityRuleIn):
    id: int
    professional_id: int
    is_active: bool
    
    model_config = ConfigDict(from_attributes=True)

class AvailabilityExceptionIn(BaseModel):
    exception_date: date
    is_blocked: bool = True
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    reason: Optional[str] = None

class AvailabilityExceptionOut(AvailabilityExceptionIn):
    id: int
    professional_id: int
    
    model_config = ConfigDict(from_attributes=True)

# --- DISCOVERY ---
class DayAvailabilitySummary(BaseModel):
    date: str
    day_name: str
    formatted_date: str
    available_count: int
    is_available: bool
    is_today: bool = False
    slots_sample: List[str] = []

class ProviderSearchResult(BaseModel):
    id: int
    user_id: int
    title: str
    full_name: str
    qualification: str
    experience_years: int
    consultation_fee: int
    verification_status: str
    is_sample: bool = True
    gender: Optional[str] = None
    languages: Optional[str] = None
    teleconsultation_available: bool = True
    in_person_available: bool = True
    rating: Optional[float] = None
    review_count: int = 0
    avatar_seed: Optional[str] = None
    services_offered: Optional[str] = None
    specialties: List[str]
    facilities: List[dict]
    available_slots_sample: List[str] = []
    distance_km: Optional[float] = None
    next_available_date: Optional[str] = None
    availability_days: List[DayAvailabilitySummary] = []

class SlotQuery(BaseModel):
    professional_id: int
    target_date: date

class SlotInfo(BaseModel):
    slot_time: str
    is_available: bool
    reason: Optional[str] = None

# --- APPOINTMENTS & BOOKING ---
class BookingCreate(BaseModel):
    professional_id: int
    facility_id: int
    appointment_date: date
    slot_time: str = Field(description="Format HH:MM e.g. 10:30")
    chief_complaint: Optional[str] = None
    notes: Optional[str] = None

class AppointmentReschedule(BaseModel):
    new_date: date
    new_slot_time: str

class AppointmentCancel(BaseModel):
    reason: Optional[str] = "Patient cancelled"

class DoctorRescheduleRequest(BaseModel):
    new_date: date
    new_slot_time: str
    reason: str = "Emergency surgery / Clinical duty"
    notes: Optional[str] = None

class DoctorCancelRequest(BaseModel):
    reason: str = "Clinical emergency"
    notes: Optional[str] = None

class PatientRescheduleDecision(BaseModel):
    decision: str = Field(description="accept or decline")
    action: Optional[str] = "cancel"  # "cancel" or "pick_another"
    alternate_date: Optional[date] = None
    alternate_slot_time: Optional[str] = None
    reason: Optional[str] = None

class AppointmentOut(BaseModel):
    id: int
    booking_reference: str
    patient_id: int
    patient_name: str
    professional_id: int
    doctor_name: str
    doctor_specialties: List[str] = []
    facility_id: int
    facility_name: str
    facility_address: str
    appointment_date: date
    slot_time: str
    status: str
    chief_complaint: Optional[str] = None
    notes: Optional[str] = None
    delay_minutes: int = 0
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# --- CARE CONTINUITY ---
class DelayReportIn(BaseModel):
    appointment_id: int
    delay_minutes: int = Field(default=15, ge=5, le=120)
    reason: Optional[str] = None

class ClinicDelayResponseIn(BaseModel):
    appointment_id: int
    approve: bool
    notes: Optional[str] = None
    propose_alternative_slot: Optional[str] = None
    propose_alternative_date: Optional[date] = None

class AlternativeSlotProposalOut(BaseModel):
    id: int
    appointment_id: int
    proposed_date: date
    proposed_slot_time: str
    status: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class AlternativeSlotActionIn(BaseModel):
    proposal_id: int
    action: str = Field(description="accept or reject")

class CareTimelineEventOut(BaseModel):
    id: int
    patient_id: int
    appointment_id: Optional[int] = None
    event_type: str
    title: str
    description: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class FollowUpReminderCreate(BaseModel):
    patient_id: Optional[int] = None
    appointment_id: Optional[int] = None
    reminder_date: date
    title: str
    notes: Optional[str] = None

class FollowUpReminderOut(BaseModel):
    id: int
    patient_id: int
    appointment_id: Optional[int] = None
    reminder_date: date
    title: str
    notes: Optional[str] = None
    status: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# --- HEALTH SCHEMES ---
class HealthSchemeOut(BaseModel):
    id: int
    name: str
    short_description: str
    target_audience: str
    benefits: str
    required_documents: str
    official_url: str
    last_reviewed_date: date
    verification_status: str
    
    model_config = ConfigDict(from_attributes=True)

class HealthSchemeExplainRequest(BaseModel):
    scheme_id: int
    language: str = Field(default="en", description="Language code e.g. hi, bn, mr, te, ta, gu, ur, kn, or, ml, pa, en")

class HealthSchemeExplainResponse(BaseModel):
    scheme_id: int
    scheme_name: str
    language: str
    language_name: Optional[str] = None
    native_name: Optional[str] = None
    summary_simple: str
    who_can_apply: str
    key_benefits: str
    how_to_access: str
    official_url: str
    source_disclaimer: str
    ai_generated: bool

# --- ADMIN ---
class AdminDashboardStats(BaseModel):
    total_users: int
    total_patients: int
    total_professionals: int
    pending_verifications: int
    total_facilities: int
    total_appointments: int
    appointments_by_status: dict
    active_delays: int
    total_schemes: int

class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    action: str
    target_entity: str
    target_id: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# --- AADHAAR & ABHA SCHEMAS ---
class AadhaarGenerateOtpIn(BaseModel):
    aadhaar_number: str = Field(..., description="12-digit Aadhaar number")

class AadhaarVerifyOtpIn(BaseModel):
    txn_id: str = Field(..., description="Transaction ID from generate-otp")
    otp: str = Field(..., description="6-digit OTP")
