from app.db.session import Base
from app.models.models import (
    User, PatientProfile, ProfessionalProfile, Facility, Specialty,
    ProfessionalFacility, ProfessionalSpecialty, AvailabilityRule,
    AvailabilityException, Appointment, AppointmentStatusHistory,
    DelayEvent, AlternativeSlotProposal, CareTimelineEvent,
    FollowUpReminder, Notification, HealthScheme, AuditLog
)
