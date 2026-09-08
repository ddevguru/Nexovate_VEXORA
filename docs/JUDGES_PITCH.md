# 🏆 CYBERTRACE AI — Judges Pitch & Innovation Brief

## 1. Problem Statement & Core Objective
**Problem 16: Digital Evidence Timeline Generator**
Digital forensics investigators face immense friction sifting through disparate log files (syslog, web access, CSV exports, auth logs). **CyberTrace AI** ingests raw evidence, normalizes timestamps into UTC, computes risk scores, detects statistical anomalies using Isolation Forest ML, reconstructs attack chains, and generates PDF forensic reports.

---

## 2. Key Technical Innovations
1. **Core Problem 16 Alignment**: High-performance multi-format parser supporting CSV, JSON, Linux Auth logs, Syslog, Apache/Nginx access logs, and ZIP archives.
2. **Explainable Risk Scoring**: Additive 0-100 risk score breakdown explaining exact rules triggered (`+20 successful login after failures`, `+25 privilege escalation`).
3. **Isolation Forest Anomaly Detection**: `scikit-learn` unsupervised ML model calculating statistical outlier scores over event frequency, hour of day, and entity interactions.
4. **Interactive React Flow Attack Graph**: Visual graph connecting User, IP, Server, Database, and Event nodes with an instant "Show Attack Path" toggle.
5. **AI Assistant with Deterministic Fallback**: Gemini API integration producing evidence-grounded Q&A with explicit Event ID citations. If no API key exists, seamlessly uses deterministic rule-based analysis.
6. **One-Click Demo Mode**: Pre-seeded synthetic attack scenario for instantaneous judge evaluation.

---

## 3. Technology Stack Summary
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide icons, Recharts, React Flow (`@xyflow/react`), TanStack Query, React Router.
- **Backend**: Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0, ReportLab, scikit-learn, pandas, numpy.
- **Database**: SQLite (out-of-the-box local dev) & PostgreSQL (Docker production).
- **Containerization**: Docker & Docker Compose.
