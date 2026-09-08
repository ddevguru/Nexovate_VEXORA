import uuid
import datetime
from typing import List, Dict, Any, Tuple
from app.models.all_models import Event, Anomaly, Incident, IncidentEvent, AttackNode, AttackEdge
from app.core.logging import logger

class CorrelationEngineService:
    @staticmethod
    def process_correlation(events: List[Event], anomalies: List[Anomaly], investigation_id: str) -> Tuple[Incident, List[AttackNode], List[AttackEdge]]:
        """
        Correlates timeline events into an Incident story, reconstructs Attack Chain stages,
        and constructs graph nodes and edges for React Flow.
        """
        if not events:
            return None, [], []

        sorted_events = sorted(events, key=lambda e: e.timestamp)
        start_time = sorted_events[0].timestamp
        end_time = sorted_events[-1].timestamp

        # Determine overall incident severity based on max event risk/severity
        max_risk = max([e.risk_score for e in events] + [0])
        severity = "CRITICAL" if max_risk >= 75 else ("HIGH" if max_risk >= 50 else ("MEDIUM" if max_risk >= 25 else "LOW"))

        # Primary user / IP entities involved
        users = list(set([e.user for e in events if e.user and e.user not in ["UNKNOWN", "N/A"]]))
        ips = list(set([e.source_ip for e in events if e.source_ip and e.source_ip not in ["UNKNOWN", "N/A"]]))
        primary_user = users[0] if users else "Unknown User"
        primary_ip = ips[0] if ips else "Unknown IP"

        incident_id = str(uuid.uuid4())
        incident = Incident(
            id=incident_id,
            investigation_id=investigation_id,
            title=f"Multi-Stage Attack Chain: {primary_user} from {primary_ip}",
            description=f"Automated correlation identified an incident involving {len(events)} events, {len(users)} users, and {len(ips)} IPs spanning from {start_time.strftime('%Y-%m-%d %H:%M')} to {end_time.strftime('%H:%M')} UTC.",
            severity=severity,
            confidence=min(95, max(70, 75 + len(anomalies) * 3)),
            start_time=start_time,
            end_time=end_time,
            status="OPEN"
        )

        # Build Graph Nodes & Edges
        nodes_map = {} # label -> node_id
        nodes_list = []
        edges_list = []

        def get_or_create_node(label: str, n_type: str, meta: dict = None) -> str:
            key = f"{n_type}:{label}"
            if key not in nodes_map:
                nid = str(uuid.uuid4())
                nodes_map[key] = nid
                nodes_list.append(AttackNode(
                    id=nid,
                    incident_id=incident_id,
                    node_type=n_type,
                    label=label,
                    node_metadata=meta or {}
                ))
            return nodes_map[key]

        # Always add core entity nodes
        for u in users:
            get_or_create_node(u, "User", {"entity": "user", "icon": "User"})
        for ip_addr in ips:
            get_or_create_node(ip_addr, "IP", {"entity": "ip", "icon": "Globe"})

        # Link events & attack progression
        prev_node_id = None
        for seq, e in enumerate(sorted_events):
            event_label = f"{e.action} ({e.timestamp.strftime('%H:%M:%S')})"
            e_node_id = get_or_create_node(event_label, "Event", {
                "event_id": e.id,
                "severity": e.severity,
                "risk_score": e.risk_score,
                "timestamp": e.timestamp.isoformat()
            })

            # Connect User -> Event
            if e.user:
                u_node_id = get_or_create_node(e.user, "User")
                edges_list.append(AttackEdge(
                    incident_id=incident_id,
                    source_node_id=u_node_id,
                    target_node_id=e_node_id,
                    relationship="PERFORMED",
                    confidence=95
                ))

            # Connect IP -> Event
            if e.source_ip:
                ip_node_id = get_or_create_node(e.source_ip, "IP")
                edges_list.append(AttackEdge(
                    incident_id=incident_id,
                    source_node_id=ip_node_id,
                    target_node_id=e_node_id,
                    relationship="ORIGINATED_FROM",
                    confidence=90
                ))

            # Connect Resource if present
            if e.resource:
                r_type = "Database" if "DB" in e.event_type else "File"
                r_node_id = get_or_create_node(e.resource, r_type, {"resource_type": e.resource_type})
                edges_list.append(AttackEdge(
                    incident_id=incident_id,
                    source_node_id=e_node_id,
                    target_node_id=r_node_id,
                    relationship="ACCESSED",
                    confidence=92
                ))

            # Sequential flow connection
            if prev_node_id and e.severity in ["HIGH", "CRITICAL"]:
                edges_list.append(AttackEdge(
                    incident_id=incident_id,
                    source_node_id=prev_node_id,
                    target_node_id=e_node_id,
                    relationship="LED_TO",
                    confidence=88
                ))
                prev_node_id = e_node_id
            elif e.severity in ["HIGH", "CRITICAL"]:
                prev_node_id = e_node_id

        return incident, nodes_list, edges_list

    @staticmethod
    def extract_attack_stages(events: List[Event]) -> List[Dict[str, Any]]:
        """Identifies structured MITRE-style attack chain stages with supporting evidence."""
        stages = []
        
        # 1. Authentication / Credential Abuse
        auth_events = [e for e in events if e.event_type == "AUTHENTICATION"]
        if auth_events:
            failed_count = sum(1 for e in auth_events if e.status == "FAILURE")
            stages.append({
                "stage": "CREDENTIAL_ABUSE",
                "title": "Credential Abuse / Brute Force Attempts",
                "confidence": 91 if failed_count >= 3 else 75,
                "evidence_ids": [e.id for e in auth_events[:5]],
                "description": f"Observed {len(auth_events)} authentication attempts including {failed_count} failures."
            })

        # 2. Privilege Escalation
        priv_events = [e for e in events if e.event_type == "PRIVILEGE_ESCALATION" or "sudo" in (e.raw_log or "").lower()]
        if priv_events:
            stages.append({
                "stage": "PRIVILEGE_ESCALATION",
                "title": "Privilege Escalation & Security Bypass",
                "confidence": 88,
                "evidence_ids": [e.id for e in priv_events],
                "description": "User elevated privileges or executed root/sudo operations."
            })

        # 3. Database Access
        db_events = [e for e in events if e.event_type == "DATABASE_ACCESS" or "select" in (e.raw_log or "").lower()]
        if db_events:
            stages.append({
                "stage": "DATABASE_ACCESS",
                "title": "Sensitive Database Access & Querying",
                "confidence": 94,
                "evidence_ids": [e.id for e in db_events],
                "description": "Queried sensitive database tables or exported customer datasets."
            })

        # 4. Data Transfer / Exfiltration
        exfil_events = [e for e in events if e.event_type == "DATA_TRANSFER" or "export" in (e.raw_log or "").lower() or "download" in (e.raw_log or "").lower()]
        if exfil_events:
            stages.append({
                "stage": "EXFILTRATION",
                "title": "Data Staging & Exfiltration",
                "confidence": 92,
                "evidence_ids": [e.id for e in exfil_events],
                "description": "Large file download/export initiated to external address."
            })

        return stages
