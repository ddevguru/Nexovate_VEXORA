import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List
from app.db.database import get_async_db
from app.models.all_models import User, Investigation, EvidenceFile, Event, Incident, Anomaly, Report, AuditLog
from app.schemas.all_schemas import ReportOut
from app.core.security import get_current_user
from app.services.report_service import ReportService
from app.services.ai_service import AIService
from app.services.correlation_engine import CorrelationEngineService

router = APIRouter(prefix="", tags=["Reports"])

@router.post("/investigations/{id}/reports", response_model=ReportOut)
async def generate_report(id: str, db: AsyncSession = Depends(get_async_db), current_user: User = Depends(get_current_user)):
    res = await db.execute(select(Investigation).where(Investigation.id == id))
    inv = res.scalars().first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    ev_files_res = await db.execute(select(EvidenceFile).where(EvidenceFile.investigation_id == id))
    evidence_files = ev_files_res.scalars().all()

    events_res = await db.execute(select(Event).where(Event.investigation_id == id))
    events = events_res.scalars().all()

    inc_res = await db.execute(select(Incident).where(Incident.investigation_id == id))
    incident = inc_res.scalars().first()

    anom_res = await db.execute(select(Anomaly).where(Anomaly.investigation_id == id))
    anomalies = anom_res.scalars().all()

    stages = CorrelationEngineService.extract_attack_stages(events)
    ai_summary = AIService.generate_incident_summary(events, incident, anomalies, stages)

    filepath = ReportService.generate_pdf_report(inv, evidence_files, events, incident, anomalies, ai_summary)

    report_rec = Report(
        investigation_id=id,
        report_type="PDF",
        file_path=filepath
    )
    db.add(report_rec)
    await db.commit()
    await db.refresh(report_rec)

    audit = AuditLog(user_id=current_user.id, action="GENERATE_REPORT", resource_type="Report", resource_id=report_rec.id)
    db.add(audit)
    await db.commit()

    return report_rec

@router.get("/investigations/{id}/reports", response_model=List[ReportOut])
async def list_reports(id: str, db: AsyncSession = Depends(get_async_db), current_user: User = Depends(get_current_user)):
    res = await db.execute(select(Report).where(Report.investigation_id == id).order_by(desc(Report.generated_at)))
    return res.scalars().all()

@router.get("/reports/{report_id}/download")
async def download_report(report_id: str, db: AsyncSession = Depends(get_async_db)):
    res = await db.execute(select(Report).where(Report.id == report_id))
    report_rec = res.scalars().first()
    if not report_rec or not os.path.exists(report_rec.file_path):
        raise HTTPException(status_code=404, detail="Report PDF file not found on server")

    return FileResponse(
        path=report_rec.file_path,
        filename=f"cybertrace_report_{report_id[:8]}.pdf",
        media_type="application/pdf"
    )
