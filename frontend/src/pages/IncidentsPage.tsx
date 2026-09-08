import React, { useState, useEffect } from 'react';
import { incidentsAPI, aiAPI } from '../services/api';
import { Incident, AISummary, SecurityEvent } from '../types';
import { Badge } from '../components/common/Badge';
import { Flame, ShieldAlert, Sparkles, CheckCircle2, Play, Pause, SkipForward, RotateCcw, Server, User, Database, FileText } from 'lucide-react';

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
      const incList = await incidentsAPI.list(investigationId);
      setIncidents(incList);
      const aiSum = await aiAPI.getSummary(investigationId);
      setSummary(aiSum);
      const stream = await incidentsAPI.getReplayStream(investigationId);
      setReplayEvents(stream);
      const imp = await incidentsAPI.getImpactAnalysis(investigationId);
      setImpact(imp);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activeReplayEvent = replayEvents[currentStep] || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-600" /> Incident Story, Replay & Impact Analysis
        </h2>
        <p className="text-xs text-slate-500 font-sans">Reconstruct what happened, play step-by-step incident progression, and review affected assets.</p>
      </div>

      {/* Incident Replay Control Bar */}
      {replayEvents.length > 0 && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Play className="w-4 h-4 text-blue-600" /> Step-by-Step Incident Replay
            </h3>
            <span className="text-xs font-mono text-slate-500">
              Step {currentStep + 1} of {replayEvents.length}
            </span>
          </div>

          {/* Replay Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Pause' : 'Play Replay'}
            </button>

            <button
              onClick={() => setCurrentStep((prev) => Math.min(replayEvents.length - 1, prev + 1))}
              disabled={currentStep >= replayEvents.length - 1}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs border border-slate-300 disabled:opacity-40 flex items-center gap-1 shadow-xs"
            >
              <SkipForward className="w-3.5 h-3.5" /> Next Step
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep(0);
              }}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs border border-slate-300 flex items-center gap-1 shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          {/* Active Event Highlight Card */}
          {activeReplayEvent && (
            <div className="p-4 rounded-xl bg-slate-50 border border-blue-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-blue-700 font-semibold">
                  {new Date(activeReplayEvent.timestamp).toUTCString()}
                </span>
                <Badge variant={activeReplayEvent.severity.toLowerCase() as any}>{activeReplayEvent.severity}</Badge>
              </div>
              <h4 className="text-sm font-bold text-slate-900">{activeReplayEvent.action}</h4>
              <p className="text-xs text-slate-600 font-mono">
                User: <span className="text-slate-900 font-semibold">{activeReplayEvent.user || 'N/A'}</span> | Source IP: <span className="text-slate-900 font-semibold">{activeReplayEvent.source_ip || 'N/A'}</span> | Resource: <span className="text-slate-900 font-semibold">{activeReplayEvent.resource || 'N/A'}</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Impact Analysis Grid */}
      {impact && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600" /> Evidence-Linked Impact Analysis
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs text-slate-500 flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-blue-600" /> Affected Users</span>
              <p className="text-base font-mono font-bold text-slate-900">{impact.affected_users.join(', ') || 'None'}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs text-slate-500 flex items-center gap-1.5"><Server className="w-3.5 h-3.5 text-blue-600" /> Affected Hosts</span>
              <p className="text-base font-mono font-bold text-slate-900">{impact.affected_hosts.join(', ') || 'None'}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs text-slate-500 flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-blue-600" /> Affected Databases</span>
              <p className="text-base font-mono font-bold text-slate-900">{impact.affected_databases.join(', ') || 'None'}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs text-slate-500 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-blue-600" /> Impact Level</span>
              <Badge variant="critical">{impact.estimated_impact_level}</Badge>
            </div>
          </div>
        </div>
      )}

      {/* Incident Story & AI Summary */}
      {summary && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">{summary.incident_title}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="critical">RISK {summary.risk_score}/100</Badge>
              <Badge variant="cyan">{summary.confidence}% CONFIDENCE</Badge>
            </div>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
            {summary.executive_summary}
          </p>
        </div>
      )}
    </div>
  );
};
