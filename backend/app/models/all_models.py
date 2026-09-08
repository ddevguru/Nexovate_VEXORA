import datetime
import uuid
from sqlalchemy import (
    Column, String, Integer, Float, DateTime, ForeignKey, Text, JSON, Index
)
from sqlalchemy.orm import relationship as sa_relationship
from app.db.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="INVESTIGATOR") # ADMIN, INVESTIGATOR, VIEWER
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="ACTIVE") # ACTIVE, CLOSED, IN_PROGRESS, COMPLETED
    severity = Column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    created_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    evidence_files = sa_relationship("EvidenceFile", back_populates="investigation", cascade="all, delete-orphan")
    events = sa_relationship("Event", back_populates="investigation", cascade="all, delete-orphan")
    anomalies = sa_relationship("Anomaly", back_populates="investigation", cascade="all, delete-orphan")
    incidents = sa_relationship("Incident", back_populates="investigation", cascade="all, delete-orphan")
    reports = sa_relationship("Report", back_populates="investigation", cascade="all, delete-orphan")


class EvidenceFile(Base):
    __tablename__ = "evidence_files"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    investigation_id = Column(String(36), ForeignKey("investigations.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(Integer, nullable=False) # bytes
    sha256_hash = Column(String(64), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    processing_status = Column(String(30), default="UPLOADED") # UPLOADED, PROCESSING, COMPLETED, FAILED
    event_count = Column(Integer, default=0)

    investigation = sa_relationship("Investigation", back_populates="evidence_files")
    events = sa_relationship("Event", back_populates="evidence_file", cascade="all, delete-orphan")


class Event(Base):
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    investigation_id = Column(String(36), ForeignKey("investigations.id"), nullable=False)
    evidence_file_id = Column(String(36), ForeignKey("evidence_files.id"), nullable=True)
    
    timestamp = Column(DateTime, nullable=False)
    event_type = Column(String(100), nullable=False) # e.g. AUTHENTICATION, FILE_ACCESS
    user = Column(String(100), nullable=True)
    source_ip = Column(String(45), nullable=True)
    destination_ip = Column(String(45), nullable=True)
    action = Column(String(100), nullable=False)
    resource = Column(String(255), nullable=True)
    resource_type = Column(String(100), nullable=True)
    hostname = Column(String(100), nullable=True)
    status = Column(String(20), default="SUCCESS") # SUCCESS, FAILURE, UNKNOWN
    severity = Column(String(20), default="INFO") # INFO, LOW, MEDIUM, HIGH, CRITICAL
    risk_score = Column(Integer, default=0)
    
    raw_log = Column(Text, nullable=True)
    normalized_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    investigation = sa_relationship("Investigation", back_populates="events")
    evidence_file = sa_relationship("EvidenceFile", back_populates="events")
    anomalies = sa_relationship("Anomaly", back_populates="event", cascade="all, delete-orphan")

# Indexes on events table
Index("idx_events_investigation_id", Event.investigation_id)
Index("idx_events_timestamp", Event.timestamp)
Index("idx_events_user", Event.user)
Index("idx_events_source_ip", Event.source_ip)
Index("idx_events_event_type", Event.event_type)
Index("idx_events_severity", Event.severity)

# Composite Indexes for Query Optimization
Index("idx_events_inv_timestamp", Event.investigation_id, Event.timestamp)
Index("idx_events_inv_severity", Event.investigation_id, Event.severity)
Index("idx_events_inv_event_type", Event.investigation_id, Event.event_type)
Index("idx_events_inv_user", Event.investigation_id, Event.user)
Index("idx_events_inv_source_ip", Event.investigation_id, Event.source_ip)


class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    investigation_id = Column(String(36), ForeignKey("investigations.id"), nullable=False)
    event_id = Column(String(36), ForeignKey("events.id"), nullable=False)
    anomaly_score = Column(Float, nullable=False) # 0.0 to 1.0
    risk_level = Column(String(20), nullable=False) # NORMAL, LOW, MEDIUM, HIGH, CRITICAL
    reason = Column(Text, nullable=False)
    detector = Column(String(100), default="IsolationForest")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    investigation = sa_relationship("Investigation", back_populates="anomalies")
    event = sa_relationship("Event", back_populates="anomalies")

Index("idx_anomalies_investigation_id", Anomaly.investigation_id)


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    investigation_id = Column(String(36), ForeignKey("investigations.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(20), default="HIGH")
    confidence = Column(Integer, default=85) # percentage
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    status = Column(String(50), default="OPEN")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    investigation = sa_relationship("Investigation", back_populates="incidents")
    incident_events = sa_relationship("IncidentEvent", back_populates="incident", cascade="all, delete-orphan")
    nodes = sa_relationship("AttackNode", back_populates="incident", cascade="all, delete-orphan")
    edges = sa_relationship("AttackEdge", back_populates="incident", cascade="all, delete-orphan")


class IncidentEvent(Base):
    __tablename__ = "incident_events"

    incident_id = Column(String(36), ForeignKey("incidents.id"), primary_key=True)
    event_id = Column(String(36), ForeignKey("events.id"), primary_key=True)
    sequence_number = Column(Integer, nullable=False)

    incident = sa_relationship("Incident", back_populates="incident_events")
    event = sa_relationship("Event")


class AttackNode(Base):
    __tablename__ = "attack_nodes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    incident_id = Column(String(36), ForeignKey("incidents.id"), nullable=False)
    node_type = Column(String(50), nullable=False) # User, IP, Device, Server, Database, File, Process, Event
    label = Column(String(150), nullable=False)
    node_metadata = Column(JSON, nullable=True)

    incident = sa_relationship("Incident", back_populates="nodes")


class AttackEdge(Base):
    __tablename__ = "attack_edges"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    incident_id = Column(String(36), ForeignKey("incidents.id"), nullable=False)
    source_node_id = Column(String(36), nullable=False)
    target_node_id = Column(String(36), nullable=False)
    relationship = Column(String(100), nullable=False) # LOGIN_FROM, ACCESSED, ESCALATED, EXECUTED, CONNECTED_TO, TRANSFERRED_TO
    confidence = Column(Integer, default=90)

    incident = sa_relationship("Incident", back_populates="edges")


class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    investigation_id = Column(String(36), ForeignKey("investigations.id"), nullable=False)
    report_type = Column(String(50), default="PDF")
    file_path = Column(String(550), nullable=False)
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)

    investigation = sa_relationship("Investigation", back_populates="reports")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=True)
    resource_id = Column(String(36), nullable=True)
    ip_address = Column(String(45), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
