import csv
import json
import os
import re
import io
import zipfile
import datetime
from typing import List, Dict, Any, Tuple
from app.core.logging import logger

class LogParserService:
    @staticmethod
    def parse_file(file_content: bytes, filename: str) -> List[Dict[str, Any]]:
        """Parses arbitrary log files (CSV, JSON, LOG, TXT, ZIP) into raw record dictionaries."""
        ext = os.path.splitext(filename)[1].lower()
        records = []

        if ext == ".zip":
            records = LogParserService._parse_zip(file_content)
        elif ext == ".json":
            records = LogParserService._parse_json(file_content)
        elif ext in [".csv", ".tsv"]:
            records = LogParserService._parse_csv(file_content)
        else:
            # .log, .txt or generic plain text
            records = LogParserService._parse_text_log(file_content)

        logger.info(f"Parsed {len(records)} raw log entries from '{filename}'")
        return records

    @staticmethod
    def _parse_zip(file_content: bytes) -> List[Dict[str, Any]]:
        records = []
        try:
            with zipfile.ZipFile(io.BytesIO(file_content)) as z:
                for name in z.namelist():
                    if name.startswith("__MACOSX/") or name.endswith("/"):
                        continue
                    content = z.read(name)
                    parsed = LogParserService.parse_file(content, name)
                    records.extend(parsed)
        except Exception as e:
            logger.error(f"Failed to unpack zip: {e}")
        return records

    @staticmethod
    def _parse_json(file_content: bytes) -> List[Dict[str, Any]]:
        try:
            decoded = file_content.decode("utf-8", errors="replace")
            data = json.loads(decoded)
            if isinstance(data, list):
                return [d if isinstance(d, dict) else {"raw": str(d)} for d in data]
            elif isinstance(data, dict):
                # check if wrapped in "events" or "logs"
                for key in ["events", "logs", "records", "data"]:
                    if key in data and isinstance(data[key], list):
                        return [d if isinstance(d, dict) else {"raw": str(d)} for d in data[key]]
                return [data]
        except Exception as e:
            # Fallback to JSON Lines
            lines = file_content.decode("utf-8", errors="replace").splitlines()
            records = []
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                    if isinstance(obj, dict):
                        records.append(obj)
                    else:
                        records.append({"raw": line})
                except Exception:
                    records.append({"raw": line})
            return records
        return []

    @staticmethod
    def _parse_csv(file_content: bytes) -> List[Dict[str, Any]]:
        records = []
        try:
            decoded = file_content.decode("utf-8", errors="replace")
            reader = csv.DictReader(io.StringIO(decoded))
            for row in reader:
                records.append(dict(row))
        except Exception as e:
            logger.error(f"CSV parsing error: {e}")
        return records

    @staticmethod
    def _parse_text_log(file_content: bytes) -> List[Dict[str, Any]]:
        lines = file_content.decode("utf-8", errors="replace").splitlines()
        records = []
        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue
            parsed = LogParserService._match_known_log_patterns(line_str)
            records.append(parsed)
        return records

    @staticmethod
    def _match_known_log_patterns(line: str) -> Dict[str, Any]:
        """Auto-detects syslog, auth.log, Apache/Nginx access log, Windows XML, or firewall logs."""
        # 1. Linux Auth / Syslog: "May 10 09:41:02 server sshd[1234]: Failed password for invalid user admin from 192.168.1.50 port 54321 ssh2"
        syslog_match = re.match(
            r'^([A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2})\s+([\w\.\-]+)\s+([\w\.\-\/\[\]]+):\s+(.*)$',
            line
        )
        if syslog_match:
            ts, host, proc, msg = syslog_match.groups()
            
            # Extract user & IP if present in msg
            user_match = re.search(r'for (?:invalid user )?(\w+)', msg)
            ip_match = re.search(r'from (\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})', msg)
            
            return {
                "timestamp": ts,
                "hostname": host,
                "process": proc,
                "message": msg,
                "user": user_match.group(1) if user_match else None,
                "source_ip": ip_match.group(1) if ip_match else None,
                "raw": line
            }

        # 2. Apache / Nginx Combined Access Log: 192.168.1.20 - admin [10/May/2026:09:52:10 +0000] "GET /api/database/export HTTP/1.1" 200 45210
        web_match = re.match(
            r'^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s+[\w\-]+\s+([\w\-]+)\s+\[([^\]]+)\]\s+"(\w+)\s+([^\s"]+)\s+[^"]*"\s+(\d{3})\s+(\d+|-)',
            line
        )
        if web_match:
            ip, user, ts, method, path, code, size = web_match.groups()
            return {
                "source_ip": ip,
                "user": user if user != "-" else None,
                "timestamp": ts,
                "action": method,
                "resource": path,
                "status_code": code,
                "size": size,
                "raw": line
            }

        # 3. Generic Key-Value Log: timestamp=2026-05-10T09:41:00Z user=rahul action=LOGIN_FAILED ip=192.168.1.100
        kv_pairs = re.findall(r'(\w+)=([^\s"]+|"[^"]*")', line)
        if len(kv_pairs) >= 2:
            d = {"raw": line}
            for k, v in kv_pairs:
                d[k.lower()] = v.strip('"')
            return d

        # Fallback to plain line
        return {"raw": line}
