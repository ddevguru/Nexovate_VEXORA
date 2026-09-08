import asyncio
import os
import sys
import datetime

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend"))

from app.db.database import AsyncSessionLocal
from app.models.all_models import User, Investigation, EvidenceFile, Event, Anomaly, Incident, AttackNode, AttackEdge
from app.services.event_normalizer import EventNormalizerService
from app.services.risk_engine import RiskEngineService
from app.services.anomaly_engine import AnomalyEngineService
from app.services.correlation_engine import CorrelationEngineService
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as session:
        # Check if demo investigation already exists
        res = await session.execute(select(Investigation).where(Investigation.name == "Demo Investigation: Account Compromise"))
        existing = res.scalars().first()
        if existing:
            print(f"Demo investigation already exists in PostgreSQL with ID: {existing.id}")
            return

        inv = Investigation(
            name="Demo Investigation: Account Compromise",
            description="Synthetic hackathon demo dataset containing brute force, account compromise, privilege escalation, database access, and data exfiltration.",
            severity="CRITICAL"
        )
        session.add(inv)
        await session.commit()

        base_ts = datetime.datetime.utcnow().replace(hour=9, minute=40, second=0, microsecond=0)
        demo_raw_logs = [
            {"timestamp": (base_ts + datetime.timedelta(minutes=1)).isoformat(), "user": "rahul", "source_ip": "192.168.1.50", "action": "LOGIN_FAILED", "resource": "/ssh", "message": "Failed password for rahul from 192.168.1.50"},
            {"timestamp": (base_ts + datetime.timedelta(minutes=2)).isoformat(), "user": "rahul", "source_ip": "192.168.1.50", "action": "LOGIN_FAILED", "resource": "/ssh", "message": "Failed password for rahul from 192.168.1.50"},
            {"timestamp": (base_ts + datetime.timedelta(minutes=3)).isoformat(), "user": "rahul", "source_ip": "192.168.1.50", "action": "LOGIN_FAILED", "resource": "/ssh", "message": "Failed password for rahul from 192.168.1.50"},
            {"timestamp": (base_ts + datetime.timedelta(minutes=4)).isoformat(), "user": "rahul", "source_ip": "192.168.1.50", "action": "LOGIN_FAILED", "resource": "/ssh", "message": "Failed password for rahul from 192.168.1.50"},
            {"timestamp": (base_ts + datetime.timedelta(minutes=5)).isoformat(), "user": "rahul", "source_ip": "192.168.1.50", "action": "LOGIN_SUCCESS", "resource": "/ssh", "message": "Accepted password for rahul from 192.168.1.50 ssh2"},
            {"timestamp": (base_ts + datetime.timedelta(minutes=7)).isoformat(), "user": "rahul", "source_ip": "10.0.4.102", "action": "SESSION_STARTED", "resource": "SERVER-01", "message": "New source IP connection 10.0.4.102"},
            {"timestamp": (base_ts + datetime.timedelta(minutes=9)).isoformat(), "user": "rahul", "source_ip": "10.0.4.102", "action": "PRIVILEGE_ELEVATION", "resource": "/usr/bin/sudo", "message": "rahul : TTY=pts/1 ; PWD=/home/rahul ; USER=root ; COMMAND=/bin/bash"},
            {"timestamp": (base_ts + datetime.timedelta(minutes=12)).isoformat(), "user": "rahul", "source_ip": "10.0.4.102", "action": "DATABASE_QUERY", "resource": "PostgreSQL: customer_vault", "message": "SELECT * FROM customer_vault WHERE credit_card IS NOT NULL"},
            {"timestamp": (base_ts + datetime.timedelta(minutes=16)).isoformat(), "user": "rahul", "source_ip": "10.0.4.102", "action": "DATA_TRANSFER", "resource": "scp://exfil.external-server.net/dump.tar.gz", "message": "Transferred 1.4 GB to exfil.external-server.net"},
            {"timestamp": (base_ts + datetime.timedelta(minutes=21)).isoformat(), "user": "rahul", "source_ip": "10.0.4.102", "action": "SESSION_TERMINATED", "resource": "SERVER-01", "message": "Session closed for user rahul"}
        ]

        ev_file = EvidenceFile(
            investigation_id=inv.id,
            filename="synthetic_demo_logs.json",
            file_type="JSON",
            file_size=1024 * 45,
            sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            processing_status="COMPLETED",
            event_count=len(demo_raw_logs)
        )
        session.add(ev_file)
        await session.commit()

        events_objs = []
        for rec in demo_raw_logs:
            norm_dict = EventNormalizerService.normalize_record(rec, inv.id, ev_file.id)
            e_obj = Event(**norm_dict)
            session.add(e_obj)
            events_objs.append(e_obj)
        await session.commit()

        analyzed_events, detections = RiskEngineService.analyze_events(events_objs)
        await session.commit()

        anomalies = AnomalyEngineService.detect_anomalies(analyzed_events, inv.id)
        for a in anomalies:
            session.add(a)
        await session.commit()

        incident, nodes, edges = CorrelationEngineService.process_correlation(analyzed_events, anomalies, inv.id)
        if incident:
            session.add(incident)
            await session.commit()
            for n in nodes:
                session.add(n)
            for e in edges:
                session.add(e)
            await session.commit()

        print(f"Successfully populated PostgreSQL demo dataset for investigation '{inv.name}' (ID: {inv.id}).")

if __name__ == '__main__':
    asyncio.run(main())
