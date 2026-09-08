from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, delete
from typing import Optional, List
import datetime
from app.db.database import get_async_db
from app.models.all_models import User, Investigation, Event, Anomaly, Incident, AttackNode, AttackEdge, AuditLog
from app.schemas.all_schemas import EventOut, TimelineResponse
from app.core.security import get_current_user
from app.services.risk_engine import RiskEngineService
from app.services.anomaly_engine import AnomalyEngineService
from app.services.correlation_engine import CorrelationEngineService

router = APIRouter(prefix="/investigations", tags=["Timeline & Analysis"])

@router.post("/{id}/analyze")
async def run_analysis_pipeline(id: str, db: AsyncSession = Depends(get_async_db), current_user: User = Depends(get_current_user)):
    """
    Executes the analysis pipeline on actual PostgreSQL event records.
    Persists risk scores, anomalies, incidents, attack nodes, and attack edges directly to PostgreSQL.
    """
    res = await db.execute(select(Investigation).where(Investigation.id == id))
    inv = res.scalars().first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    ev_res = await db.execute(select(Event).where(Event.investigation_id == id))
    events = ev_res.scalars().all()
    if not events:
        return {"message": "No events found in investigation to analyze.", "event_count": 0}

    # 1. Run Risk Engine & Rule Detectors
    analyzed_events, detections = RiskEngineService.analyze_events(events)
    await db.commit()

    # 2. Clear existing anomalies/incidents for clean re-analysis
    await db.execute(delete(Anomaly).where(Anomaly.investigation_id == id))
    await db.execute(delete(Incident).where(Incident.investigation_id == id))
    await db.commit()

    # 3. Run IsolationForest Anomaly Engine
    anomalies = AnomalyEngineService.detect_anomalies(analyzed_events, id)
    for a in anomalies:
        db.add(a)
    await db.commit()

    # 4. Run Correlation & Attack Chain Engine
    incident, nodes, edges = CorrelationEngineService.process_correlation(analyzed_events, anomalies, id)
    if incident:
        db.add(incident)
        await db.commit()
        for n in nodes:
            db.add(n)
        for e in edges:
            db.add(e)
        await db.commit()

    inv.status = "COMPLETED"
    await db.commit()

    audit = AuditLog(user_id=current_user.id, action="RUN_ANALYSIS", resource_type="Investigation", resource_id=id)
    db.add(audit)
    await db.commit()

    return {
        "status": "COMPLETED",
        "investigation_id": id,
        "processed_events": len(analyzed_events),
        "rule_detections": len(detections),
        "anomalies_detected": len(anomalies),
        "incident_id": incident.id if incident else None
    }


@router.get("/{id}/timeline", response_model=TimelineResponse)
async def get_timeline(
    id: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
    start_time: Optional[datetime.datetime] = Query(None),
    end_time: Optional[datetime.datetime] = Query(None),
    severity: Optional[List[str]] = Query(None),
    event_type: Optional[List[str]] = Query(None),
    user: Optional[str] = Query(None),
    source_ip: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    anomalies_only: bool = Query(False),
    significant_only: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500)
):
    query = select(Event).where(Event.investigation_id == id)

    if start_time:
        query = query.where(Event.timestamp >= start_time)
    if end_time:
        query = query.where(Event.timestamp <= end_time)
    if severity:
        query = query.where(Event.severity.in_(severity))
    if event_type:
        query = query.where(Event.event_type.in_(event_type))
    if user:
        query = query.where(Event.user.ilike(f"%{user}%"))
    if source_ip:
        query = query.where(Event.source_ip.ilike(f"%{source_ip}%"))
    if search:
        s_term = f"%{search}%"
        query = query.where(or_(
            Event.action.ilike(s_term),
            Event.resource.ilike(s_term),
            Event.user.ilike(s_term),
            Event.source_ip.ilike(s_term),
            Event.raw_log.ilike(s_term)
        ))

    if anomalies_only:
        anom_res = await db.execute(select(Anomaly.event_id).where(Anomaly.investigation_id == id))
        anomaly_event_ids = anom_res.scalars().all()
        query = query.where(Event.id.in_(anomaly_event_ids))

    if significant_only:
        query = query.where(Event.severity.in_(["HIGH", "CRITICAL"]))

    # Count total matching events from PostgreSQL
    count_query = select(func.count()).select_from(query.subquery())
    total_res = await db.execute(count_query)
    total_events = total_res.scalar() or 0

    total_pages = (total_events + page_size - 1) // page_size if total_events > 0 else 1

    # Order chronologically and paginate in PostgreSQL
    paginated_query = query.order_by(Event.timestamp.asc()).offset((page - 1) * page_size).limit(page_size)
    events_res = await db.execute(paginated_query)
    events = events_res.scalars().all()

    # Pre-fetch anomaly lookup
    anomaly_res = await db.execute(select(Anomaly.event_id).where(Anomaly.investigation_id == id))
    anomaly_event_set = set(anomaly_res.scalars().all())

    event_outs = []
    for e in events:
        out = EventOut.from_orm(e)
        out.is_anomaly = (e.id in anomaly_event_set)
        if isinstance(e.normalized_data, dict) and "significance_reasons" in e.normalized_data:
            out.significance_reasons = e.normalized_data["significance_reasons"]
        event_outs.append(out)

    return TimelineResponse(
        total_events=total_events,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        events=event_outs
    )
