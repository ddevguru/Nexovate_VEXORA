from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List
from app.db.database import get_async_db
from app.models.all_models import User, Anomaly, Event
from app.schemas.all_schemas import AnomalyOut, EventOut
from app.core.security import get_current_user

router = APIRouter(prefix="/investigations", tags=["Anomalies"])

@router.get("/{id}/anomalies", response_model=List[AnomalyOut])
async def list_anomalies(id: str, db: AsyncSession = Depends(get_async_db), current_user: User = Depends(get_current_user)):
    res = await db.execute(select(Anomaly).where(Anomaly.investigation_id == id).order_by(desc(Anomaly.anomaly_score)))
    anomalies = res.scalars().all()
    
    out_list = []
    for a in anomalies:
        out = AnomalyOut.from_orm(a)
        ev_res = await db.execute(select(Event).where(Event.id == a.event_id))
        ev = ev_res.scalars().first()
        if ev:
            ev_out = EventOut.from_orm(ev)
            ev_out.is_anomaly = True
            out.event = ev_out
        out_list.append(out)
    return out_list
