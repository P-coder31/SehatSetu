import re
from datetime import date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.db.session import get_db
from app.models.models import ProfessionalProfile, Facility, Specialty, User, ProfessionalFacility, ProfessionalSpecialty
from app.schemas.schemas import SpecialtyOut, FacilityOut, ProviderSearchResult, DayAvailabilitySummary
from app.services.booking_service import get_slots_for_date

router = APIRouter(prefix="/discovery", tags=["Discovery & Search"])

DAYS_STRIP = 14  # number of days to show in the availability strip


def _compute_availability_days(db: Session, prof_id: int) -> tuple[List[DayAvailabilitySummary], Optional[str]]:
    """Compute 14-day availability strip and next_available_date for a professional."""
    today = date.today()
    days: List[DayAvailabilitySummary] = []
    next_available_date: Optional[str] = None

    for i in range(DAYS_STRIP):
        target = today + timedelta(days=i)
        slots = get_slots_for_date(db, prof_id, target)
        available_slots = [s for s in slots if s["is_available"]]
        count = len(available_slots)
        sample = [s["slot_time"] for s in available_slots[:4]]
        is_today = (i == 0)

        days.append(DayAvailabilitySummary(
            date=target.isoformat(),
            day_name="Today" if is_today else target.strftime("%a"),
            formatted_date=f"{target.day} {target.strftime('%b')}",
            available_count=count,
            is_available=count > 0,
            is_today=is_today,
            slots_sample=sample
        ))

        if next_available_date is None and count > 0:
            next_available_date = target.isoformat()

    return days, next_available_date


def _query_filtered_providers(
    db: Session,
    q: Optional[str] = None,
    specialty: Optional[str] = None,
    city: Optional[str] = None,
    gender: Optional[str] = None,
    mode: Optional[str] = None,
    teleconsult: Optional[bool] = None,
    in_person: Optional[bool] = None,
    facility_type: Optional[str] = None,
    min_fee: Optional[int] = None,
    max_fee: Optional[int] = None,
    language: Optional[str] = None,
    available_date: Optional[date] = None,
    sort_by: Optional[str] = "relevance"
) -> List[ProviderSearchResult]:
    """Single source of truth for filtering providers. Used by both search and count endpoints."""
    base_query = db.query(ProfessionalProfile).join(User, ProfessionalProfile.user_id == User.id)

    # 1. Text search: doctor name (with or without 'Dr.' prefix), qualification, bio, services, specialty, facility/showroom
    if q and q.strip():
        raw_q = q.strip()
        term = f"%{raw_q}%"
        # Strip common prefixes like 'Dr.' or 'Dr ' or 'Doctor ' to match full_name directly
        clean_name = re.sub(r'^(dr\.?|doctor)\s+', '', raw_q, flags=re.IGNORECASE).strip()
        clean_term = f"%{clean_name}%" if clean_name else term

        specialty_match_ids = [
            row[0] for row in
            db.query(ProfessionalSpecialty.professional_id)
            .join(Specialty, ProfessionalSpecialty.specialty_id == Specialty.id)
            .filter(
                or_(
                    Specialty.name.ilike(term),
                    Specialty.description.ilike(term)
                )
            )
            .all()
        ]
        facility_match_ids = [
            row[0] for row in
            db.query(ProfessionalFacility.professional_id)
            .join(Facility, ProfessionalFacility.facility_id == Facility.id)
            .filter(
                or_(
                    Facility.name.ilike(term),
                    Facility.city.ilike(term),
                    Facility.address.ilike(term)
                )
            )
            .all()
        ]

        text_conditions = [
            User.full_name.ilike(term),
            User.full_name.ilike(clean_term),
            (ProfessionalProfile.title + " " + User.full_name).ilike(term),
            ProfessionalProfile.qualification.ilike(term),
            ProfessionalProfile.bio.ilike(term),
            ProfessionalProfile.services_offered.ilike(term),
        ]
        if specialty_match_ids:
            text_conditions.append(ProfessionalProfile.id.in_(specialty_match_ids))
        if facility_match_ids:
            text_conditions.append(ProfessionalProfile.id.in_(facility_match_ids))

        base_query = base_query.filter(or_(*text_conditions))

    # 2. Specialty filter
    if specialty and specialty.strip() and specialty.strip().lower() != "all specialties":
        base_query = base_query.join(
            ProfessionalSpecialty,
            ProfessionalSpecialty.professional_id == ProfessionalProfile.id
        ).join(
            Specialty,
            Specialty.id == ProfessionalSpecialty.specialty_id
        ).filter(Specialty.name.ilike(f"%{specialty.strip()}%"))

    # 3. City / Location filter
    if city and city.strip() and city.strip().lower() not in ("all", "any"):
        c_term = f"%{city.strip()}%"
        city_match_ids = [
            row[0] for row in
            db.query(ProfessionalFacility.professional_id)
            .join(Facility, ProfessionalFacility.facility_id == Facility.id)
            .filter(
                or_(
                    Facility.city.ilike(c_term),
                    Facility.address.ilike(c_term),
                    Facility.name.ilike(c_term)
                )
            )
            .all()
        ]
        base_query = base_query.filter(ProfessionalProfile.id.in_(city_match_ids))

    # 3. Gender filter
    if gender and gender.strip() and gender.strip().lower() not in ("any", "all"):
        base_query = base_query.filter(ProfessionalProfile.gender.ilike(gender.strip()))

    # 4. Consultation mode filter
    if mode:
        m = mode.strip().lower()
        if m in ("video", "teleconsultation", "teleconsult"):
            base_query = base_query.filter(ProfessionalProfile.teleconsultation_available == True)
        elif m in ("in_person", "in-person", "clinic"):
            base_query = base_query.filter(ProfessionalProfile.in_person_available == True)

    if teleconsult is True:
        base_query = base_query.filter(ProfessionalProfile.teleconsultation_available == True)
    elif teleconsult is False:
        base_query = base_query.filter(ProfessionalProfile.teleconsultation_available == False)

    if in_person is True:
        base_query = base_query.filter(ProfessionalProfile.in_person_available == True)
    elif in_person is False:
        base_query = base_query.filter(ProfessionalProfile.in_person_available == False)

    # 5. Language filter
    if language and language.strip() and language.strip().lower() not in ("all", "any"):
        base_query = base_query.filter(ProfessionalProfile.languages.ilike(f"%{language.strip()}%"))

    # 6. Fee range
    if min_fee is not None:
        base_query = base_query.filter(ProfessionalProfile.consultation_fee >= min_fee)
    if max_fee is not None:
        base_query = base_query.filter(ProfessionalProfile.consultation_fee <= max_fee)

    # 7. Sorting (pre-pagination)
    if sort_by == "fee_low":
        base_query = base_query.order_by(ProfessionalProfile.consultation_fee.asc())
    elif sort_by == "fee_high":
        base_query = base_query.order_by(ProfessionalProfile.consultation_fee.desc())
    elif sort_by == "experience":
        base_query = base_query.order_by(ProfessionalProfile.experience_years.desc())
    else:
        base_query = base_query.order_by(ProfessionalProfile.id.asc())

    profs = base_query.all()
    results: List[ProviderSearchResult] = []

    for p in profs:
        # Extract specialties
        spec_names = [ps.specialty.name for ps in p.specialties if ps.specialty]

        # Extract facilities
        fac_list = []
        facility_cities = []
        matches_facility_type = True if not facility_type or facility_type.strip().lower() == "all" else False

        for pf in p.facilities:
            f = pf.facility
            if f:
                fac_list.append({
                    "id": f.id,
                    "name": f.name,
                    "facility_type": f.facility_type,
                    "address": f.address,
                    "city": f.city,
                    "is_verified": f.is_verified,
                })
                facility_cities.append(f.city.lower() if f.city else "")
                if f.address:
                    facility_cities.append(f.address.lower())
                if facility_type and facility_type.strip().lower() != "all":
                    if facility_type.strip().lower() in f.facility_type.lower():
                        matches_facility_type = True

        # City / Locality filter
        if city and city.strip():
            city_term = city.strip().lower()
            if not any(city_term in fc for fc in facility_cities):
                continue

        if facility_type and facility_type.strip().lower() != "all" and not matches_facility_type:
            continue

        # Compute 14-day availability strip
        avail_days, next_avail_date = _compute_availability_days(db, p.id)

        # Filter by available_date if requested
        if available_date:
            target_iso = available_date.isoformat()
            day_entry = next((d for d in avail_days if d.date == target_iso), None)
            if not day_entry or not day_entry.is_available:
                if available_date < date.today() or available_date > date.today() + timedelta(days=DAYS_STRIP - 1):
                    direct_slots = get_slots_for_date(db, p.id, available_date)
                    if not any(s["is_available"] for s in direct_slots):
                        continue
                else:
                    continue

        today_entry = next((d for d in avail_days if d.is_today), None)
        avail_slot_times = today_entry.slots_sample if today_entry else []
        dist = round(1.2 + (p.id * 0.7) % 25, 1)

        results.append(ProviderSearchResult(
            id=p.id,
            user_id=p.user_id,
            title=p.title or "Dr.",
            full_name=p.user.full_name if p.user else "Doctor",
            qualification=p.qualification,
            experience_years=p.experience_years,
            consultation_fee=p.consultation_fee,
            verification_status=p.verification_status,
            is_sample=p.is_sample if p.is_sample is not None else True,
            gender=p.gender,
            languages=p.languages,
            teleconsultation_available=p.teleconsultation_available if p.teleconsultation_available is not None else True,
            in_person_available=p.in_person_available if p.in_person_available is not None else True,
            rating=p.rating,
            review_count=p.review_count or 0,
            avatar_seed=p.avatar_seed,
            services_offered=p.services_offered,
            specialties=spec_names,
            facilities=fac_list,
            available_slots_sample=avail_slot_times,
            distance_km=dist,
            next_available_date=next_avail_date,
            availability_days=avail_days,
        ))

    # Sort by earliest available post-compute
    if sort_by == "earliest_available":
        def _earliest_key(r: ProviderSearchResult) -> str:
            return r.next_available_date or "9999-12-31"
        results.sort(key=_earliest_key)

    return results


@router.get("/specialties", response_model=List[SpecialtyOut])
def list_specialties(db: Session = Depends(get_db)):
    return db.query(Specialty).order_by(Specialty.name).all()


@router.get("/facilities", response_model=List[FacilityOut])
def list_facilities(
    facility_type: Optional[str] = None,
    city: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Facility)
    if facility_type:
        q = q.filter(Facility.facility_type.ilike(f"%{facility_type}%"))
    if city:
        q = q.filter(Facility.city.ilike(f"%{city}%"))
    return q.all()


@router.get("/providers", response_model=List[ProviderSearchResult])
def search_providers(
    response: Response = Response(),
    q: Optional[str] = Query(None, description="Search term for doctor, specialty, or service"),
    specialty: Optional[str] = Query(None, description="Specialty name"),
    city: Optional[str] = Query(None, description="City or locality"),
    gender: Optional[str] = Query(None, description="Male, Female, Any"),
    mode: Optional[str] = Query(None, description="video or in_person"),
    teleconsult: Optional[bool] = Query(None, description="Filter by teleconsultation availability"),
    in_person: Optional[bool] = Query(None, description="Filter by in-person availability"),
    language: Optional[str] = Query(None, description="Language spoken"),
    facility_type: Optional[str] = Query(None, description="Government, Private, etc."),
    min_fee: Optional[int] = Query(None, description="Minimum consultation fee"),
    max_fee: Optional[int] = Query(None, description="Maximum consultation fee"),
    available_date: Optional[date] = Query(None, description="Filter by a specific available date"),
    sort_by: Optional[str] = Query("relevance", description="relevance, fee_low, fee_high, experience, earliest_available"),
    limit: int = Query(15, ge=1, le=100, description="Number of results per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    db: Session = Depends(get_db)
):
    # Sanitize inputs
    q_val = q if isinstance(q, str) and q.strip() else None
    specialty_val = specialty if isinstance(specialty, str) and specialty.strip() else None
    city_val = city if isinstance(city, str) and city.strip() else None
    gender_val = gender if isinstance(gender, str) and gender.strip() else None
    mode_val = mode if isinstance(mode, str) and mode.strip() else None
    teleconsult_val = teleconsult if isinstance(teleconsult, bool) else None
    in_person_val = in_person if isinstance(in_person, bool) else None
    language_val = language if isinstance(language, str) and language.strip() else None
    facility_type_val = facility_type if isinstance(facility_type, str) and facility_type.strip() else None
    min_fee_val = min_fee if isinstance(min_fee, int) else None
    max_fee_val = max_fee if isinstance(max_fee, int) else None
    available_date_val = available_date if isinstance(available_date, date) else None
    sort_by_val = sort_by if isinstance(sort_by, str) else "relevance"
    limit_val = limit if isinstance(limit, int) else 15
    offset_val = offset if isinstance(offset, int) else 0

    all_matching = _query_filtered_providers(
        db=db,
        q=q_val,
        specialty=specialty_val,
        city=city_val,
        gender=gender_val,
        mode=mode_val,
        teleconsult=teleconsult_val,
        in_person=in_person_val,
        language=language_val,
        facility_type=facility_type_val,
        min_fee=min_fee_val,
        max_fee=max_fee_val,
        available_date=available_date_val,
        sort_by=sort_by_val
    )

    total_matching = len(all_matching)
    verified_count = sum(1 for p in all_matching if not p.is_sample and p.verification_status == "verified")
    demo_count = sum(1 for p in all_matching if p.is_sample)

    if response:
        response.headers["X-Total-Count"] = str(total_matching)
        response.headers["X-Verified-Count"] = str(verified_count)
        response.headers["X-Demo-Count"] = str(demo_count)

    paginated = all_matching[offset_val: offset_val + limit_val]
    return paginated


@router.get("/providers/count")
def count_providers(
    q: Optional[str] = Query(None),
    specialty: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    gender: Optional[str] = Query(None),
    mode: Optional[str] = Query(None),
    teleconsult: Optional[bool] = Query(None),
    in_person: Optional[bool] = Query(None),
    language: Optional[str] = Query(None),
    facility_type: Optional[str] = Query(None),
    min_fee: Optional[int] = Query(None),
    max_fee: Optional[int] = Query(None),
    available_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    """Accurately calculates matching counts using the exact same filtering logic."""
    q_val = q if isinstance(q, str) and q.strip() else None
    specialty_val = specialty if isinstance(specialty, str) and specialty.strip() else None
    city_val = city if isinstance(city, str) and city.strip() else None
    gender_val = gender if isinstance(gender, str) and gender.strip() else None
    mode_val = mode if isinstance(mode, str) and mode.strip() else None
    teleconsult_val = teleconsult if isinstance(teleconsult, bool) else None
    in_person_val = in_person if isinstance(in_person, bool) else None
    language_val = language if isinstance(language, str) and language.strip() else None
    facility_type_val = facility_type if isinstance(facility_type, str) and facility_type.strip() else None
    min_fee_val = min_fee if isinstance(min_fee, int) else None
    max_fee_val = max_fee if isinstance(max_fee, int) else None
    available_date_val = available_date if isinstance(available_date, date) else None

    all_matching = _query_filtered_providers(
        db=db,
        q=q_val,
        specialty=specialty_val,
        city=city_val,
        gender=gender_val,
        mode=mode_val,
        teleconsult=teleconsult_val,
        in_person=in_person_val,
        language=language_val,
        facility_type=facility_type_val,
        min_fee=min_fee_val,
        max_fee=max_fee_val,
        available_date=available_date_val,
        sort_by="relevance"
    )

    total_matching = len(all_matching)
    verified_count = sum(1 for p in all_matching if not p.is_sample and p.verification_status == "verified")
    demo_count = sum(1 for p in all_matching if p.is_sample)

    return {
        "total": total_matching,
        "verified_count": verified_count,
        "demo_count": demo_count
    }


@router.get("/providers/{id}")
def get_provider_details(id: int, db: Session = Depends(get_db)):
    prof = db.query(ProfessionalProfile).filter(ProfessionalProfile.id == id).first()
    if not prof:
        raise HTTPException(status_code=404, detail="Healthcare provider not found.")

    spec_list = [{"id": ps.specialty.id, "name": ps.specialty.name} for ps in prof.specialties if ps.specialty]
    fac_list = [{
        "id": pf.facility.id,
        "name": pf.facility.name,
        "facility_type": pf.facility.facility_type,
        "address": pf.facility.address,
        "city": pf.facility.city,
        "phone": pf.facility.phone
    } for pf in prof.facilities if pf.facility]

    today = date.today()
    slots_today = get_slots_for_date(db, prof.id, today)

    languages_list = [lang.strip() for lang in (prof.languages or "English, Hindi").split(",") if lang.strip()]
    services_list = [s.strip() for s in (prof.services_offered or "").split(",") if s.strip()]

    return {
        "id": prof.id,
        "user_id": prof.user_id,
        "title": prof.title or "Dr.",
        "full_name": prof.user.full_name if prof.user else "Doctor",
        "email": prof.user.email if prof.user else "",
        "phone": prof.user.phone if prof.user else "",
        "registration_number": prof.registration_number,
        "qualification": prof.qualification,
        "bio": prof.bio,
        "consultation_fee": prof.consultation_fee,
        "experience_years": prof.experience_years,
        "verification_status": prof.verification_status,
        "gender": prof.gender,
        "languages": prof.languages,
        "languages_list": languages_list,
        "teleconsultation_available": prof.teleconsultation_available,
        "in_person_available": prof.in_person_available if prof.in_person_available is not None else True,
        "is_sample": prof.is_sample if prof.is_sample is not None else True,
        "rating": prof.rating,
        "review_count": prof.review_count or 0,
        "avatar_seed": prof.avatar_seed,
        "services_offered": prof.services_offered,
        "services_list": services_list,
        "specialties": spec_list,
        "facilities": fac_list,
        "slots_today": slots_today,
        "monthly_report": {
            "month_label": "September 2026 (Last Month)",
            "patients_treated": 142 + (prof.id * 17) % 35,
            "patients_reviewed": 38 + (prof.id * 5) % 15,
            "profile_views": 1240 + (prof.id * 180) % 450,
            "on_time_rate": "97.4%",
            "average_rating": prof.rating or 4.9,
            "delay_holds_saved": 8,
            "recommendation_rate": "98%"
        }
    }


@router.get("/slots")
def query_doctor_slots(
    professional_id: int,
    target_date: date,
    db: Session = Depends(get_db)
):
    slots = get_slots_for_date(db, professional_id, target_date)
    return {"professional_id": professional_id, "date": target_date.isoformat(), "slots": slots}
