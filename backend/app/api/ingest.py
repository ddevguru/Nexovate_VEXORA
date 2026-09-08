import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.db.database import get_async_db
from app.models.all_models import User, Investigation, Event, AuditLog
from app.core.security import get_current_user
from app.services.event_normalizer import EventNormalizerService

router = APIRouter(prefix="", tags=["Event Ingestion API"])

class IngestEventItem(BaseModel):
    timestamp: Optional[str] = None
    event_type: Optional[str] = "AUTHENTICATION"
    user: Optional[str] = None
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    action: str = Field(..., example="LOGIN_FAILED")
    resource: Optional[str] = None
    hostname: Optional[str] = None
    status: Optional[str] = "SUCCESS"
    severity: Optional[str] = "INFO"
    raw_log: Optional[str] = None

class IngestBatchRequest(BaseModel):
    investigation_id: str
    events: List[IngestEventItem]

class IngestResponse(BaseModel):
    investigation_id: str
    inserted: int
    failed: int

@router.post("/events/ingest", response_model=IngestResponse)
async def bulk_ingest_events(
    req: IngestBatchRequest,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    res = await db.execute(select(Investigation).where(Investigation.id == req.investigation_id))
    inv = res.scalars().first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    inserted_count = 0
    failed_count = 0

    for item in req.events:
        try:
            item_dict = item.dict()
            norm = EventNormalizerService.normalize_record(item_dict, req.investigation_id)
            e_obj = Event(**norm)
            db.add(e_obj)
            inserted_count += 1
        except Exception:
            failed_count += 1

    audit = AuditLog(user_id=current_user.id, action="INGEST_EVENTS", resource_type="Investigation", resource_id=req.investigation_id)
    db.add(audit)
    await db.commit()

    return IngestResponse(
        investigation_id=req.investigation_id,
        inserted=inserted_count,
        failed=failed_count
    )

@router.post("/investigations/{id}/events/ingest", response_model=IngestResponse)
async def ingest_investigation_events(
    id: str,
    req: Dict[str, List[IngestEventItem]],
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    events_list = req.get("events", [])
    batch_req = IngestBatchRequest(investigation_id=id, events=events_list)
    return await bulk_ingest_events(batch_req, db, current_user)
