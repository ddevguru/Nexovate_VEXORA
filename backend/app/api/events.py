from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_async_db
from app.models.all_models import User, Event, Anomaly
from app.schemas.all_schemas import EventOut
from app.core.security import get_current_user

router = APIRouter(prefix="", tags=["Events"])

@router.get("/events/{id}", response_model=EventOut)
async def get_event_detail(id: str, db: AsyncSession = Depends(get_async_db), current_user: User = Depends(get_current_user)):
    res = await db.execute(select(Event).where(Event.id == id))
    e = res.scalars().first()
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")

    anom_res = await db.execute(select(Anomaly).where(Anomaly.event_id == id))
    anom = anom_res.scalars().first()

    out = EventOut.from_orm(e)
    out.is_anomaly = (anom is not None)
    if isinstance(e.normalized_data, dict) and "significance_reasons" in e.normalized_data:
        out.significance_reasons = e.normalized_data["significance_reasons"]
    return out
