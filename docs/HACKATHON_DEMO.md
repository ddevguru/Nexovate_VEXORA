# 🎯 CYBERTRACE AI — 5-Minute Hackathon Demo Script

**Tagline:** *"From millions of events to one understandable attack story."*

---

## ⏱️ Demo Sequence (Step-by-Step)

### 0:00 - 0:45 | Introduction & Problem 16 Statement
- **Presenter:** *"Judges, in real-world SOC investigations, analysts drown in millions of raw CSV, JSON, and Syslog log lines. Problem 16 asks for a Digital Evidence Timeline Generator. We built **CYBERTRACE AI** to solve this exact bottleneck."*
- Show Landing Page. Mention key tagline.

### 0:45 - 1:30 | One-Click Demo Mode & SHA-256 Integrity Verification
- Click **"Load Demo Investigation"** button on the header.
- Navigate to **Evidence Portal**. Show uploaded file `demo_incident_logs.json`.
- Point out computed **SHA-256 Checksum**:
  > *"Every evidence file is hashed upon upload ensuring forensic chain-of-custody integrity without modifying raw source logs."*

### 1:30 - 2:30 | Chronological Timeline Engine (PS16 Core)
- Click **Timeline Engine** in sidebar navigation.
- Highlight features:
  - Chronological vertical timeline stream.
  - Severity color badges (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
  - UTC timestamp normalization.
- Click on the suspicious event **"PRIVILEGE_ELEVATION"**.
- Click **"WHY IS THIS SUSPICIOUS?"** button:
  > *"Notice how CyberTrace doesn't just show log entries. It explains WHY an event is suspicious with additive risk breakdown (+20 account compromise, +25 sudo elevation)."*

### 2:30 - 3:30 | Attack Chain & Interactive Attack Graph
- Navigate to **Incident Chain**:
  - Show reconstructed MITRE ATT&CK stages (`CREDENTIAL_ABUSE` -> `PRIVILEGE_ESCALATION` -> `DATABASE_ACCESS` -> `EXFILTRATION`).
- Navigate to **Attack Graph**:
  - Click **"Show Attack Path"**:
  - Demonstrate interactive React Flow graph highlighting compromised User, IP, Server, and Database nodes.

### 3:30 - 4:15 | AI Investigation Assistant (With Deterministic Fallback)
- Open **AI Investigation Assistant** (Sparkles button).
- Click sample prompt: *"What happened in this investigation?"*
- Point out grounded response with explicit **Event ID citations** (e.g. E102, E105).
- Mention API Fallback:
  > *"If no API key is provided, CyberTrace switches seamlessly to our deterministic rule engine without throwing errors."*

### 4:15 - 5:00 | Automated PDF Report & Wrap-Up
- Navigate to **Forensic Reports**.
- Click **"Generate New PDF Report"**, open and download the PDF.
- Show Executive Summary, Evidence Hashes Table, Key Timeline, and Disclaimer badge.
- **Closing Statement:** *"CyberTrace AI transforms unreadable logs into an actionable, explainable attack story in seconds."*
