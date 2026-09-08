import os
import hashlib
import werkzeug.utils
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.db.database import get_async_db
from app.core.config import settings
from app.models.all_models import User, Investigation, EvidenceFile, Event, AuditLog
from app.schemas.all_schemas import EvidenceFileOut
from app.core.security import get_current_user
from app.services.file_parser import LogParserService
from app.services.event_normalizer import EventNormalizerService

router = APIRouter(prefix="", tags=["Evidence Uploads"])

@router.post("/investigations/{id}/evidence", response_model=EvidenceFileOut)
async def upload_evidence(
    id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    res = await db.execute(select(Investigation).where(Investigation.id == id))
    inv = res.scalars().first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    filename = werkzeug.utils.secure_filename(file.filename)
    if not filename:
        filename = f"evidence_{file.filename}"

    content = await file.read()
    file_size = len(content)

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(status_code=400, detail=f"File exceeds maximum upload size limit of {settings.MAX_UPLOAD_SIZE_MB}MB.")

    sha256_hash = hashlib.sha256(content).hexdigest()

    save_path = os.path.join(settings.UPLOAD_DIR, f"{id}_{sha256_hash[:8]}_{filename}")
    with open(save_path, "wb") as f:
        f.write(content)

    ext = os.path.splitext(filename)[1].upper().replace(".", "")
    ev_file = EvidenceFile(
        investigation_id=inv.id,
        filename=filename,
        file_type=ext or "LOG",
        file_size=file_size,
        sha256_hash=sha256_hash,
        processing_status="PROCESSING",
        event_count=0
    )
    db.add(ev_file)
    await db.commit()
    await db.refresh(ev_file)

    try:
        raw_records = LogParserService.parse_file(content, filename)
        event_objs = []
        for rec in raw_records:
            norm_dict = EventNormalizerService.normalize_record(rec, inv.id, ev_file.id)
            e_obj = Event(**norm_dict)
            db.add(e_obj)
            event_objs.append(e_obj)

        ev_file.processing_status = "COMPLETED"
        ev_file.event_count = len(event_objs)
        await db.commit()

        audit = AuditLog(user_id=current_user.id, action="UPLOAD_EVIDENCE", resource_type="EvidenceFile", resource_id=ev_file.id)
        db.add(audit)
        await db.commit()

    except Exception as e:
        ev_file.processing_status = "FAILED"
        await db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to process log evidence file: {str(e)}")

    return ev_file

@router.get("/investigations/{id}/evidence", response_model=List[EvidenceFileOut])
async def list_evidence(id: str, db: AsyncSession = Depends(get_async_db), current_user: User = Depends(get_current_user)):
    res = await db.execute(select(EvidenceFile).where(EvidenceFile.investigation_id == id))
    return res.scalars().all()

@router.delete("/evidence/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_evidence(file_id: str, db: AsyncSession = Depends(get_async_db), current_user: User = Depends(get_current_user)):
    res = await db.execute(select(EvidenceFile).where(EvidenceFile.id == file_id))
    ev = res.scalars().first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence file not found")
    
    await db.delete(ev)
    audit = AuditLog(user_id=current_user.id, action="DELETE_EVIDENCE", resource_type="EvidenceFile", resource_id=file_id)
    db.add(audit)
    await db.commit()
    return None
