from datetime import date, datetime, timedelta, timezone
from app.db.session import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.models import (
    User, PatientProfile, ProfessionalProfile, Facility, Specialty,
    ProfessionalFacility, ProfessionalSpecialty, AvailabilityRule,
    AvailabilityException, Appointment, AppointmentStatusHistory,
    CareTimelineEvent, FollowUpReminder, Notification, HealthScheme, AuditLog
)
from app.db.migrate_schema import run_migrations
from app.db.provider_seed_data import FACILITIES_SEED, SPECIALTIES_SEED, DOCTORS_SEED

def seed_database():
    # 1. Ensure schema migration is up-to-date
    run_migrations()
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("[SEED] Seeding SehatSetu database with realistic demo directory...")

        # 2. SPECIALTIES (18 Specialties)
        specialty_map = {}
        for name, desc, icon in SPECIALTIES_SEED:
            spec = db.query(Specialty).filter(Specialty.name == name).first()
            if not spec:
                spec = Specialty(name=name, description=desc, icon_name=icon)
                db.add(spec)
                db.flush()
            else:
                spec.description = desc
                spec.icon_name = icon
            specialty_map[name] = spec

        # Also map legacy short specialty names to prevent broken links
        legacy_aliases = {
            "General Physician": "General Physician / Internal Medicine",
            "Internal Medicine": "General Physician / Internal Medicine",
            "Orthopedics": "Orthopedic Specialist",
            "Dental Care": "Dentist",
            "Obstetrics & Gynaecology": "Gynecologist"
        }
        for alias, target in legacy_aliases.items():
            if target in specialty_map:
                specialty_map[alias] = specialty_map[target]

        # 3. FACILITIES (19 Facilities)
        facility_map = {}
        for f_data in FACILITIES_SEED:
            fac = db.query(Facility).filter(Facility.name == f_data["name"]).first()
            if not fac:
                fac = Facility(**f_data, is_verified=True)
                db.add(fac)
                db.flush()
            else:
                for k, v in f_data.items():
                    setattr(fac, k, v)
                fac.is_verified = True
            facility_map[f_data["name"]] = fac

        # 4. SYSTEM USERS: ADMIN AND PATIENTS
        system_users = [
            # Admin
            {
                "email": "admin@sehatsetu.gov.in",
                "password": "Admin@SehatSetu2026",
                "full_name": "Dr. Manisha Gupta (Chief Medical Officer)",
                "role": "admin",
                "phone": "+91 98110 00001"
            },
            # Patients
            {
                "email": "asha@example.com",
                "password": "Patient@SehatSetu2026",
                "full_name": "Asha Patel",
                "role": "patient",
                "phone": "+91 98765 43210"
            },
            {
                "email": "asha.patel@example.com",
                "password": "Patient@SehatSetu2026",
                "full_name": "Asha Patel",
                "role": "patient",
                "phone": "+91 98765 43210"
            },
            {
                "email": "ravi@example.com",
                "password": "Patient@SehatSetu2026",
                "full_name": "Ravi Kumar",
                "role": "patient",
                "phone": "+91 98765 12345"
            },
            {
                "email": "meena@example.com",
                "password": "Patient@SehatSetu2026",
                "full_name": "Meena Devi",
                "role": "patient",
                "phone": "+91 98765 67890"
            }
        ]

        user_map = {}
        for u_data in system_users:
            user = db.query(User).filter(User.email == u_data["email"]).first()
            if not user:
                user = User(
                    email=u_data["email"],
                    hashed_password=get_password_hash(u_data["password"]),
                    full_name=u_data["full_name"],
                    role=u_data["role"],
                    phone=u_data.get("phone"),
                    is_active=True
                )
                db.add(user)
                db.flush()
            user_map[u_data["email"]] = user

            # Patient profile
            if u_data["role"] == "patient":
                pat = db.query(PatientProfile).filter(PatientProfile.user_id == user.id).first()
                is_asha = "asha" in user.email.lower()
                if not pat:
                    pat = PatientProfile(
                        user_id=user.id,
                        city="Sonipat",
                        dob=date(1992, 5, 14),
                        gender="Female" if "Devi" in user.full_name or "Asha" in user.full_name else "Male",
                        emergency_contact="+91 98765 99999",
                        blood_group="B+",
                        is_aadhaar_verified=is_asha,
                        masked_aadhaar="XXXX XXXX 8921" if is_asha else None,
                        aadhaar_verified_at=datetime.now(timezone.utc) if is_asha else None,
                        abha_number="91-4589-2134-7890" if is_asha else None,
                        abha_address="ashapatel@abdm" if is_asha else None,
                    )
                    db.add(pat)
                else:
                    if is_asha and not pat.is_aadhaar_verified:
                        pat.is_aadhaar_verified = True
                        pat.masked_aadhaar = "XXXX XXXX 8921"
                        pat.aadhaar_verified_at = datetime.now(timezone.utc)
                        pat.abha_number = "91-4589-2134-7890"
                        pat.abha_address = "ashapatel@abdm"

        # 5. SEED ALL 82 FICTIONAL HEALTHCARE PROFESSIONALS
        today = date.today()
        seeded_prof_count = 0

        for idx, doc_data in enumerate(DOCTORS_SEED):
            email = doc_data["email"]
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    email=email,
                    hashed_password=get_password_hash("Doctor@SehatSetu2026"),
                    full_name=doc_data["full_name"],
                    role="professional",
                    phone=f"+91 98120 {idx + 10000:05d}",
                    is_active=True
                )
                db.add(user)
                db.flush()
            else:
                user.full_name = doc_data["full_name"]

            # Professional Profile
            prof = db.query(ProfessionalProfile).filter(ProfessionalProfile.user_id == user.id).first()
            if not prof:
                prof = ProfessionalProfile(
                    user_id=user.id,
                    title=doc_data.get("title", "Dr."),
                    registration_number=doc_data["registration_number"],
                    qualification=doc_data["qualification"],
                    bio=doc_data["bio"],
                    consultation_fee=doc_data["consultation_fee"],
                    experience_years=doc_data["experience_years"],
                    verification_status=doc_data.get("verification_status", "unverified"),
                    verification_notes="Fictional demo profile for development and testing",
                    gender=doc_data.get("gender", "Any"),
                    languages=doc_data.get("languages", "English, Hindi"),
                    teleconsultation_available=doc_data.get("teleconsultation_available", True),
                    in_person_available=doc_data.get("in_person_available", True),
                    is_sample=True,
                    rating=None,  # Zero fabricated ratings
                    review_count=0,
                    avatar_seed=f"doc_{idx}_{doc_data.get('gender', 'M')}",
                    services_offered=doc_data.get("services_offered", "")
                )
                db.add(prof)
                db.flush()
            else:
                # Update existing doctor attributes
                prof.title = doc_data.get("title", "Dr.")
                prof.registration_number = doc_data["registration_number"]
                prof.qualification = doc_data["qualification"]
                prof.bio = doc_data["bio"]
                prof.consultation_fee = doc_data["consultation_fee"]
                prof.experience_years = doc_data["experience_years"]
                prof.verification_status = doc_data.get("verification_status", "unverified")
                prof.verification_notes = "Fictional demo profile for development and testing"
                prof.gender = doc_data.get("gender", "Any")
                prof.languages = doc_data.get("languages", "English, Hindi")
                prof.teleconsultation_available = doc_data.get("teleconsultation_available", True)
                prof.in_person_available = doc_data.get("in_person_available", True)
                prof.is_sample = True
                prof.services_offered = doc_data.get("services_offered", "")

            # Facility associations
            target_fac_ids = []
            for fac_name in doc_data.get("facilities", []):
                fac = facility_map.get(fac_name)
                if fac:
                    target_fac_ids.append(fac.id)
                    assoc = db.query(ProfessionalFacility).filter(
                        ProfessionalFacility.professional_id == prof.id,
                        ProfessionalFacility.facility_id == fac.id
                    ).first()
                    if not assoc:
                        db.add(ProfessionalFacility(professional_id=prof.id, facility_id=fac.id, is_primary=True))
            if target_fac_ids:
                db.query(ProfessionalFacility).filter(
                    ProfessionalFacility.professional_id == prof.id,
                    ~ProfessionalFacility.facility_id.in_(target_fac_ids)
                ).delete(synchronize_session=False)

            # Specialty associations
            target_spec_ids = []
            for spec_name in doc_data.get("specialties", []):
                spec = specialty_map.get(spec_name)
                if spec:
                    target_spec_ids.append(spec.id)
                    assoc = db.query(ProfessionalSpecialty).filter(
                        ProfessionalSpecialty.professional_id == prof.id,
                        ProfessionalSpecialty.specialty_id == spec.id
                    ).first()
                    if not assoc:
                        db.add(ProfessionalSpecialty(professional_id=prof.id, specialty_id=spec.id))
            if target_spec_ids:
                db.query(ProfessionalSpecialty).filter(
                    ProfessionalSpecialty.professional_id == prof.id,
                    ~ProfessionalSpecialty.specialty_id.in_(target_spec_ids)
                ).delete(synchronize_session=False)

            # Availability Rules based on schedule_type
            sched_type = doc_data.get("schedule_type", "morning")
            existing_rules_count = db.query(AvailabilityRule).filter(AvailabilityRule.professional_id == prof.id).count()
            if existing_rules_count == 0:
                if sched_type == "morning":
                    # Mon-Fri: 09:00 - 13:00 (slot 30m)
                    for day in range(5):
                        db.add(AvailabilityRule(
                            professional_id=prof.id,
                            day_of_week=day,
                            start_time="09:00",
                            end_time="13:00",
                            slot_duration_minutes=30,
                            is_active=True
                        ))
                elif sched_type == "afternoon":
                    # Mon-Sat: 13:00 - 17:00 (slot 30m)
                    for day in range(6):
                        db.add(AvailabilityRule(
                            professional_id=prof.id,
                            day_of_week=day,
                            start_time="13:00",
                            end_time="17:00",
                            slot_duration_minutes=30,
                            is_active=True
                        ))
                elif sched_type == "evening":
                    # Tue-Sat: 16:30 - 20:30 (slot 20m)
                    for day in range(1, 6):
                        db.add(AvailabilityRule(
                            professional_id=prof.id,
                            day_of_week=day,
                            start_time="16:30",
                            end_time="20:30",
                            slot_duration_minutes=20,
                            is_active=True
                        ))
                elif sched_type == "weekend":
                    # Fri-Sun: 10:00 - 15:00 (slot 30m)
                    for day in [4, 5, 6]:
                        db.add(AvailabilityRule(
                            professional_id=prof.id,
                            day_of_week=day,
                            start_time="10:00",
                            end_time="15:00",
                            slot_duration_minutes=30,
                            is_active=True
                        ))
                else:  # full_day
                    # Mon-Sat: 09:00 - 17:00 (slot 30m)
                    for day in range(6):
                        db.add(AvailabilityRule(
                            professional_id=prof.id,
                            day_of_week=day,
                            start_time="09:00",
                            end_time="17:00",
                            slot_duration_minutes=30,
                            is_active=True
                        ))

            # Realistic schedule variations:
            # - For 1 in 5 doctors: blocked on today (e.g. inpatient rounds / surgery) -> Next available tomorrow or +2 days!
            # - For 1 in 7 doctors: blocked today & tomorrow (e.g. medical conference) -> Next available +3 days!
            if idx % 7 == 0:
                ex1 = db.query(AvailabilityException).filter(
                    AvailabilityException.professional_id == prof.id,
                    AvailabilityException.exception_date == today
                ).first()
                if not ex1:
                    db.add(AvailabilityException(
                        professional_id=prof.id,
                        exception_date=today,
                        is_blocked=True,
                        reason="Emergency Inpatient Surgery Duty"
                    ))
                ex2 = db.query(AvailabilityException).filter(
                    AvailabilityException.professional_id == prof.id,
                    AvailabilityException.exception_date == today + timedelta(days=1)
                ).first()
                if not ex2:
                    db.add(AvailabilityException(
                        professional_id=prof.id,
                        exception_date=today + timedelta(days=1),
                        is_blocked=True,
                        reason="Medical Council Academic Conference"
                    ))
            elif idx % 4 == 0:
                ex1 = db.query(AvailabilityException).filter(
                    AvailabilityException.professional_id == prof.id,
                    AvailabilityException.exception_date == today
                ).first()
                if not ex1:
                    db.add(AvailabilityException(
                        professional_id=prof.id,
                        exception_date=today,
                        is_blocked=True,
                        reason="Weekly Departmental Rounds"
                    ))

            seeded_prof_count += 1

        print(f"[SEED] Successfully seeded {seeded_prof_count} healthcare professionals.")

        # 6. HEALTH SCHEMES (4 Schemes)
        schemes_data = [
            {
                "name": "Ayushman Bharat PM-JAY",
                "short_description": "Comprehensive cashless inpatient treatment cover of up to ₹5 lakh per family per year for secondary and tertiary healthcare.",
                "target_audience": "Families categorized under bottom 40% income bracket as per Socio-Economic Caste Census (SECC) 2011 data across India.",
                "benefits": "Free pre & post hospitalization, surgeries, medical diagnostics, medicines, ICU care, and food during admission in over 27,000 empaneled hospitals.",
                "required_documents": "Aadhaar Card, Ration Card / Family ID, PM-JAY letter or Ayushman Card.",
                "official_url": "https://pmjay.gov.in",
                "last_reviewed_date": date(2026, 8, 1),
                "verification_status": "National Health Authority Verified"
            },
            {
                "name": "e-Sanjeevani",
                "short_description": "National Teleconsultation Service enabling citizens to consult certified government doctors and specialists online for free.",
                "target_audience": "All citizens across India, especially in rural, remote, and semi-urban communities with limited direct specialist access.",
                "benefits": "Free video/audio doctor consults, instant downloadable digital prescription valid at pharmacies, and direct referrals to community health centres.",
                "required_documents": "Mobile number for OTP verification. Previous medical records/reports (optional, for doctor review).",
                "official_url": "https://esanjeevani.mohfw.gov.in",
                "last_reviewed_date": date(2026, 9, 15),
                "verification_status": "MoHFW Government Verified"
            },
            {
                "name": "Janani Suraksha Yojana",
                "short_description": "Safe motherhood intervention promoting institutional delivery among poor pregnant women through conditional cash assistance.",
                "target_audience": "Pregnant women belonging to BPL/SC/ST households delivering in government health centres or accredited private facilities.",
                "benefits": "Direct benefit cash assistance (₹1,400 rural / ₹1,000 urban in low-performing states), free delivery, post-natal checkups, and infant vaccines.",
                "required_documents": "Mother and Child Protection (MCP) Card, BPL Card / proof of eligibility, Bank Account details, Aadhaar Card.",
                "official_url": "https://nhm.gov.in",
                "last_reviewed_date": date(2026, 7, 20),
                "verification_status": "National Health Mission Verified"
            },
            {
                "name": "Rashtriya Bal Swasthya Karyakram",
                "short_description": "Child health screening and early intervention services covering 4 'D's: Defects at birth, Deficiencies, Diseases, and Developmental delays.",
                "target_audience": "Children from birth up to 18 years enrolled in government/aided schools, Anganwadi centres, and preschools.",
                "benefits": "Free screening for 30 selected health conditions, free surgical interventions at District Early Intervention Centres (DEIC).",
                "required_documents": "Birth Certificate, School/Anganwadi ID Card, Aadhaar Card of Parent/Guardian.",
                "official_url": "https://nhm.gov.in/index1.php?lang=1&level=2&sublinkid=818&lid=218",
                "last_reviewed_date": date(2026, 6, 10),
                "verification_status": "National Health Mission Verified"
            }
        ]

        for s_data in schemes_data:
            sch = db.query(HealthScheme).filter(HealthScheme.name == s_data["name"]).first()
            if not sch:
                sch = HealthScheme(**s_data)
                db.add(sch)

        # 7. SEED BASELINE DEMO APPOINTMENTS & CARE CONTINUITY EVENTS
        asha_user = user_map.get("asha.patel@example.com")
        rajesh_user = db.query(User).filter(User.email == "dr.rajesh@sehatsetu.demo").first()
        civil_hosp = facility_map.get("Sonipat Civil Hospital OPD")

        if asha_user and asha_user.patient_profile and rajesh_user and rajesh_user.professional_profile and civil_hosp:
            pat_id = asha_user.patient_profile.id
            prof_id = rajesh_user.professional_profile.id
            fac_id = civil_hosp.id

            existing_appts = db.query(Appointment).filter(
                Appointment.patient_id == pat_id,
                Appointment.professional_id == prof_id
            ).count()

            if existing_appts == 0:
                # 1. Confirmed appointment for tomorrow
                tomorrow = today + timedelta(days=1)
                appt1 = Appointment(
                    booking_reference="SS-2026-DEMO01",
                    patient_id=pat_id,
                    professional_id=prof_id,
                    facility_id=fac_id,
                    appointment_date=tomorrow,
                    slot_time="10:00",
                    status="confirmed",
                    chief_complaint="Seasonal fever, fatigue, and general health review",
                    notes="Patient has FairSlot guaranteed slot",
                    delay_minutes=0
                )
                db.add(appt1)
                db.flush()

                # Status History
                db.add(AppointmentStatusHistory(
                    appointment_id=appt1.id,
                    previous_status=None,
                    new_status="confirmed",
                    changed_by_user_id=asha_user.id,
                    notes="Booked online via SehatSetu Patient Portal"
                ))

                # Timeline Event
                db.add(CareTimelineEvent(
                    patient_id=pat_id,
                    appointment_id=appt1.id,
                    event_type="booked",
                    title="Appointment Booked: General Medicine",
                    description=f"Consultation with Dr. Rajesh Kumar at Sonipat Civil Hospital OPD for {tomorrow.isoformat()} at 10:00 AM."
                ))

                # Follow-Up Reminder
                db.add(FollowUpReminder(
                    patient_id=pat_id,
                    appointment_id=appt1.id,
                    reminder_date=tomorrow + timedelta(days=3),
                    title="Follow-up Blood Pressure & Glucose Review",
                    notes="Check fasting blood glucose at local Ayushman Arogya Mandir before follow-up.",
                    status="pending"
                ))

                # In-App Notification
                db.add(Notification(
                    user_id=asha_user.id,
                    title="Appointment Confirmed",
                    message=f"Your appointment with Dr. Rajesh Kumar is confirmed for {tomorrow.isoformat()} at 10:00 AM. (Ref: SS-2026-DEMO01)",
                    link="/dashboard/appointments"
                ))

        # 8. AUDIT LOG
        admin_user = user_map.get("admin@sehatsetu.gov.in")
        if admin_user:
            db.add(AuditLog(
                user_id=admin_user.id,
                action="DATABASE_SEED",
                target_entity="Directory",
                target_id="82_PROVIDERS",
                details="Idempotent seed completed: 82 healthcare professionals, 19 facilities, 18 specialties, schemes, and demo records."
            ))

        db.commit()
        print("[SEED] Database seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"[SEED ERROR] Failed to seed database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
