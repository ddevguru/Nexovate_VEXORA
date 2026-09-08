# 🛡️ CYBERTRACE AI — Multi-Agent Digital Evidence & Incident Response Platform

> **"From millions of fragmented security events to a unified, explainable attack story."**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688.svg?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB.svg?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB.svg?style=flat-square&logo=python)](https://www.python.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED.svg?style=flat-square&logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

**CYBERTRACE AI** is a state-of-the-art, production-grade cybersecurity investigation platform and Multi-Agent AI CyberForensic Suite. Designed for Digital Forensics and Incident Response (DFIR) teams, SOC analysts, and security researchers, CYBERTRACE ingests raw security logs, normalizes timestamps into UTC, computes SHA-256 chain-of-custody hashes, detects statistical anomalies using Isolation Forests, reconstructs MITRE ATT&CK kill chains, and deploys **4 specialized autonomous AI agents** to trace, analyze, and verbally brief analysts on complex cyber incidents.

---

## 🌟 Key Platform Highlights

```
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                                   CYBERTRACE AI ARCHITECTURE                           │
 └────────────────────────────────────────────────────────────────────────────────────────┘
                                              │
    ┌─────────────────────────┐               ▼               ┌─────────────────────────┐
    │   Raw Evidence Logs     │ ──────►  Parsing & UTC  ──────► │  SHA-256 Custody Hash   │
    │  (CSV, JSON, LOG, TXT)  │         Normalization         │  & DB Ledger Integrity  │
    └─────────────────────────┘                               └─────────────────────────┘
                                                                           │
                                                                           ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                      MULTI-AGENT AI CYBERFORENSIC SUITE & TRACING                      │
 ├─────────────────────────┬─────────────────────────┬───────────────────┬────────────────┤
 │   🛡️ Auth Sentinel      │  💾 DB & Exfiltration   │ ⚡ Privilege & OS │ 🧠 Synthesizer │
 │  Brute-force & Sprays   │   SQL Dumps & Egress    │ Sudo & Elevation  │ ATT&CK & Rules │
 └─────────────────────────┴─────────────────────────┴───────────────────┴────────────────┘
                                              │
    ┌─────────────────────────┐               ▼               ┌─────────────────────────┐
    │   LangFuse-Style Tracing│ ──────► Audio Synthesis ──────► │ Interactive Attack Graph│
    │  Thought/Action/Verdict │        Voice Briefing         │   & PDF Forensic Report │
    └─────────────────────────┘                               └─────────────────────────┘
```

---

## 🔥 Key Features

### 1. 🤖 Multi-Agent AI CyberForensic Suite (PRO)
Deploy 4 autonomous AI forensic agents running concurrently to dissect multi-stage cyberattacks:
- 🛡️ **Auth Sentinel Agent**: Detects brute-force attacks, credential stuffing, password sprays, impossible travel, and lateral movement.
- 💾 **DB & Exfiltration Agent**: Identifies SQL injection patterns, abnormal `SELECT *` query volume, unauthorized database dumps, and egress bandwidth spikes.
- ⚡ **Privilege & OS Agent**: Uncovers unauthorized `sudo` usage, shadow file manipulation, process injections, and root privilege escalations.
- 🧠 **Threat Synthesizer Agent**: Aggregates multi-agent telemetry, maps events to **MITRE ATT&CK** techniques, calculates holistic incident severity, and formulates containment playbooks.

### 2. 🔍 LangFuse & LangChain Style Execution Tracing
- Full visibility into agent reasoning with step-by-step trace logs (`Thought` ➔ `Action` ➔ `Observation` ➔ `Verdict`).
- Performance telemetry including execution latency (ms), confidence percentages (%), model provider badges (`Ollama / Llama3`, `Mistral-7B`), and trace IDs (`lf-trace-*`).

### 3. 🎙️ Browser Speech Synthesis & Audio Equalizer
- Hands-free executive voice briefings powered by `window.speechSynthesis`.
- Interactive audio control suite (Play/Pause, Stop) with an animated 4-bar audio frequency equalizer.

### 4. 🕸️ Interactive React Flow Attack Graph
- Visual node-and-edge topology mapping Users, IP Addresses, Workstations, and Databases.
- **"Show Attack Path"** toggle highlighting critical attack corridors in glowing red.

### 5. 🛡️ Cryptographic Chain of Custody & UTC Normalization
- Computes SHA-256 hashes instantly upon log upload to guarantee non-repudiation.
- Auto-converts disparate timestamp standards (ISO8601, RFC3339, Syslog, Unix Epoch) into normalized UTC format.

### 6. 📊 Explainable Risk Engine & Anomaly Detection
- Additive 0–100 Risk Score algorithm with interactive `"WHY IS THIS SUSPICIOUS?"` modal breakdowns.
- `scikit-learn` Isolation Forest ML model detecting statistical outliers across request frequencies, access hours, and entity interactions.

### 7. 📄 Automated ReportLab Forensic PDF Generation
- One-click publication of audit-grade PDF incident reports complete with executive summaries, timeline breakdown tables, MITRE ATT&CK mapping, and cryptographic signatures.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend UI** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, React Flow (`@xyflow/react`), TanStack Query, React Router v6 |
| **Backend API** | Python 3.12, FastAPI, AsyncIO, Pydantic v2, SQLAlchemy 2.0, ReportLab, scikit-learn, pandas, numpy, bcrypt, python-jose |
| **Database** | SQLite + `aiosqlite` (Local Dev) & PostgreSQL 15 (Docker Production) |
| **DevOps & Containers**| Docker, Docker Compose, Nginx, Uvicorn |

---

## 📁 Repository Structure

```text
CYBERTRACE-AI/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI REST endpoints (auth, investigations, evidence, timeline, ai, reports)
│   │   ├── core/            # Config, security, JWT authentication
│   │   ├── db/              # SQLAlchemy database session & model definitions
│   │   ├── models/          # ORM data models (User, Investigation, Evidence, SecurityEvent, Incident)
│   │   ├── schemas/         # Pydantic validation schemas
│   │   └── services/        # Business logic (multi_agent_system, ai_service, pdf_generator, anomaly)
│   ├── tests/               # Pytest automated integration test suite
│   ├── Dockerfile.backend   # FastAPI backend container configuration
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # React components (layout, timeline, attack-graph, ai, common)
│   │   ├── pages/           # Application views (Dashboard, AgentsConsole, Incidents, Timeline, Reports)
│   │   ├── services/        # Axios API client & authentication context
│   │   ├── types/           # TypeScript interface definitions
│   │   ├── App.tsx          # Main React router & layout root
│   │   └── main.tsx         # Vite application entrypoint
│   ├── Dockerfile.frontend  # Nginx production frontend build
│   ├── package.json         # Node dependencies
│   └── vite.config.ts       # Vite build configuration
├── docker-compose.yml       # Multi-container orchestrator (PostgreSQL, Backend, Frontend)
└── README.md                # Documentation
```

---

## 💻 Quick Start & Installation

### Option 1: Local Development (Recommended)

#### Prerequisites
- **Python 3.12+**
- **Node.js 18+** & `npm`

#### 1. Backend Setup
```bash
# Navigate to the backend directory
cd backend

# Create and activate a Python virtual environment
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI backend server
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
> 🌐 **Backend Swagger Interactive API Docs**: [`http://127.0.0.1:8000/docs`](http://127.0.0.1:8000/docs)

#### 2. Frontend Setup
```bash
# Navigate to the frontend directory in a new terminal window
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```
> 🌐 **Frontend Web Console**: [`http://localhost:5173`](http://localhost:5173)

---

### Option 2: Docker Compose (Unified Container Launch)

Run the entire stack (PostgreSQL Database, FastAPI Backend, and Nginx Frontend) with a single command:

```bash
# Build and launch all containers in detached mode
docker compose up --build -d
```
Access the application at [`http://localhost:5173`](http://localhost:5173).

---

## 🔌 API Reference Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/token` | Authenticate user & receive JWT bearer token |
| `GET` | `/api/investigations` | List all active digital forensic investigations |
| `POST` | `/api/evidence/upload` | Upload log files (CSV, JSON, LOG) & compute SHA-256 hash |
| `GET` | `/api/timeline/{id}` | Fetch UTC-normalized chronological security events |
| `POST` | `/api/ai/agents/run-all/{id}` | Trigger **Multi-Agent AI Suite** & generate LangFuse traces |
| `GET` | `/api/reports/pdf/{id}` | Download ReportLab audit-grade forensic PDF report |

---

## 🧪 Testing & Verification

```bash
# Run backend test suite with Pytest
$env:PYTHONPATH="backend"
pytest tests/test_backend.py -v

# Run frontend TypeScript type checking & production build
cd frontend
npm run build
```

---

## 🎯 60-Second Hackathon Demo Walkthrough

1. Open [`http://localhost:5173`](http://localhost:5173) and sign in using default credentials:
   - **Email**: `analyst@cybertrace.ai`
   - **Password**: `Investigator123!`
2. Click **"Load Demo Investigation"** in the header banner.
3. Open **AI Agent Console** (`/agents`) and click **"Run All 4 Agents"**.
   - Observe real-time agent execution traces, model badges, and confidence metrics.
   - Click **"Listen Briefing"** to play the voice summary with live audio wave animation.
4. Navigate to **Attack Graph** (`/attack-graph`) and toggle **"Show Attack Path"** to inspect malicious corridors.
5. Go to **Forensic Reports** (`/reports`) and click **"Generate New PDF Report"** to review the downloadable audit document.

---

## 🔒 Security & Forensic Integrity

CYBERTRACE AI is engineered strictly as a **defensive DFIR and incident analysis framework**.
- All uploaded evidence files undergo immediate SHA-256 cryptographic hashing to maintain proof of chain of custody.
- Synthetic demo logs contain no real-world telemetry or PII.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.
