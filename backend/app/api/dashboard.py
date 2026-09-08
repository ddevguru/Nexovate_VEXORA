from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_
from typing import Dict, List, Any
import datetime
from app.db.database import get_async_db
from app.models.all_models import User, Investigation, Event, Anomaly, Incident, EvidenceFile
from app.schemas.all_schemas import DashboardMetrics, EventOut
from app.core.security import get_current_user
from app.services.correlation_engine import CorrelationEngineService

router = APIRouter(prefix="/investigations", tags=["Dashboard"])

@router.get("/{id}/dashboard", response_model=DashboardMetrics)
async def get_dashboard_metrics(id: str, db: AsyncSession = Depends(get_async_db), current_user: User = Depends(get_current_user)):
    res = await db.execute(select(Investigation).where(Investigation.id == id))
    inv = res.scalars().first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    ev_res = await db.execute(select(Event).where(Event.investigation_id == id))
    events = ev_res.scalars().all()

    anom_res = await db.execute(select(Anomaly).where(Anomaly.investigation_id == id))
    anomalies = anom_res.scalars().all()

    inc_res = await db.execute(select(Incident).where(Incident.investigation_id == id))
    incident = inc_res.scalars().first()

    total_events = len(events)
    significant_events = [e for e in events if e.severity in ["HIGH", "CRITICAL"]]
    critical_findings = [e for e in events if e.severity == "CRITICAL"]

    unique_users = list(set([e.user for e in events if e.user and e.user not in ["UNKNOWN", "N/A"]]))
    unique_ips = list(set([e.source_ip for e in events if e.source_ip and e.source_ip not in ["UNKNOWN", "N/A"]]))
    unique_resources = list(set([e.resource for e in events if e.resource and e.resource not in ["N/A"]]))

    overall_risk = max([e.risk_score for e in events] + [0])
    confidence = incident.confidence if incident else (85 if total_events > 0 else 0)

    # Severity distribution
    sev_dist = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "INFO": 0}
    for e in events:
        sev_dist[e.severity] = sev_dist.get(e.severity, 0) + 1

    # Category distribution
    cat_dist = {}
    for e in events:
        cat_dist[e.event_type] = cat_dist.get(e.event_type, 0) + 1

    # Events over time (grouped by hour)
    time_series = {}
    for e in events:
        h_str = e.timestamp.strftime("%H:00")
        if h_str not in time_series:
            time_series[h_str] = {"hour": h_str, "events": 0, "anomalies": 0, "max_risk": 0}
        time_series[h_str]["events"] += 1
        time_series[h_str]["max_risk"] = max(time_series[h_str]["max_risk"], e.risk_score)

    anomaly_event_set = set([a.event_id for a in anomalies])
    for e in events:
        if e.id in anomaly_event_set:
            h_str = e.timestamp.strftime("%H:00")
            if h_str in time_series:
                time_series[h_str]["anomalies"] += 1

    events_over_time = sorted(list(time_series.values()), key=lambda x: x["hour"])

    # Top suspicious users & IPs
    user_risk = {}
    ip_risk = {}
    for e in events:
        if e.user and e.user not in ["UNKNOWN", "N/A"]:
            user_risk[e.user] = user_risk.get(e.user, 0) + e.risk_score
        if e.source_ip and e.source_ip not in ["UNKNOWN", "N/A"]:
            ip_risk[e.source_ip] = ip_risk.get(e.source_ip, 0) + e.risk_score

    top_users = [{"user": k, "score": v} for k, v in sorted(user_risk.items(), key=lambda x: x[1], reverse=True)[:5]]
    top_ips = [{"ip": k, "score": v} for k, v in sorted(ip_risk.items(), key=lambda x: x[1], reverse=True)[:5]]

    recent_sig_outs = [EventOut.from_orm(e) for e in sorted(significant_events, key=lambda x: x.timestamp, reverse=True)[:5]]
    attack_chain_summary = CorrelationEngineService.extract_attack_stages(events)

    return DashboardMetrics(
        investigation_id=id,
        investigation_name=inv.name,
        total_events=total_events,
        significant_events_count=len(significant_events),
        anomalies_count=len(anomalies),
        critical_findings_count=len(critical_findings),
        unique_users_count=len(unique_users),
        unique_ips_count=len(unique_ips),
        unique_resources_count=len(unique_resources),
        overall_risk_score=overall_risk,
        confidence_score=confidence,
        severity_distribution=sev_dist,
        event_category_distribution=cat_dist,
        events_over_time=events_over_time,
        top_suspicious_users=top_users,
        top_suspicious_ips=top_ips,
        recent_significant_events=recent_sig_outs,
        attack_chain_summary=attack_chain_summary
    )

@router.get("/{id}/analytics/events-over-time")
async def get_events_over_time_chart(id: str, db: AsyncSession = Depends(get_async_db), current_user: User = Depends(get_current_user)):
    """Returns database-backed hourly event distribution for charting (Requirement 12)."""
    ev_res = await db.execute(select(Event).where(Event.investigation_id == id))
    events = ev_res.scalars().all()
    
    time_series = {}
    for e in events:
        t_str = e.timestamp.strftime("%Y-%m-%dT%H:00:00Z")
        time_series[t_str] = time_series.get(t_str, 0) + 1
        
    return [{"timestamp": k, "count": v} for k, v in sorted(time_series.items())]
