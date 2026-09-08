from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import List
from app.db.database import get_async_db
from app.models.all_models import User, Investigation, EvidenceFile, Event, AuditLog
from app.schemas.all_schemas import InvestigationCreate, InvestigationOut
from app.core.security import get_current_user

router = APIRouter(prefix="/investigations", tags=["Investigations"])

@router.get("", response_model=List[InvestigationOut])
async def list_investigations(db: AsyncSession = Depends(get_async_db), current_user: User = Depends(get_current_user)):
    res = await db.execute(select(Investigation).order_by(desc(Investigation.created_at)))
    investigations = res.scalars().all()
    
    out_list = []
    for inv in investigations:
        ev_res = await db.execute(select(func.count(Event.id)).where(Event.investigation_id == inv.id))
        ev_count = ev_res.scalar() or 0

        file_res = await db.execute(select(func.count(EvidenceFile.id)).where(EvidenceFile.investigation_id == inv.id))
        file_count = file_res.scalar() or 0

        max_risk_res = await db.execute(select(func.max(Event.risk_score)).where(Event.investigation_id == inv.id))
        max_risk = max_risk_res.scalar() or 0

        out = InvestigationOut.from_orm(inv)
        out.event_count = ev_count
        out.evidence_count = file_count
        out.risk_score = max_risk
        out_list.append(out)
    return out_list

@router.post("", response_model=InvestigationOut, status_code=status.HTTP_201_CREATED)
async def create_investigation(inv_in: InvestigationCreate, db: AsyncSession = Depends(get_async_db), current_user: User = Depends(get_current_user)):
    inv = Investigation(
        name=inv_in.name,
        description=inv_in.description,
        severity=inv_in.severity or "MEDIUM",
        created_by=current_user.id
    )
    db.add(inv)
    await db.commit()
    await db.refresh(inv)

    audit = AuditLog(user_id=current_user.id, action="CREATE_INVESTIGATION", resource_type="Investigation", resource_id=inv.id)
    db.add(audit)
    await db.commit()

    out = InvestigationOut.from_orm(inv)
    out.event_count = 0
    out.evidence_count = 0
    out.risk_score = 0
    return out

@router.get("/{id}", response_model=InvestigationOut)
async def get_investigation(id: str, db: AsyncSession = Depends(get_async_db), current_user: User = Depends(get_current_user)):
    res = await db.execute(select(Investigation).where(Investigation.id == id))
    inv = res.scalars().first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    ev_res = await db.execute(select(func.count(Event.id)).where(Event.investigation_id == inv.id))
    ev_count = ev_res.scalar() or 0

    file_res = await db.execute(select(func.count(EvidenceFile.id)).where(EvidenceFile.investigation_id == inv.id))
    file_count = file_res.scalar() or 0

    max_risk_res = await db.execute(select(func.max(Event.risk_score)).where(Event.investigation_id == inv.id))
    max_risk = max_risk_res.scalar() or 0

    out = InvestigationOut.from_orm(inv)
    out.event_count = ev_count
    out.evidence_count = file_count
    out.risk_score = max_risk
    return out

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_investigation(id: str, db: AsyncSession = Depends(get_async_db), current_user: User = Depends(get_current_user)):
    res = await db.execute(select(Investigation).where(Investigation.id == id))
    inv = res.scalars().first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    await db.delete(inv)
    audit = AuditLog(user_id=current_user.id, action="DELETE_INVESTIGATION", resource_type="Investigation", resource_id=id)
    db.add(audit)
    await db.commit()
    return None
