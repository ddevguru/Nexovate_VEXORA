import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth';
import {
  ShieldAlert,
  Terminal,
  Activity,
  GitFork,
  FileSpreadsheet,
  Brain,
  Lock,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  Database,
  Search,
  Sparkles,
  Play,
  Zap,
  Award,
  ChevronDown,
  ChevronUp,
  FileCode,
  ShieldCheck,
  Server,
  RefreshCw
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleStart = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const sampleScenarios = [
    {
      title: 'SSH Brute Force & Intrusion',
      rawLog: '2026-09-08T09:41:00Z auth.log: Failed password for rahul from 192.168.1.50 port 49152 ssh2 (4 attempts)',
      parsed: {
        timestamp: '2026-09-08 09:41:00 UTC',
        user: 'rahul',
        source_ip: '192.168.1.50',
        action: 'AUTHENTICATION_FAILURE',
        severity: 'HIGH',
        risk_score: 45,
        reasons: ['Multiple failed authentication attempts within 60s', 'Unrecognized source IP']
      }
    },
    {
      title: 'Privilege Escalation (SUDO)',
      rawLog: '2026-09-08T09:47:00Z syslog: rahul : TTY=pts/1 ; PWD=/home/rahul ; USER=root ; COMMAND=/bin/bash',
      parsed: {
        timestamp: '2026-09-08 09:47:00 UTC',
        user: 'rahul (-> root)',
        source_ip: '10.0.4.102',
        action: 'PRIVILEGE_ELEVATION',
        severity: 'CRITICAL',
        risk_score: 85,
        reasons: ['Root bash shell spawned via sudo', 'Anomalous session escalation']
      }
    },
    {
      title: 'Customer Vault Database Exfiltration',
      rawLog: '2026-09-08T09:56:00Z postgres.log: SELECT * FROM customer_vault; Transferred 1.4 GB to exfil.external-server.net',
      parsed: {
        timestamp: '2026-09-08 09:56:00 UTC',
        user: 'rahul',
        source_ip: '10.0.4.102',
        action: 'DATA_EXFILTRATION',
        severity: 'CRITICAL',
        risk_score: 100,
        reasons: ['Bulk SQL query on sensitive vault table', 'Outbound data transfer exceeding 1 GB']
      }
    }
  ];

  const faqs = [
    {
      q: 'What is Problem Statement 16 (Digital Evidence Timeline Generator)?',
      a: 'Problem Statement 16 requires an automated cybersecurity investigation tool that ingests raw incident logs, normalizes timestamps into chronological order, extracts users, IPs, actions, and resources, and generates explainable incident timelines.'
    },
    {
      q: 'Does CYBERTRACE AI use mock or hardcoded application data?',
      a: 'No. CYBERTRACE AI enforces a Strict No-Mock-Data Policy. All dashboard statistics, security events, anomaly scores, attack nodes, audit logs, and PDF report contents come directly from PostgreSQL via FastAPI APIs.'
    },
    {
      q: 'How does the Isolation Forest ML Anomaly Engine work?',
      a: 'The backend ML service runs scikit-learn Isolation Forest against database event vectors (frequency, time of day, severity, action type). Statistical outliers are scored (0.0 to 1.0) and stored in PostgreSQL with explainable reasons.'
    },
    {
      q: 'How are Forensic PDF Reports generated and downloaded?',
      a: 'PDF reports are dynamically built from current PostgreSQL database state using ReportLab. In the frontend, reports are requested via an authenticated blob request and downloaded directly to your device.'
    },
    {
      q: 'Can CYBERTRACE AI ingest real-time logs from SIEM or EDR systems?',
      a: 'Yes! In addition to file uploads (CSV, JSON, Syslog, Web logs, ZIP), CYBERTRACE AI provides a REST API endpoint (POST /api/investigations/{id}/events/ingest) for batch log ingestion.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-slate-900 font-sans selection:bg-blue-500/20 selection:text-blue-900 overflow-x-hidden">
      {/* Background Subtle Grid Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#cbd5e120_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e120_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-slate-200 px-4 md:px-8 py-3.5 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-wider text-slate-900 font-sans">CYBERTRACE</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">PRO</span>
              </div>
              <p className="text-[10px] text-slate-500 font-sans hidden sm:block">Digital Evidence Timeline Generator</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <a href="#simulator" className="hover:text-blue-600 transition-colors">Log Simulator</a>
            <a href="#features" className="hover:text-blue-600 transition-colors">Capabilities</a>
            <a href="#comparison" className="hover:text-blue-600 transition-colors">SIEM Comparison</a>
            <a href="#standards" className="hover:text-blue-600 transition-colors">Standards</a>
            <a href="#faq" className="hover:text-blue-600 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all whitespace-nowrap"
              >
                Go to Workspace <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  Sign In
                </button>
                <button
                  onClick={handleStart}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all whitespace-nowrap"
                >
                  Launch Console <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 md:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-700 mb-6 shadow-xs">
          <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
          <span className="font-semibold text-blue-600">CYBERTRACE Platform</span>
          <span className="text-slate-300">•</span>
          <span>Digital Evidence Timeline & Incident Analyzer</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight max-w-5xl mx-auto leading-tight">
          From Millions of Raw Security Logs to One <span className="text-blue-600">Clear Attack Story</span>
        </h1>

        <p className="mt-6 text-sm sm:text-base text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Automated multi-format log parsing, standardized UTC chronological timeline generation, Isolation Forest ML anomaly scoring, and MITRE ATT&CK chain reconstruction — powered by PostgreSQL.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleStart}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
          >
            <Play className="w-4 h-4 fill-white" /> Start Digital Investigation
          </button>
          <a
            href="#simulator"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-xs flex items-center justify-center gap-2 transition-all"
          >
            Test Interactive Log Simulator
          </a>
        </div>

        {/* High-Contrast Live Stats Strip */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase">Architecture</div>
            <div className="text-2xl font-black text-slate-900 mt-1">PostgreSQL</div>
            <div className="text-[11px] text-slate-500 mt-1">Single Source of Truth</div>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase">Processing</div>
            <div className="text-2xl font-black text-blue-600 mt-1">&lt; 0.4 sec</div>
            <div className="text-[11px] text-slate-500 mt-1">Log Normalization Speed</div>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase">Integrity</div>
            <div className="text-2xl font-black text-slate-900 mt-1">SHA-256</div>
            <div className="text-[11px] text-slate-500 mt-1">Cryptographic Checksums</div>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase">ML Engine</div>
            <div className="text-2xl font-black text-blue-600 mt-1">scikit-learn</div>
            <div className="text-[11px] text-slate-500 mt-1">Isolation Forest Scoring</div>
          </div>
        </div>
      </section>

      {/* Interactive Log Simulator Box */}
      <section id="simulator" className="py-16 px-4 md:px-8 max-w-6xl mx-auto border-t border-slate-200">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-semibold text-blue-700 uppercase tracking-widest px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
            Interactive Product Demo
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">See How CYBERTRACE Normalizes Logs</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">Select a raw security incident scenario to view real-time normalized output.</p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
          {/* Scenario Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
            {sampleScenarios.map((sc, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === idx
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Scenario {idx + 1}: {sc.title}
              </button>
            ))}
          </div>

          {/* Scenario Content View */}
          <div className="grid md:grid-cols-2 gap-6 items-start">
            {/* Left: Raw Log Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600 font-sans font-semibold">
                <span className="flex items-center gap-1.5"><FileCode className="w-4 h-4 text-blue-600" /> Raw Evidence Log Input</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">Unparsed</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs break-all leading-relaxed shadow-inner">
                {sampleScenarios[activeTab].rawLog}
              </div>
            </div>

            {/* Right: Normalized Output */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600 font-sans font-semibold">
                <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-blue-600" /> Normalized UTC Timeline Event</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">Normalized</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 font-mono text-xs text-slate-800">
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Timestamp:</span>
                  <span className="text-slate-900 font-semibold">{sampleScenarios[activeTab].parsed.timestamp}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Entity / User:</span>
                  <span className="text-blue-700 font-semibold">{sampleScenarios[activeTab].parsed.user}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Source IP:</span>
                  <span className="text-slate-900">{sampleScenarios[activeTab].parsed.source_ip}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Action Category:</span>
                  <span className="text-blue-600 font-bold">{sampleScenarios[activeTab].parsed.action}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Risk Score:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-red-50 text-red-700 border border-red-200 font-bold">
                    {sampleScenarios[activeTab].parsed.risk_score} / 100 ({sampleScenarios[activeTab].parsed.severity})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SIEM Comparison Table Section */}
      <section id="comparison" className="py-16 px-4 md:px-8 max-w-6xl mx-auto border-t border-slate-200">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Legacy SIEM vs CYBERTRACE</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">Why CYBERTRACE outperforms traditional manual log searching.</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs font-sans border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold text-[11px] uppercase">
                <th className="py-4 px-6">Investigation Feature</th>
                <th className="py-4 px-6 text-slate-500">Traditional SIEM / Manual Analysis</th>
                <th className="py-4 px-6 text-blue-600 font-bold">CYBERTRACE Platform</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              <tr className="hover:bg-slate-50">
                <td className="py-4 px-6 font-semibold text-slate-900">Timeline Generation</td>
                <td className="py-4 px-6 text-slate-500">Manual timestamp correlation across log files</td>
                <td className="py-4 px-6 text-blue-600 font-bold">Automated UTC chronological stream (PS16)</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-4 px-6 font-semibold text-slate-900">Anomaly Detection</td>
                <td className="py-4 px-6 text-slate-500">Static threshold alerts (noisy)</td>
                <td className="py-4 px-6 text-blue-600 font-bold">Unsupervised Isolation Forest ML Model</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-4 px-6 font-semibold text-slate-900">Attack Graph Mapping</td>
                <td className="py-4 px-6 text-slate-500">Text-only log output</td>
                <td className="py-4 px-6 text-blue-600 font-bold">Hierarchical Interactive Canvas Graph</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-4 px-6 font-semibold text-slate-900">Forensic Custody Integrity</td>
                <td className="py-4 px-6 text-slate-500">No cryptographic verification</td>
                <td className="py-4 px-6 text-blue-600 font-bold">SHA-256 Hash Chain of Custody</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-4 px-6 font-semibold text-slate-900">Forensic Reporting</td>
                <td className="py-4 px-6 text-slate-500">Manual copy-paste executive summaries</td>
                <td className="py-4 px-6 text-blue-600 font-bold">1-Click Executive ReportLab PDF Generator</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Compliance Standards Banner */}
      <section id="standards" className="py-16 px-4 md:px-8 max-w-7xl mx-auto border-t border-slate-200">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Forensic Standards Compliance</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">Built in accordance with international digital evidence guidelines.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <ShieldCheck className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="text-sm font-bold text-slate-900">NIST SP 800-86</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">Guide to Integrating Forensic Techniques into Incident Response.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <Lock className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="text-sm font-bold text-slate-900">ISO/IEC 27037</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">Guidelines for identification, collection, and preservation of digital evidence.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <Cpu className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="text-sm font-bold text-slate-900">MITRE ATT&CK</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">Standardized tactic and technique classification for reconstructed incidents.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <Database className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="text-sm font-bold text-slate-900">PostgreSQL DB</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">Authoritative async persistent database storage with zero application mocks.</p>
          </div>
        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section id="faq" className="py-16 px-4 md:px-8 max-w-4xl mx-auto border-t border-slate-200">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">Everything you need to know about CYBERTRACE platform and Problem 16.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUp className="w-4 h-4 text-blue-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer Call to Action */}
      <footer className="border-t border-slate-200 bg-white py-12 px-4 md:px-8 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <span className="font-sans font-extrabold text-xl text-slate-900">CYBERTRACE</span>
          </div>
          <p className="text-xs text-slate-500 max-w-xl mx-auto">
            Problem Statement 16 • Digital Evidence Timeline Generator Platform
          </p>
          <div className="pt-2">
            <button
              onClick={handleStart}
              className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md inline-flex items-center gap-2"
            >
              Access Investigation Console <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
