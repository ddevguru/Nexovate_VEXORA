from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional
import datetime
from pydantic import BaseModel
from app.db.database import get_async_db
from app.models.all_models import User, AuditLog
from app.core.security import get_current_user

router = APIRouter(prefix="", tags=["Audit Logs"])

class AuditLogOut(BaseModel):
    id: str
    user_id: Optional[str]
    action: str
    resource_type: Optional[str]
    resource_id: Optional[str]
    timestamp: datetime.datetime

    class Config:
        from_attributes = True

@router.get("/audit-logs", response_model=List[AuditLogOut])
async def list_audit_logs(db: AsyncSession = Depends(get_async_db), current_user: User = Depends(get_current_user)):
    res = await db.execute(select(AuditLog).order_by(desc(AuditLog.timestamp)).limit(100))
    return res.scalars().all()
