import os
import pytest
import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.services.file_parser import LogParserService
from app.services.event_normalizer import EventNormalizerService
from app.services.risk_engine import RiskEngineService
from app.services.anomaly_engine import AnomalyEngineService
from app.services.correlation_engine import CorrelationEngineService
from app.models.all_models import Event

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert "CYBERTRACE AI" in data["system"]

def test_log_parser_csv():
    raw_csv = b"timestamp,user,action,source_ip\n2026-05-10T09:41:00Z,rahul,LOGIN_FAILED,192.168.1.50"
    parsed = LogParserService.parse_file(raw_csv, "test.csv")
    assert len(parsed) == 1
    assert parsed[0]["user"] == "rahul"
    assert parsed[0]["action"] == "LOGIN_FAILED"

def test_log_parser_json():
    raw_json = b'[{"timestamp": "2026-05-10T09:45:00Z", "user": "rahul", "action": "LOGIN_SUCCESS"}]'
    parsed = LogParserService.parse_file(raw_json, "test.json")
    assert len(parsed) == 1
    assert parsed[0]["action"] == "LOGIN_SUCCESS"

def test_event_normalizer():
    raw_rec = {
        "timestamp": "2026-05-10T09:49:12Z",
        "user": "rahul",
        "source_ip": "10.0.4.102",
        "action": "PRIVILEGE_ELEVATION",
        "resource": "/usr/bin/sudo",
        "message": "rahul ran sudo to root"
    }
    norm = EventNormalizerService.normalize_record(raw_rec, "test_inv_id")
    assert norm["event_type"] == "PRIVILEGE_ESCALATION"
    assert norm["severity"] in ["HIGH", "CRITICAL"]
    assert norm["user"] == "rahul"

def test_risk_and_anomaly_engine():
    e1 = Event(id="1", timestamp=datetime.datetime.utcnow(), event_type="AUTHENTICATION", user="rahul", source_ip="192.168.1.50", action="LOGIN_FAILED", status="FAILURE", severity="MEDIUM", risk_score=0)
    e2 = Event(id="2", timestamp=datetime.datetime.utcnow() + datetime.timedelta(seconds=10), event_type="AUTHENTICATION", user="rahul", source_ip="192.168.1.50", action="LOGIN_SUCCESS", status="SUCCESS", severity="INFO", risk_score=0)
    e3 = Event(id="3", timestamp=datetime.datetime.utcnow() + datetime.timedelta(seconds=20), event_type="PRIVILEGE_ESCALATION", user="rahul", source_ip="10.0.4.102", action="PRIVILEGE_ELEVATION", status="SUCCESS", severity="HIGH", risk_score=0)
    
    events, detections = RiskEngineService.analyze_events([e1, e2, e3])
    assert len(events) == 3
    assert e3.risk_score > 50

    anomalies = AnomalyEngineService.detect_anomalies(events, "test_inv_id")
    assert isinstance(anomalies, list)

def test_correlation_engine():
    e1 = Event(id="1", timestamp=datetime.datetime.utcnow(), event_type="AUTHENTICATION", user="rahul", source_ip="192.168.1.50", action="LOGIN_SUCCESS", status="SUCCESS", severity="INFO", risk_score=10)
    e2 = Event(id="2", timestamp=datetime.datetime.utcnow() + datetime.timedelta(seconds=30), event_type="DATABASE_ACCESS", user="rahul", source_ip="192.168.1.50", action="DATABASE_QUERY", resource="customer_vault", status="SUCCESS", severity="HIGH", risk_score=85)
    
    incident, nodes, edges = CorrelationEngineService.process_correlation([e1, e2], [], "test_inv_id")
    assert incident is not None
    assert len(nodes) > 0
    assert len(edges) > 0
