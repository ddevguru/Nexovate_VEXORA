# 🛡️ CYBERTRACE AI — Digital Evidence Timeline Generator & Incident Analyzer

> **Tagline:** *"From millions of events to one understandable attack story."*

CYBERTRACE AI is a production-quality cybersecurity investigation platform designed for **Problem 16 — Digital Evidence Timeline Generator**. It transforms raw digital evidence and security logs into structured security events, chronological timelines, significant-event detections, explainable risk scoring, anomaly detection, attack graph visualizations, and automated forensic reports.

---

## 🚀 Key Features

- **Multi-Format Log Parser**: Ingests CSV, JSON, LOG, TXT, Linux auth logs, Apache/Nginx access logs, and ZIP archives.
- **Timestamp UTC Normalization**: Auto-converts diverse timestamp formats (ISO8601, RFC3339, Syslog, Epoch) into UTC.
- **SHA-256 Chain of Custody**: Computes cryptographic hashes for all uploaded evidence files to preserve forensic integrity.
- **Explainable Risk Engine**: Additive 0-100 risk scoring with `"WHY IS THIS SUSPICIOUS?"` modal breakdown.
- **Isolation Forest ML Anomaly Engine**: `scikit-learn` model detecting statistical outliers across frequency, access hours, and entity interactions.
- **Attack Chain Reconstruction**: MITRE ATT&CK style stage extraction (`CREDENTIAL_ABUSE` -> `PRIVILEGE_ESCALATION` -> `DATABASE_ACCESS` -> `EXFILTRATION`).
- **Interactive React Flow Attack Graph**: Visual node-edge graph mapping Users, IPs, Servers, and Databases with `"Show Attack Path"` highlighting.
- **AI Investigation Assistant**: Gemini API integration with strict evidence grounding (cites explicit Event IDs).
- **Deterministic AI Fallback**: Operates 100% reliably even without an API key using deterministic heuristic analysis.
- **Automated ReportLab PDF Reports**: Generates professional PDF forensic audit reports and CSV timeline exports.
- **One-Click Hackathon Demo Mode**: Auto-loads a pre-seeded multi-stage account compromise scenario in seconds.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, React Flow (`@xyflow/react`), TanStack Query, React Router.
- **Backend**: Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0, ReportLab, scikit-learn, pandas, numpy, passlib, bcrypt, python-jose.
- **Database**: SQLite (out-of-the-box local setup) & PostgreSQL (Docker deployment).
- **Containerization**: Docker, Docker Compose.

---

## 💻 Quick Start & Installation

### Option 1: Local Development (Fastest)

#### 1. Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate   # Windows
# source venv/bin/activate  # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Backend Swagger API Docs will be live at: `http://127.0.0.1:8000/docs`

#### 2. Frontend Setup
```bash
# Navigate to frontend in a new terminal
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Frontend Web UI will be live at: `http://localhost:5173`

---

### Option 2: Docker Compose (Unified Container Build)

```bash
# Build and launch PostgreSQL, FastAPI Backend, and Nginx Frontend
docker compose up --build
```
Access the application at `http://localhost:5173`.

---

## 🧪 Testing Instructions

```bash
# Run backend pytest test suite
$env:PYTHONPATH="backend"
.\backend\venv\Scripts\pytest.exe tests/test_backend.py

# Run frontend build verification
cd frontend
npm run build
```

---

## 🎯 60-Second Demo Flow for Hackathon Judges

1. Open `http://localhost:5173`. Sign in with default credentials (`analyst@cybertrace.ai` / `Investigator123!`).
2. Click **"Load Demo Investigation"** in the top bar.
3. Open **Evidence Portal** to inspect the `demo_incident_logs.json` file and verify the SHA-256 hash.
4. Navigate to **Timeline Engine** to view the chronological stream. Click **"Why is this suspicious?"** on the `PRIVILEGE_ELEVATION` event.
5. Navigate to **Attack Graph** and click **"Show Attack Path"**.
6. Open **AI Investigation Assistant** and click *"What happened in this investigation?"*.
7. Navigate to **Forensic Reports** and click **"Generate New PDF Report"** to download the complete report.

---

## 🔒 Security & Ethics Disclaimer

CyberTrace AI is designed purely as a defensive digital forensics and incident response (DFIR) investigation aid. It contains no exploitation, malware creation, or unauthorized scanning code. All demo logs are 100% synthetic and contain no real personal identifying data.
