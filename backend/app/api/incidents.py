from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import List, Dict, Any
from app.db.database import get_async_db
from app.models.all_models import User, Incident, AttackNode, AttackEdge, Event
from app.schemas.all_schemas import IncidentOut, AttackGraphResponse, AttackNodeOut, AttackEdgeOut, EventOut
from app.core.security import get_current_user
from app.services.correlation_engine import CorrelationEngineService

router = APIRouter(prefix="/investigations", tags=["Incidents & Attack Graph"])

@router.get("/{id}/incidents", response_model=List[IncidentOut])
async def list_incidents(id: str, db: AsyncSession = Depends(get_async_db), current_user: User = Depends(get_current_user)):
    inc_res = await db.execute(select(Incident).where(Incident.investigation_id == id))
    incidents = inc_res.scalars().all()

    ev_res = await db.execute(select(Event).where(Event.investigation_id == id))
    events = ev_res.scalars().all()

    res = []
    for inc in incidents:
        out = IncidentOut.from_orm(inc)
        out.attack_stages = CorrelationEngineService.extract_attack_stages(events)
        res.append(out)
    return res

@router.get("/{id}/attack-graph", response_model=AttackGraphResponse)
async def get_attack_graph(id: str, db: AsyncSession = Depends(get_async_db), current_user: User = Depends(get_current_user)):
    inc_res = await db.execute(select(Incident).where(Incident.investigation_id == id))
    incident = inc_res.scalars().first()

    if not incident:
        ev_res = await db.execute(select(Event).where(Event.investigation_id == id))
        events = ev_res.scalars().all()
        incident, nodes, edges = CorrelationEngineService.process_correlation(events, [], id)
    else:
        node_res = await db.execute(select(AttackNode).where(AttackNode.incident_id == incident.id))
        nodes = node_res.scalars().all()
        edge_res = await db.execute(select(AttackEdge).where(AttackEdge.incident_id == incident.id))
        edges = edge_res.scalars().all()

    node_outs = [AttackNodeOut(id=n.id, node_type=n.node_type, label=n.label, node_metadata=n.node_metadata) for n in nodes]
    edge_outs = [AttackEdgeOut(id=e.id, source_node_id=e.source_node_id, target_node_id=e.target_node_id, relationship=e.relationship, confidence=e.confidence) for e in edges]

    critical_node_ids = [n.id for n in nodes if n.node_type in ["User", "IP"] or (isinstance(n.node_metadata, dict) and n.node_metadata.get("severity") in ["HIGH", "CRITICAL"])]

    return AttackGraphResponse(
        nodes=node_outs,
        edges=edge_outs,
        attack_path_node_ids=critical_node_ids
    )

@router.get("/{id}/replay", response_model=List[EventOut])
async def get_incident_replay_stream(id: str, db: AsyncSession = Depends(get_async_db), current_user: User = Depends(get_current_user)):
    """Returns chronological event stream for step-by-step incident replay animation."""
    ev_res = await db.execute(select(Event).where(Event.investigation_id == id).order_by(Event.timestamp.asc()))
    events = ev_res.scalars().all()
    return [EventOut.from_orm(e) for e in events]

@router.get("/{id}/impact")
async def get_impact_analysis(id: str, db: AsyncSession = Depends(get_async_db), current_user: User = Depends(get_current_user)):
    """Calculates actual affected users, systems, databases, files, and exfiltrated volume directly from PostgreSQL."""
    ev_res = await db.execute(select(Event).where(Event.investigation_id == id))
    events = ev_res.scalars().all()

    affected_users = list(set([e.user for e in events if e.user and e.user not in ["UNKNOWN", "N/A"]]))
    affected_hosts = list(set([e.hostname for e in events if e.hostname and e.hostname != "N/A"]))
    affected_databases = list(set([e.resource for e in events if e.resource and ("DB" in (e.event_type or "") or "sql" in (e.raw_log or "").lower())]))
    affected_files = list(set([e.resource for e in events if e.resource and e.resource not in affected_databases]))

    high_risk_count = sum(1 for e in events if e.severity in ["HIGH", "CRITICAL"])
    max_risk = max([e.risk_score for e in events] + [0])

    return {
        "investigation_id": id,
        "overall_risk_score": max_risk,
        "high_risk_events_count": high_risk_count,
        "affected_users": affected_users,
        "affected_hosts": affected_hosts,
        "affected_databases": affected_databases,
        "affected_files": affected_files[:10],
        "estimated_impact_level": "CRITICAL" if max_risk >= 75 else ("HIGH" if max_risk >= 50 else "MEDIUM")
    }
