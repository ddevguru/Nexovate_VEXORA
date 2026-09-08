import re
import datetime
from dateutil import parser as date_parser
from typing import Dict, Any, Tuple

class EventNormalizerService:
    @staticmethod
    def normalize_record(raw_record: Dict[str, Any], investigation_id: str, evidence_file_id: str = None) -> Dict[str, Any]:
        """Maps an un-normalized dictionary entry into standardized Event attributes."""
        
        # Extract Timestamp
        timestamp = EventNormalizerService._extract_timestamp(raw_record)
        
        # Extract User
        user = EventNormalizerService._find_first(raw_record, ["user", "username", "account", "src_user", "uid", "subject_user_name"])
        if user and user in ["-", "N/A", "null", "none"]:
            user = None

        # Extract Source IP
        source_ip = EventNormalizerService._find_first(raw_record, ["source_ip", "src_ip", "ip", "client_ip", "src", "source_address", "c_ip"])
        if source_ip and not re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', source_ip):
            if source_ip == "::1":
                source_ip = "127.0.0.1"

        # Extract Destination IP
        dest_ip = EventNormalizerService._find_first(raw_record, ["destination_ip", "dest_ip", "dst_ip", "target_ip", "dst", "server_ip"])

        # Extract Action & Message
        raw_msg = raw_record.get("raw") or raw_record.get("message") or raw_record.get("event") or str(raw_record)
        action_val = EventNormalizerService._find_first(raw_record, ["action", "event_type", "activity", "method", "command", "operation"])
        if not action_val:
            action_val = EventNormalizerService._infer_action_from_message(raw_msg)

        # Extract Resource & Hostname
        resource = EventNormalizerService._find_first(raw_record, ["resource", "file", "path", "url", "target", "database", "table", "object_name"])
        hostname = EventNormalizerService._find_first(raw_record, ["hostname", "host", "computer_name", "server"])

        # Extract Status
        status_val = EventNormalizerService._normalize_status(raw_record, raw_msg)

        # Determine Event Category / Event Type
        event_category, base_severity = EventNormalizerService._categorize_event(action_val, raw_msg, status_val)

        # Normalize Severity if specified explicitly or fallback to base
        explicit_sev = EventNormalizerService._find_first(raw_record, ["severity", "level", "log_level"])
        final_severity = EventNormalizerService._normalize_severity(explicit_sev, base_severity)

        return {
            "investigation_id": investigation_id,
            "evidence_file_id": evidence_file_id,
            "timestamp": timestamp,
            "event_type": event_category,
            "user": user,
            "source_ip": source_ip,
            "destination_ip": dest_ip,
            "action": action_val.upper() if action_val else "UNKNOWN_ACTION",
            "resource": resource,
            "resource_type": EventNormalizerService._infer_resource_type(resource),
            "hostname": hostname or "HOST-01",
            "status": status_val,
            "severity": final_severity,
            "risk_score": 0, # computed later by RiskEngine
            "raw_log": raw_msg[:2000],
            "normalized_data": raw_record
        }

    @staticmethod
    def _find_first(d: Dict[str, Any], keys: list) -> str:
        for k in keys:
            if k in d and d[k] is not None and str(d[k]).strip():
                return str(d[k]).strip()
            # Check case-insensitive
            for actual_key in d.keys():
                if actual_key.lower() == k.lower() and d[actual_key] is not None:
                    return str(d[actual_key]).strip()
        return None

    @staticmethod
    def _extract_timestamp(record: Dict[str, Any]) -> datetime.datetime:
        ts_val = EventNormalizerService._find_first(record, ["timestamp", "time", "date", "@timestamp", "datetime", "event_time"])
        if ts_val:
            try:
                # Handle numeric epoch timestamp
                if str(ts_val).isdigit() or (isinstance(ts_val, (int, float))):
                    val = float(ts_val)
                    if val > 1e11: # milliseconds
                        val /= 1000.0
                    return datetime.datetime.utcfromtimestamp(val)
                
                # Parse date string
                dt = date_parser.parse(str(ts_val), fuzzy=True)
                if dt.tzinfo:
                    dt = dt.astimezone(datetime.timezone.utc).replace(tzinfo=None)
                return dt
            except Exception:
                pass
        return datetime.datetime.utcnow()

    @staticmethod
    def _infer_action_from_message(msg: str) -> str:
        msg_l = msg.lower()
        if "failed password" in msg_l or "login failed" in msg_l or "authentication failure" in msg_l:
            return "LOGIN_FAILED"
        if "accepted password" in msg_l or "login successful" in msg_l or "session opened" in msg_l:
            return "LOGIN_SUCCESS"
        if "sudo" in msg_l or "elevate" in msg_l or "privilege" in msg_l or "chmod +x" in msg_l:
            return "PRIVILEGE_ELEVATION"
        if "select" in msg_l or "query" in msg_l or "database" in msg_l:
            return "DATABASE_QUERY"
        if "export" in msg_l or "download" in msg_l or "transfer" in msg_l or "scp" in msg_l or "sftp" in msg_l:
            return "DATA_TRANSFER"
        return "SYSTEM_EVENT"

    @staticmethod
    def _normalize_status(record: Dict[str, Any], raw_msg: str) -> str:
        status_val = EventNormalizerService._find_first(record, ["status", "result", "outcome"])
        if status_val:
            s_up = str(status_val).upper()
            if any(x in s_up for x in ["FAIL", "ERR", "DENI", "REJECT", "401", "403", "500"]):
                return "FAILURE"
            if any(x in s_up for x in ["SUCCESS", "OK", "PASS", "200", "ACCEPTED"]):
                return "SUCCESS"

        raw_up = raw_msg.upper()
        if any(x in raw_up for x in ["FAILED", "FAILURE", "DENIED", "UNAUTHORIZED", "ERROR"]):
            return "FAILURE"
        if any(x in raw_up for x in ["ACCEPTED", "SUCCESS", "SUCCESSFUL", "GRANTED"]):
            return "SUCCESS"

        return "SUCCESS"

    @staticmethod
    def _categorize_event(action: str, raw_msg: str, status: str) -> Tuple[str, str]:
        text = f"{action} {raw_msg}".lower()

        if any(x in text for x in ["sudo", "privilege", "role change", "chmod", "groupadd", "admin privileges"]):
            return "PRIVILEGE_ESCALATION", "HIGH"
        if any(x in text for x in ["login", "auth", "ssh", "password", "session"]):
            if status == "FAILURE":
                return "AUTHENTICATION", "MEDIUM"
            return "AUTHENTICATION", "INFO"
        if any(x in text for x in ["select", "database", "sql", "db_dump", "query", "mysql", "postgres"]):
            return "DATABASE_ACCESS", "MEDIUM"
        if any(x in text for x in ["download", "upload", "transfer", "scp", "sftp", "exfiltrate", "dump"]):
            return "DATA_TRANSFER", "HIGH"
        if any(x in text for x in ["exec", "process", "cmd.exe", "powershell", "bash", "spawn"]):
            return "PROCESS_EXECUTION", "MEDIUM"
        if any(x in text for x in ["read", "write", "file", "access", "cat ", "etc/shadow", "etc/passwd"]):
            return "FILE_ACCESS", "LOW"
        if any(x in text for x in ["firewall", "connection", "connect", "port", "traffic"]):
            return "NETWORK_CONNECTION", "INFO"

        return "OTHER", "INFO"

    @staticmethod
    def _normalize_severity(explicit: str, base: str) -> str:
        if not explicit:
            return base
        exp_up = str(explicit).upper()
        if "CRIT" in exp_up or "EMERG" in exp_up or "FATAL" in exp_up:
            return "CRITICAL"
        if "HIGH" in exp_up or "ERR" in exp_up or "WARN" in exp_up:
            return "HIGH"
        if "MED" in exp_up:
            return "MEDIUM"
        if "LOW" in exp_up or "INFO" in exp_up:
            return "LOW"
        return base

    @staticmethod
    def _infer_resource_type(resource: str) -> str:
        if not resource:
            return "UNKNOWN"
        r_l = resource.lower()
        if any(x in r_l for x in ["/db/", "database", "table", "schema", ".sql", "customers"]):
            return "DATABASE"
        if any(x in r_l for x in ["/etc/", ".conf", "config", "settings"]):
            return "CONFIGURATION"
        if any(x in r_l for x in [".csv", ".zip", ".tar.gz", ".bak", ".dump", "export"]):
            return "DATA_ARCHIVE"
        if any(x in r_l for x in ["/api/", "http://", "https://", "endpoint"]):
            return "API_ENDPOINT"
        return "FILE"
