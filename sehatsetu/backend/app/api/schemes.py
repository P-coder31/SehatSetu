from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import HealthScheme
from app.schemas.schemas import HealthSchemeOut, HealthSchemeExplainRequest, HealthSchemeExplainResponse
from app.services.ai_service import explain_scheme_simple

router = APIRouter(prefix="/schemes", tags=["Health Schemes"])

@router.get("", response_model=List[HealthSchemeOut])
def list_health_schemes(db: Session = Depends(get_db)):
    return db.query(HealthScheme).order_by(HealthScheme.id.asc()).all()

@router.get("/{id}", response_model=HealthSchemeOut)
def get_health_scheme(id: int, db: Session = Depends(get_db)):
    scheme = db.query(HealthScheme).filter(HealthScheme.id == id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Health scheme not found.")
    return scheme

@router.post("/explain", response_model=HealthSchemeExplainResponse)
async def explain_scheme(payload: HealthSchemeExplainRequest, db: Session = Depends(get_db)):
    scheme = db.query(HealthScheme).filter(HealthScheme.id == payload.scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Health scheme not found.")
    
    explanation = await explain_scheme_simple(scheme, language=payload.language)
    return explanation
