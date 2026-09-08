import React, { useState, useEffect } from 'react';
import { incidentsAPI, aiAPI } from '../services/api';
import { Incident, AISummary, SecurityEvent } from '../types';
import { Badge } from '../components/common/Badge';
import { InteractiveTiltCard } from '../components/common/InteractiveTiltCard';
import {
  Flame,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Server,
  User,
  Database,
  FileText,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  TrendingUp,
  Cpu
} from 'lucide-react';

interface IncidentsPageProps {
  investigationId: string | null;
}

export const IncidentsPage: React.FC<IncidentsPageProps> = ({ investigationId }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [replayEvents, setReplayEvents] = useState<SecurityEvent[]>([]);
  const [impact, setImpact] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Incident Replay State
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (investigationId) {
      loadData();
    }
  }, [investigationId]);

  useEffect(() => {
    let timer: any;
    if (isPlaying && replayEvents.length > 0) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= replayEvents.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, replayEvents]);

  const loadData = async () => {
    if (!investigationId) return;
    setLoading(true);
    try {
      const incList = await incidentsAPI.list(investigationId).catch(() => []);
      setIncidents(incList || []);
      const aiSum = await aiAPI.getSummary(investigationId).catch(() => null);
      if (aiSum) {
        setSummary(aiSum);
      }
      const stream = await incidentsAPI.getReplayStream(investigationId).catch(() => []);
      setReplayEvents(stream || []);
      const imp = await incidentsAPI.getImpactAnalysis(investigationId).catch(() => null);
      setImpact(imp);
    } catch (err) {
      console.error('Incident data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeReplayEvent = replayEvents[currentStep] || null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-white via-orange-50/40 to-amber-50/30 border border-orange-200/60 shadow-sm relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="relative z-10 space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[11px] font-bold font-mono border border-orange-200 uppercase tracking-wider">
              Forensic Progression
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              <Sparkles className="w-3 h-3 text-blue-500" />
              Dynamic Timeline Replay
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-600" /> Incident Story, Replay & Impact Analysis
          </h2>
          <p className="text-xs text-slate-600 font-sans">
            Reconstruct what happened, inspect chronological execution steps, and isolate compromised entities.
          </p>
        </div>

        {summary && (
          <div className="relative z-10 flex items-center gap-4 bg-white/95 p-3.5 rounded-xl border border-slate-200 shadow-sm backdrop-blur-md">
            <div className="text-center px-2">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block tracking-wider">THREAT LEVEL</span>
              <span className="text-2xl font-black font-mono text-red-600">
                {summary.risk_score}<span className="text-xs text-slate-400 font-normal">/100</span>
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-center px-2">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block tracking-wider">CONFIDENCE</span>
              <span className="text-2xl font-black font-mono text-blue-600">{summary.confidence}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Incident Replay Control Bar */}
      {replayEvents.length > 0 && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Play className="w-4 h-4 text-blue-600" /> Step-by-Step Incident Replay
              </h3>
              <p className="text-xs text-slate-500">Play sequence of attacker actions and anomalous commands</p>
            </div>
            <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Step {currentStep + 1} of {replayEvents.length}
            </span>
          </div>

          {/* Progress Bar Visualizer */}
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 transition-all duration-300 rounded-full"
              style={{ width: `${((currentStep + 1) / replayEvents.length) * 100}%` }}
            />
          </div>

          {/* Replay Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-all transform active:scale-95 ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Pause Replay' : 'Play Replay'}
            </button>

            <button
              onClick={() => setCurrentStep((prev) => Math.min(replayEvents.length - 1, prev + 1))}
              disabled={currentStep >= replayEvents.length - 1}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-300 disabled:opacity-40 flex items-center gap-1.5 shadow-xs transition-all"
            >
              <SkipForward className="w-3.5 h-3.5" /> Next Step
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep(0);
              }}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-300 flex items-center gap-1.5 shadow-xs transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          {/* Active Event Highlight Card with 3D Tilt */}
          {activeReplayEvent && (
            <InteractiveTiltCard
              tiltAmount={6}
              glowColor="rgba(59, 130, 246, 0.15)"
              className="p-5 rounded-xl bg-gradient-to-br from-blue-50/40 via-white to-slate-50 border border-blue-200 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-mono text-blue-700 font-bold bg-blue-100/60 px-2.5 py-1 rounded-md border border-blue-200">
                  {new Date(activeReplayEvent.timestamp).toUTCString()}
                </span>
                <Badge variant={activeReplayEvent.severity.toLowerCase() as any}>{activeReplayEvent.severity}</Badge>
              </div>
              <h4 className="text-base font-bold text-slate-900">{activeReplayEvent.action}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 text-xs font-mono">
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">ACTOR / USER</span>
                  <span className="text-slate-900 font-bold">{activeReplayEvent.user || 'SYSTEM / ROOT'}</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">SOURCE IP</span>
                  <span className="text-slate-900 font-bold">{activeReplayEvent.source_ip || 'Internal'}</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">TARGET RESOURCE</span>
                  <span className="text-slate-900 font-bold truncate block">{activeReplayEvent.resource || 'N/A'}</span>
                </div>
              </div>
            </InteractiveTiltCard>
          )}
        </div>
      )}

      {/* Impact Analysis Grid with Tilt Cards */}
      {impact && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600" /> Evidence-Linked Impact Analysis
            </h3>
            <span className="text-xs font-mono text-slate-500">Blast Radius Assessment</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InteractiveTiltCard
              tiltAmount={10}
              glowColor="rgba(59, 130, 246, 0.15)"
              className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-1.5"
            >
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" /> Affected Users
              </span>
              <p className="text-lg font-mono font-bold text-slate-900 truncate">
                {impact.affected_users.join(', ') || 'None identified'}
              </p>
            </InteractiveTiltCard>

            <InteractiveTiltCard
              tiltAmount={10}
              glowColor="rgba(16, 185, 129, 0.15)"
              className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-1.5"
            >
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-600" /> Affected Hosts
              </span>
              <p className="text-lg font-mono font-bold text-slate-900 truncate">
                {impact.affected_hosts.join(', ') || 'None identified'}
              </p>
            </InteractiveTiltCard>

            <InteractiveTiltCard
              tiltAmount={10}
              glowColor="rgba(245, 158, 11, 0.15)"
              className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-1.5"
            >
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-amber-600" /> Affected Databases
              </span>
              <p className="text-lg font-mono font-bold text-slate-900 truncate">
                {impact.affected_databases.join(', ') || 'None identified'}
              </p>
            </InteractiveTiltCard>

            <InteractiveTiltCard
              tiltAmount={10}
              glowColor="rgba(239, 68, 68, 0.15)"
              className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-1.5"
            >
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-red-600" /> Impact Level
              </span>
              <div>
                <Badge variant="critical">{impact.estimated_impact_level || 'EVALUATING'}</Badge>
              </div>
            </InteractiveTiltCard>
          </div>
        </div>
      )}

      {/* Incident Story & AI Summary Card with 3D Tilt */}
      {summary && (
        <InteractiveTiltCard
          tiltAmount={5}
          glowColor="rgba(99, 102, 241, 0.12)"
          className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5"
        >
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  AI Forensic Narrative
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">{summary.incident_title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="critical">RISK {summary.risk_score}/100</Badge>
              <Badge variant="cyan">{summary.confidence}% CONFIDENCE</Badge>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans">
              <p className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-500" /> Executive Narrative
              </p>
              {summary.executive_summary}
            </div>

            {summary.root_cause_analysis && (
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 text-xs text-slate-800 leading-relaxed">
                <p className="font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" /> Root Cause & Attack Vector
                </p>
                {summary.root_cause_analysis}
              </div>
            )}

            {summary.key_findings && summary.key_findings.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Key Forensic Discoveries
                </h4>
                <div className="grid sm:grid-cols-2 gap-2">
                  {summary.key_findings.map((finding: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2 hover:border-blue-300 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <span>{finding}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summary.recommended_remediations && summary.recommended_remediations.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-600" /> Recommended Action Items
                </h4>
                <div className="flex flex-wrap gap-2">
                  {summary.recommended_remediations.map((item: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-200 hover:bg-red-100 transition-colors flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </InteractiveTiltCard>
      )}
    </div>
  );
};

