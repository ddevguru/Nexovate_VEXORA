from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_async_db
from app.models.all_models import User, Event, Incident, Anomaly
from app.schemas.all_schemas import AIInvestigateRequest, AIInvestigateResponse, AISummaryResponse
from app.core.security import get_current_user
from app.services.ai_service import AIService
from app.services.correlation_engine import CorrelationEngineService

router = APIRouter(prefix="/ai", tags=["AI Investigation Assistant"])

@router.post("/investigate", response_model=AIInvestigateResponse)
async def investigate_query(req: AIInvestigateRequest, db: AsyncSession = Depends(get_async_db), current_user: User = Depends(get_current_user)):
    ev_res = await db.execute(select(Event).where(Event.investigation_id == req.investigation_id))
    events = ev_res.scalars().all()

    inc_res = await db.execute(select(Incident).where(Incident.investigation_id == req.investigation_id))
    incident = inc_res.scalars().first()

    answer_text, ref_ids, provider = AIService.answer_investigation_query(req.query, events, incident)

    return AIInvestigateResponse(
        query=req.query,
        answer=answer_text,
        referenced_event_ids=ref_ids,
        provider_used=provider
    )

@router.post("/summary/{investigation_id}", response_model=AISummaryResponse)
async def get_ai_summary(investigation_id: str, db: AsyncSession = Depends(get_async_db), current_user: User = Depends(get_current_user)):
    ev_res = await db.execute(select(Event).where(Event.investigation_id == investigation_id))
    events = ev_res.scalars().all()

    inc_res = await db.execute(select(Incident).where(Incident.investigation_id == investigation_id))
    incident = inc_res.scalars().first()

    anom_res = await db.execute(select(Anomaly).where(Anomaly.investigation_id == investigation_id))
    anomalies = anom_res.scalars().all()

from app.services.multi_agent_system import MultiAgentSuiteService

@router.post("/agents/run-all/{investigation_id}")
async def run_multi_agent_suite(investigation_id: str, db: AsyncSession = Depends(get_async_db), current_user: User = Depends(get_current_user)):
    ev_res = await db.execute(select(Event).where(Event.investigation_id == investigation_id))
    events = ev_res.scalars().all()

    inc_res = await db.execute(select(Incident).where(Incident.investigation_id == investigation_id))
    incident = inc_res.scalars().first()

    suite_results = MultiAgentSuiteService.run_all_agents(events, incident)
    return suite_results
