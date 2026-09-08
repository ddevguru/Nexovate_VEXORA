import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any

# --- AUTH ---
class UserRegister(BaseModel):
    name: str = Field(..., example="Rahul Sharma")
    email: EmailStr = Field(..., example="rahul@cybertrace.ai")
    password: str = Field(..., min_length=6)
    role: Optional[str] = "INVESTIGATOR"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# --- INVESTIGATION ---
class InvestigationCreate(BaseModel):
    name: str
    description: Optional[str] = None
    severity: Optional[str] = "MEDIUM"

class InvestigationOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    status: str
    severity: str
    created_by: Optional[str]
    created_at: datetime.datetime
    updated_at: datetime.datetime
    event_count: Optional[int] = 0
    evidence_count: Optional[int] = 0
    risk_score: Optional[int] = 0

    class Config:
        from_attributes = True


# --- EVIDENCE FILE ---
class EvidenceFileOut(BaseModel):
    id: str
    investigation_id: str
    filename: str
    file_type: str
    file_size: int
    sha256_hash: str
    uploaded_at: datetime.datetime
    processing_status: str
    event_count: int

    class Config:
        from_attributes = True


# --- EVENT & TIMELINE ---
class EventOut(BaseModel):
    id: str
    investigation_id: str
    evidence_file_id: Optional[str]
    timestamp: datetime.datetime
    event_type: str
    user: Optional[str]
    source_ip: Optional[str]
    destination_ip: Optional[str]
    action: str
    resource: Optional[str]
    resource_type: Optional[str]
    hostname: Optional[str]
    status: str
    severity: str
    risk_score: int
    raw_log: Optional[str]
    normalized_data: Optional[Dict[str, Any]]
    significance_reasons: Optional[List[str]] = []
    is_anomaly: Optional[bool] = False

    class Config:
        from_attributes = True

class TimelineFilter(BaseModel):
    start_time: Optional[datetime.datetime] = None
    end_time: Optional[datetime.datetime] = None
    severity: Optional[List[str]] = None
    event_type: Optional[List[str]] = None
    user: Optional[str] = None
    source_ip: Optional[str] = None
    search: Optional[str] = None
    anomalies_only: Optional[bool] = False
    significant_only: Optional[bool] = False
    page: int = 1
    page_size: int = 50

class TimelineResponse(BaseModel):
    total_events: int
    page: int
    page_size: int
    total_pages: int
    events: List[EventOut]


# --- ANOMALY ---
class AnomalyOut(BaseModel):
    id: str
    investigation_id: str
    event_id: str
    anomaly_score: float
    risk_level: str
    reason: str
    detector: str
    created_at: datetime.datetime
    event: Optional[EventOut] = None

    class Config:
        from_attributes = True


# --- INCIDENT & ATTACK CHAIN ---
class IncidentOut(BaseModel):
    id: str
    investigation_id: str
    title: str
    description: Optional[str]
    severity: str
    confidence: int
    start_time: Optional[datetime.datetime]
    end_time: Optional[datetime.datetime]
    status: str
    created_at: datetime.datetime
    attack_stages: Optional[List[Dict[str, Any]]] = []

    class Config:
        from_attributes = True


# --- ATTACK GRAPH ---
class AttackNodeOut(BaseModel):
    id: str
    node_type: str
    label: str
    node_metadata: Optional[Dict[str, Any]] = None

class AttackEdgeOut(BaseModel):
    id: str
    source_node_id: str
    target_node_id: str
    relationship: str
    confidence: int

class AttackGraphResponse(BaseModel):
    nodes: List[AttackNodeOut]
    edges: List[AttackEdgeOut]
    attack_path_node_ids: List[str]


# --- AI ---
class AIInvestigateRequest(BaseModel):
    investigation_id: str
    query: str

class AIInvestigateResponse(BaseModel):
    query: str
    answer: str
    referenced_event_ids: List[str]
    provider_used: str

class AISummaryResponse(BaseModel):
    investigation_id: str
    incident_title: str
    executive_summary: str
    timeline_summary: str
    affected_users: List[str]
    affected_resources: List[str]
    suspicious_ips: List[str]
    attack_stages: List[Dict[str, Any]]
    risk_score: int
    confidence: int
    observed_facts: List[str]
    ai_interpretation: List[str]
    recommended_steps: List[str]
    provider_used: str


# --- REPORT ---
class ReportOut(BaseModel):
    id: str
    investigation_id: str
    report_type: str
    file_path: str
    generated_at: datetime.datetime

    class Config:
        from_attributes = True


# --- DASHBOARD METRICS ---
class DashboardMetrics(BaseModel):
    investigation_id: str
    investigation_name: str
    total_events: int
    significant_events_count: int
    anomalies_count: int
    critical_findings_count: int
    unique_users_count: int
    unique_ips_count: int
    unique_resources_count: int
    overall_risk_score: int
    confidence_score: int
    severity_distribution: Dict[str, int]
    event_category_distribution: Dict[str, int]
    events_over_time: List[Dict[str, Any]]
    top_suspicious_users: List[Dict[str, Any]]
    top_suspicious_ips: List[Dict[str, Any]]
    recent_significant_events: List[EventOut]
    attack_chain_summary: List[Dict[str, Any]]
