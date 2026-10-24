from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.models import User, PatientProfile, ProfessionalProfile, AuditLog
from app.schemas.schemas import UserLogin, UserRegister, Token, UserOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    # Check if email exists
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )
    
    role = payload.role if payload.role in ["patient", "professional"] else "patient"
    hashed = get_password_hash(payload.password)
    
    user = User(
        email=payload.email.lower().strip(),
        hashed_password=hashed,
        full_name=payload.full_name.strip(),
        phone=payload.phone,
        role=role,
        is_active=True
    )
    db.add(user)
    db.flush()

    if role == "patient":
        profile = PatientProfile(user_id=user.id, city="Sonipat")
        db.add(profile)
    elif role == "professional":
        prof_profile = ProfessionalProfile(
            user_id=user.id,
            title="Dr.",
            registration_number=payload.registration_number or f"MCI-2026-{user.id:04d}",
            qualification=payload.qualification or "MBBS",
            consultation_fee=payload.consultation_fee or 300,
            experience_years=5,
            verification_status="pending"
        )
        db.add(prof_profile)

    audit = AuditLog(
        user_id=user.id,
        action="USER_REGISTERED",
        target_entity="User",
        target_id=str(user.id),
        details=f"Registered with role: {role}"
    )
    db.add(audit)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email
    }

@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended. Please contact administrator."
        )

    token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email
    }

@router.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username.lower().strip()).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email
    }

@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/bootstrap-admin")
def bootstrap_admin(db: Session = Depends(get_db)):
    """Local bootstrap endpoint to create or verify administrator account safely"""
    admin_email = "admin@sehatsetu.gov.in"
    existing = db.query(User).filter(User.email == admin_email).first()
    if existing:
        return {"status": "already_exists", "email": admin_email, "role": "admin"}
    
    admin_user = User(
        email=admin_email,
        hashed_password=get_password_hash("Admin@SehatSetu2026"),
        full_name="SehatSetu Administrator",
        role="admin",
        is_active=True
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    return {"status": "created", "email": admin_email, "role": "admin"}

@router.get("/aadhaar-status")
def get_aadhaar_status():
    """Returns the operational status of the Aadhaar / ABHA authentication gateway"""
    from app.services.aadhaar_service import aadhaar_service
    return aadhaar_service.get_status()

from app.services.aadhaar_service import aadhaar_service
from app.schemas.schemas import AadhaarGenerateOtpIn, AadhaarVerifyOtpIn

@router.post("/aadhaar/generate-otp")
def auth_aadhaar_generate_otp(payload: AadhaarGenerateOtpIn):
    try:
        return aadhaar_service.generate_otp(payload.aadhaar_number)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/aadhaar-login", response_model=Token)
def auth_aadhaar_login(payload: AadhaarVerifyOtpIn, db: Session = Depends(get_db)):
    try:
        verified = aadhaar_service.verify_otp(payload.txn_id, payload.otp)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    masked = verified["masked_aadhaar"]
    existing_pat = db.query(PatientProfile).filter(
        (PatientProfile.masked_aadhaar == masked) | (PatientProfile.abha_number == verified["abha_number"])
    ).first()

    if existing_pat and existing_pat.user:
        user = existing_pat.user
    else:
        asha_user = db.query(User).filter(User.email == "asha@example.com").first()
        if asha_user:
            user = asha_user
            pat = asha_user.patient_profile
            if pat:
                pat.is_aadhaar_verified = True
                pat.masked_aadhaar = masked
                pat.abha_number = verified["abha_number"]
                pat.abha_address = verified["abha_address"]
                pat.aadhaar_verified_at = datetime.now(timezone.utc)
                db.commit()
        else:
            suffix = masked.replace(" ", "")[-4:]
            synthetic_email = f"patient_{suffix}@sehatsetu.demo"
            user = User(
                email=synthetic_email,
                hashed_password=get_password_hash("Patient@SehatSetu2026"),
                full_name=f"Verified Patient ({masked[-4:]})",
                role="patient",
                is_active=True
            )
            db.add(user)
            db.flush()
            pat = PatientProfile(
                user_id=user.id,
                city="Sonipat",
                state="Haryana",
                pincode="131001",
                is_aadhaar_verified=True,
                masked_aadhaar=masked,
                abha_number=verified["abha_number"],
                abha_address=verified["abha_address"],
                aadhaar_verified_at=datetime.now(timezone.utc)
            )
            db.add(pat)
            db.commit()
            db.refresh(user)

    token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email
    }

