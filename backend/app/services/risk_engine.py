import datetime
from typing import List, Dict, Any, Tuple
from app.models.all_models import Event

class RiskEngineService:
    @staticmethod
    def analyze_events(events: List[Event]) -> Tuple[List[Event], List[Dict[str, Any]]]:
        """
        Evaluates deterministic rules, computes explainable risk scores (0-100),
        and returns updated events and a list of detected significant rules.
        """
        if not events:
            return [], []

        # Sort chronologically
        events.sort(key=lambda e: e.timestamp)
        
        detections = []
        user_history = {}
        ip_history = set()
        user_ips = {}
        
        # Track sliding windows
        failed_logins_window = [] # list of (timestamp, event_id, user, ip)
        
        for i, event in enumerate(events):
            reasons = []
            risk_addition = 0

            ts = event.timestamp
            usr = event.user or "UNKNOWN_USER"
            ip = event.source_ip or "UNKNOWN_IP"
            action = event.action or ""
            status = event.status or "SUCCESS"
            event_type = event.event_type or ""
            raw = (event.raw_log or "").lower()

            # Rule 6: Access at unusual hours (11 PM to 5 AM)
            hour = ts.hour
            if hour >= 23 or hour < 5:
                risk_addition += 10
                reasons.append("Unusual access time (late night / early morning activity)")
                detections.append({
                    "rule": "UNUSUAL_ACCESS_TIME",
                    "reason": f"Activity recorded at off-hours ({ts.strftime('%H:%M')} UTC)",
                    "supporting_event_ids": [event.id],
                    "confidence": 75,
                    "risk_score_impact": 10
                })

            # Rule 7: New IP for an existing user
            if usr != "UNKNOWN_USER":
                if usr not in user_ips:
                    user_ips[usr] = set()
                elif ip not in user_ips[usr] and ip != "UNKNOWN_IP" and len(user_ips[usr]) > 0:
                    risk_addition += 15
                    reasons.append(f"New source IP ({ip}) detected for user '{usr}'")
                    detections.append({
                        "rule": "NEW_SOURCE_IP",
                        "reason": f"User {usr} connected from an unrecognized IP {ip}",
                        "supporting_event_ids": [event.id],
                        "confidence": 85,
                        "risk_score_impact": 15
                    })
                if ip != "UNKNOWN_IP":
                    user_ips[usr].add(ip)

            # Rule 1 & Rule 2: Failed Logins & Account Compromise Sequence
            if event_type == "AUTHENTICATION" and status == "FAILURE":
                risk_addition += 10
                failed_logins_window.append((ts, event.id, usr, ip))
                
                # Prune sliding window to keep only events within last 10 minutes (600s)
                failed_logins_window = [f for f in failed_logins_window if (ts - f[0]).total_seconds() <= 600]
                
                # Check for > 5 failed logins within 5 minutes
                recent_fails = [f for f in failed_logins_window if (ts - f[0]).total_seconds() <= 300 and (f[2] == usr or f[3] == ip)]
                if len(recent_fails) >= 5:
                    risk_addition += 15
                    reasons.append("Brute force indicator: >5 failed login attempts in 5-minute window")
                    detections.append({
                        "rule": "BRUTE_FORCE_INDICATOR",
                        "reason": f"Repeated authentication failures ({len(recent_fails)} attempts) for {usr} from {ip}",
                        "supporting_event_ids": [f[1] for f in recent_fails],
                        "confidence": 90,
                        "risk_score_impact": 25
                    })
            elif event_type == "AUTHENTICATION" and status == "SUCCESS":
                # Prune sliding window to keep only events within last 10 minutes (600s)
                failed_logins_window = [f for f in failed_logins_window if (ts - f[0]).total_seconds() <= 600]
                
                # Check if preceded by multiple failed logins
                recent_fails = [f for f in failed_logins_window if (ts - f[0]).total_seconds() <= 600 and (f[2] == usr or f[3] == ip)]
                if len(recent_fails) >= 3:
                    risk_addition += 20
                    reasons.append(f"Possible Account Compromise: Successful login immediately following {len(recent_fails)} failed attempts")
                    event.severity = "HIGH"
                    detections.append({
                        "rule": "POSSIBLE_ACCOUNT_COMPROMISE",
                        "reason": f"Authentication granted for {usr} after multiple authentication failures from {ip}",
                        "supporting_event_ids": [f[1] for f in recent_fails] + [event.id],
                        "confidence": 92,
                        "risk_score_impact": 35
                    })

            # Rule 3: Privilege Escalation
            if event_type == "PRIVILEGE_ESCALATION" or "sudo" in raw or "chmod" in raw or "admin" in raw:
                risk_addition += 25
                reasons.append("Privilege escalation / Sudo elevation activity detected")
                if event.severity not in ["HIGH", "CRITICAL"]:
                    event.severity = "HIGH"
                detections.append({
                    "rule": "PRIVILEGE_ESCALATION",
                    "reason": f"User {usr} elevated security privileges or ran administrative command",
                    "supporting_event_ids": [event.id],
                    "confidence": 88,
                    "risk_score_impact": 25
                })

            # Rule 4: Sensitive Database Access after privilege escalation
            if event_type == "DATABASE_ACCESS" or "select" in raw or "database" in raw:
                risk_addition += 20
                reasons.append("Sensitive database access / query operation")
                detections.append({
                    "rule": "SUSPICIOUS_DATABASE_ACCESS",
                    "reason": f"Database query executed on resource '{event.resource or 'SQL DB'}' by {usr}",
                    "supporting_event_ids": [event.id],
                    "confidence": 89,
                    "risk_score_impact": 20
                })

            # Rule 5: Large Outbound Data Transfer
            if event_type == "DATA_TRANSFER" or "download" in raw or "export" in raw or "scp" in raw:
                risk_addition += 25
                reasons.append("Large data export or potential exfiltration transfer")
                event.severity = "CRITICAL"
                detections.append({
                    "rule": "POSSIBLE_DATA_EXFILTRATION",
                    "reason": f"Outbound data transfer / export initiated by {usr} from {ip}",
                    "supporting_event_ids": [event.id],
                    "confidence": 94,
                    "risk_score_impact": 30
                })

            # Calculate final normalized risk score (0 to 100)
            base_score = 10 if event.severity == "LOW" else (25 if event.severity == "MEDIUM" else (60 if event.severity == "HIGH" else 85))
            final_risk = min(100, base_score + risk_addition)
            
            event.risk_score = final_risk
            
            # Store reasons in event normalized_data if applicable
            if not isinstance(event.normalized_data, dict):
                event.normalized_data = {}
            event.normalized_data["significance_reasons"] = list(set(reasons))

        return events, detections
