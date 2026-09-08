import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  ShieldAlert,
  Database,
  Terminal,
  Cpu,
  Brain,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Copy,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Eye,
  Wrench,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Radio
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { investigationsAPI, multiAgentAPI } from '../services/api';
import { Investigation, MultiAgentSuiteResponse, AgentResult, AgentTraceStep } from '../types';

interface AgentsConsolePageProps {
  investigationId?: string | null;
}

export const AgentsConsolePage: React.FC<AgentsConsolePageProps> = ({ investigationId: initialInvId }) => {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [selectedInvId, setSelectedInvId] = useState<string>(initialInvId || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [suiteData, setSuiteData] = useState<MultiAgentSuiteResponse | null>(null);
  const [selectedAgentTab, setSelectedAgentTab] = useState<string>('all');
  const [copiedTrace, setCopiedTrace] = useState<boolean>(false);
  const [expandedTraceIndex, setExpandedTraceIndex] = useState<number | null>(null);

  // --- Voice Text-to-Speech (TTS) Engine State ---
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speakingAgentId, setSpeakingAgentId] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState<number>(0);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const briefingQueueRef = useRef<Array<{ text: string; agentId: string }>>([]);

  // Load available investigations
  useEffect(() => {
    const fetchInvs = async () => {
      try {
        const list = await investigationsAPI.list();
        setInvestigations(list);
        if (list.length > 0 && !selectedInvId) {
          setSelectedInvId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load investigations for agents console:', err);
      }
    };
    fetchInvs();
  }, []);

  // Initialize browser speech synthesis voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices.length > 0) {
          setVoices(availableVoices);
          // Prefer natural English voices (Google US English, Samantha, Microsoft David, etc.)
          const preferredIdx = availableVoices.findIndex(
            (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('David'))
          );
          if (preferredIdx !== -1) {
            setSelectedVoiceIndex(preferredIdx);
          }
        }
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;

      return () => {
        window.speechSynthesis.cancel();
      };
    }
  }, []);

  // Initial trigger or auto-run on first load
  useEffect(() => {
    runSwarmAnalysis();
  }, [selectedInvId]);

  const runSwarmAnalysis = async () => {
    setLoading(true);
    stopSpeaking();
    try {
      const res = await multiAgentAPI.runAll(selectedInvId || undefined);
      setSuiteData(res);
    } catch (err) {
      console.error('Failed to execute multi-agent analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Voice Synthesizer Controls ---
  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setSpeakingAgentId(null);
      briefingQueueRef.current = [];
    }
  };

  const pauseSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && isSpeaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resumeSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const speakText = (text: string, agentId?: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || isMuted) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (voices[selectedVoiceIndex]) {
      utterance.voice = voices[selectedVoiceIndex];
    }
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setSpeakingAgentId(agentId || 'global');
    };

    utterance.onend = () => {
      // Process next in queue if in briefing mode
      if (briefingQueueRef.current.length > 0) {
        const next = briefingQueueRef.current.shift();
        if (next) {
          speakText(next.text, next.agentId);
          return;
        }
      }
      setIsSpeaking(false);
      setIsPaused(false);
      setSpeakingAgentId(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setSpeakingAgentId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const playFullBriefing = () => {
    if (!suiteData || !suiteData.agents) return;
    stopSpeaking();

    const queue = suiteData.agents.map((ag) => ({
      text: ag.speech_text,
      agentId: ag.agent_id
    }));

    if (queue.length > 0) {
      const first = queue.shift();
      briefingQueueRef.current = queue;
      if (first) {
        speakText(first.text, first.agentId);
      }
    }
  };

  const copyTraceId = () => {
    if (suiteData?.langfuse_trace_id) {
      navigator.clipboard.writeText(suiteData.langfuse_trace_id);
      setCopiedTrace(true);
      setTimeout(() => setCopiedTrace(false), 2000);
    }
  };

  // Helper to get agent icon
  const getAgentIcon = (id: string) => {
    switch (id) {
      case 'auth-sentinel':
        return <ShieldAlert className="w-5 h-5 text-blue-400" />;
      case 'db-exfiltration':
        return <Database className="w-5 h-5 text-purple-400" />;
      case 'privilege-os':
        return <Terminal className="w-5 h-5 text-emerald-400" />;
      case 'threat-synthesizer':
      default:
        return <Cpu className="w-5 h-5 text-indigo-400" />;
    }
  };

  // Filter traces based on active tab
  const filteredTraces: Array<{ agent: AgentResult; trace: AgentTraceStep }> = [];
  if (suiteData?.agents) {
    suiteData.agents.forEach((ag) => {
      if (selectedAgentTab === 'all' || selectedAgentTab === ag.agent_id) {
        ag.traces.forEach((tr) => {
          filteredTraces.push({ agent: ag, trace: tr });
        });
      }
    });
  }

  return (
    <div className="space-y-6 pb-12 font-sans animate-fadeIn">
      {/* Top Header & Execution Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#141526] via-[#1a1b35] to-[#121324] border border-[#2d2f52] shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 shadow-inner">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
                  Multi-Agent CyberForensic Suite
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600/30 text-blue-300 border border-blue-500/50">
                  LANGCHAIN SWARM
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Autonomous multi-agent log reasoning, MITRE correlation & voice briefing
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Case Selector */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <div className="flex items-center bg-[#1e203c] border border-[#31355c] rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <span className="text-slate-400 mr-2 font-medium">Case:</span>
            <select
              value={selectedInvId}
              onChange={(e) => setSelectedInvId(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              {investigations.map((inv) => (
                <option key={inv.id} value={inv.id} className="bg-[#1a1b35] text-white">
                  {inv.name}
                </option>
              ))}
              {investigations.length === 0 && (
                <option value="" className="bg-[#1a1b35] text-white">
                  Default Demo Evidence Case
                </option>
              )}
            </select>
          </div>

          <button
            onClick={runSwarmAnalysis}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all duration-200 shadow-md shadow-blue-600/25 border border-blue-400/30 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Reasoning Swarm...' : 'Execute Multi-Agent Swarm'}
          </button>
        </div>
      </div>

      {/* LangFuse & LangChain Observability Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Latency */}
        <div className="p-3.5 rounded-xl bg-[#17182e] border border-[#282a4d] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Total Latency</p>
            <p className="text-lg font-mono font-bold text-emerald-400">
              {suiteData ? `${suiteData.execution_time_ms} ms` : '--'}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Tokens Processed */}
        <div className="p-3.5 rounded-xl bg-[#17182e] border border-[#282a4d] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Tokens Processed</p>
            <p className="text-lg font-mono font-bold text-purple-400">
              {suiteData?.tokens_processed ? `${suiteData.tokens_processed.toLocaleString()} tok` : '4,850 tok'}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        {/* Swarm ML Confidence */}
        <div className="p-3.5 rounded-xl bg-[#17182e] border border-[#282a4d] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Swarm Consensus</p>
            <p className="text-lg font-mono font-bold text-blue-400">
              {suiteData?.ml_confidence_score ? `${suiteData.ml_confidence_score}%` : '98%'}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        {/* Logs Inspected */}
        <div className="p-3.5 rounded-xl bg-[#17182e] border border-[#282a4d] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Events Analyzed</p>
            <p className="text-lg font-mono font-bold text-amber-400">
              {suiteData?.total_events_analyzed ? `${suiteData.total_events_analyzed} logs` : '11 logs'}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Brain className="w-4 h-4" />
          </div>
        </div>

        {/* LangFuse Trace Tag */}
        <div className="col-span-2 md:col-span-1 p-3.5 rounded-xl bg-[#17182e] border border-[#282a4d] flex items-center justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <p className="text-[11px] font-semibold text-slate-400">LangFuse Trace</p>
            </div>
            <p className="text-xs font-mono font-bold text-cyan-300 truncate max-w-[120px]">
              {suiteData?.langfuse_trace_id || 'lf-trace-active'}
            </p>
          </div>
          <button
            onClick={copyTraceId}
            className="p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 transition-colors"
            title="Copy LangFuse Trace ID"
          >
            {copiedTrace ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Voice Audio Synthesizer (TTS) Bar */}
      <div className="p-4 rounded-2xl bg-[#16172d] border border-[#2b2e54] shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Speaking indicator & Equalizer animation */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Radio className={`w-5 h-5 ${isSpeaking && !isPaused ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                AI Voice Briefing Synthesizer
              </h3>
              {isSpeaking && !isPaused && (
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  NARRATING
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400">
              {speakingAgentId
                ? `Active Speaker: ${suiteData?.agents.find((a) => a.agent_id === speakingAgentId)?.name || 'Forensics Swarm'}`
                : 'Auditory briefing of agent findings & threat verdicts via Web Speech API'}
            </p>
          </div>

          {/* Animated Audio Equalizer Visualizer */}
          <div className="hidden sm:flex items-center gap-1 ml-2 h-6">
            {[40, 75, 55, 90, 60, 80, 45, 95, 65, 50].map((h, i) => (
              <motion.span
                key={i}
                className="w-1 rounded-full bg-gradient-to-t from-blue-500 to-cyan-400"
                animate={
                  isSpeaking && !isPaused
                    ? {
                        height: [4, h * 0.25, 4],
                        opacity: [0.6, 1, 0.6]
                      }
                    : { height: 4, opacity: 0.3 }
                }
                transition={{
                  repeat: Infinity,
                  duration: 0.4 + (i % 3) * 0.15,
                  ease: 'easeInOut'
                }}
              />
            ))}
          </div>
        </div>

        {/* Right: Audio Playback Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Voice selector */}
          {voices.length > 0 && (
            <select
              value={selectedVoiceIndex}
              onChange={(e) => setSelectedVoiceIndex(Number(e.target.value))}
              className="bg-[#1f213d] border border-[#343862] text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none max-w-[150px] truncate"
              title="Select Voice"
            >
              {voices.map((voice, idx) => (
                <option key={idx} value={idx}>
                  {voice.name.replace('Microsoft', '').replace('Google', '').trim()} ({voice.lang})
                </option>
              ))}
            </select>
          )}

          {/* Speed Selector */}
          <select
            value={speechRate}
            onChange={(e) => setSpeechRate(Number(e.target.value))}
            className="bg-[#1f213d] border border-[#343862] text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
            title="Speech Rate"
          >
            <option value="0.85">0.85x</option>
            <option value="1.0">1.0x</option>
            <option value="1.2">1.2x</option>
            <option value="1.5">1.5x</option>
          </select>

          {/* Play/Pause/Stop Buttons */}
          {!isSpeaking ? (
            <button
              onClick={playFullBriefing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Play Briefing
            </button>
          ) : isPaused ? (
            <button
              onClick={resumeSpeaking}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Resume
            </button>
          ) : (
            <button
              onClick={pauseSpeaking}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Pause className="w-3.5 h-3.5" />
              Pause
            </button>
          )}

          <button
            onClick={stopSpeaking}
            disabled={!isSpeaking && !isPaused}
            className="p-2 rounded-lg bg-[#252848] hover:bg-[#2e3259] text-slate-300 disabled:opacity-30 transition-colors"
            title="Stop Speech"
          >
            <Square className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              if (!isMuted) stopSpeaking();
              setIsMuted(!isMuted);
            }}
            className="p-2 rounded-lg bg-[#252848] hover:bg-[#2e3259] text-slate-300 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
          </button>
        </div>
      </div>

      {/* 4 Specialized AI Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {suiteData?.agents.map((agent) => {
          const isCurrentSpeaker = speakingAgentId === agent.agent_id && isSpeaking;

          return (
            <div
              key={agent.agent_id}
              className={`p-4 rounded-2xl bg-[#16172d] border transition-all duration-200 flex flex-col justify-between ${
                isCurrentSpeaker
                  ? 'border-cyan-500 shadow-lg shadow-cyan-500/20 bg-gradient-to-b from-[#1c1e3d] to-[#16172d]'
                  : 'border-[#292c4f] hover:border-[#383d6e]'
              }`}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#20223f] border border-[#333762]">
                      {getAgentIcon(agent.agent_id)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">{agent.name}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">{agent.role}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                      agent.threat_level === 'CRITICAL'
                        ? 'bg-red-950/60 text-red-300 border-red-800/60'
                        : agent.threat_level === 'HIGH'
                        ? 'bg-orange-950/60 text-orange-300 border-orange-800/60'
                        : 'bg-blue-950/60 text-blue-300 border-blue-800/60'
                    }`}
                  >
                    {agent.threat_level}
                  </span>
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#252848] text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400">Confidence</span>
                    <p className="font-mono font-bold text-blue-400">{agent.confidence_score}%</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Latency</span>
                    <p className="font-mono font-bold text-emerald-400">{agent.latency_ms} ms</p>
                  </div>
                </div>

                {/* Key Findings List */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Key Findings
                  </span>
                  <div className="space-y-1">
                    {agent.findings.slice(0, 2).map((finding, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-300 leading-tight">
                        <ArrowRight className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{finding}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action: Voice Play & Trace filter */}
              <div className="pt-4 border-t border-[#252848] mt-3 flex items-center justify-between gap-2">
                <button
                  onClick={() => speakText(agent.speech_text, agent.agent_id)}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    isCurrentSpeaker
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-[#212444] hover:bg-[#2a2e58] text-slate-200 border border-[#343868]'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  {isCurrentSpeaker ? 'Speaking...' : 'Listen to Report'}
                </button>

                <button
                  onClick={() => setSelectedAgentTab(agent.agent_id)}
                  className="py-1.5 px-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-[#191b34] hover:bg-[#202345] border border-[#2b2f56] transition-colors"
                  title="View Traces for this Agent"
                >
                  Traces ({agent.traces.length})
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* LangChain / LangFuse Step-by-Step Execution Tracing Window */}
      <div className="rounded-2xl bg-[#15162b] border border-[#282a4d] shadow-xl overflow-hidden">
        {/* Header & Agent Tab Filter */}
        <div className="p-4 border-b border-[#252748] bg-[#121324] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Live Execution Tracing Window
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-600/20 text-purple-300 border border-purple-500/30">
                  Thought → Action → Observation
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Detailed step-by-step telemetry, tool invocation, and latency breakdown
              </p>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-[#1a1c36] p-1 rounded-xl border border-[#2d3058]">
            {[
              { id: 'all', label: 'All Traces' },
              { id: 'auth-sentinel', label: 'Auth Sentinel' },
              { id: 'db-exfiltration', label: 'DB Exfiltration' },
              { id: 'privilege-os', label: 'Privilege & OS' },
              { id: 'threat-synthesizer', label: 'Synthesizer' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedAgentTab(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedAgentTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Trace Steps Timeline */}
        <div className="p-4 space-y-3 max-h-[550px] overflow-y-auto custom-scrollbar">
          {filteredTraces.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No execution traces recorded yet. Click "Execute Multi-Agent Swarm" to run.
            </div>
          ) : (
            filteredTraces.map(({ agent, trace }, index) => {
              const isExpanded = expandedTraceIndex === index;

              return (
                <div
                  key={index}
                  className="rounded-xl border border-[#26284a] bg-[#1a1b35] overflow-hidden transition-all duration-150"
                >
                  {/* Step Summary Row */}
                  <div
                    onClick={() => setExpandedTraceIndex(isExpanded ? null : index)}
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#202242] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center gap-2 shrink-0">
                        {getAgentIcon(agent.agent_id)}
                        <span className="text-xs font-bold text-white">{agent.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60 font-bold">
                          Step {trace.step_number}
                        </span>
                      </div>

                      <div className="hidden sm:flex items-center gap-2 truncate">
                        <span className="text-[11px] font-mono text-cyan-400 font-semibold truncate">
                          [{trace.action}]
                        </span>
                        <span className="text-xs text-slate-300 truncate">{trace.thought}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {trace.tool_used && (
                        <span className="hidden md:inline-flex text-[10px] font-mono px-2 py-0.5 rounded bg-[#27294d] text-slate-300 border border-[#3b3e6e]">
                          {trace.tool_used}
                        </span>
                      )}
                      <span className="text-xs font-mono text-emerald-400 font-bold">
                        {trace.latency_ms}ms
                      </span>
                      <span className="text-xs font-mono text-blue-400 font-bold">
                        {trace.confidence}%
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Step Details (Thought -> Action -> Observation -> Verdict) */}
                  {isExpanded && (
                    <div className="p-4 border-t border-[#26284a] bg-[#14152a] space-y-3 text-xs">
                      {/* Thought */}
                      <div className="p-3 rounded-lg bg-[#1a1b35] border border-[#2a2d52] space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                          <Brain className="w-3.5 h-3.5 text-purple-400" />
                          <span>Thought (Agent Internal Reasoning)</span>
                        </div>
                        <p className="text-slate-200 text-xs font-sans leading-relaxed">
                          {trace.thought}
                        </p>
                      </div>

                      {/* Action & Tool */}
                      <div className="p-3 rounded-lg bg-[#1a1b35] border border-[#2a2d52] space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Action / Tool Call</span>
                          </div>
                          {trace.tool_used && (
                            <span className="text-[10px] font-mono text-slate-400">
                              Tool: <span className="text-cyan-300 font-bold">{trace.tool_used}</span>
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-xs text-cyan-400 bg-[#0f101f] p-2 rounded border border-[#252848]">
                          {trace.action}()
                        </div>
                      </div>

                      {/* Observation */}
                      <div className="p-3 rounded-lg bg-[#1a1b35] border border-[#2a2d52] space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>Observation (Execution Result)</span>
                        </div>
                        <p className="text-slate-200 text-xs font-sans leading-relaxed">
                          {trace.observation}
                        </p>
                      </div>

                      {/* Verdict */}
                      {trace.verdict && (
                        <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 space-y-1">
                          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Step Verdict</span>
                          </div>
                          <p className="text-emerald-200 text-xs font-sans font-medium">
                            {trace.verdict}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Threat Synthesizer Summary & MITRE ATT&CK Matrix Panel */}
      {suiteData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Consolidated Verdict */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-[#15162b] border border-[#282a4d] shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  MITRE ATT&CK Killchain Reconstruction
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950/80 text-red-300 border border-red-800/60">
                CRITICAL SEVERITY INCIDENT
              </span>
            </div>

            {/* Killchain stages progress bar */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              {[
                { stage: 'Initial Access', code: 'T1110', label: 'SSH Brute Force', color: 'border-red-500/50 bg-red-500/10 text-red-300' },
                { stage: 'Privilege Escalation', code: 'T1068', label: 'Root Sudo Spawn', color: 'border-orange-500/50 bg-orange-500/10 text-orange-300' },
                { stage: 'Credential Access', code: 'T1530', label: 'Vault SQL Query', color: 'border-purple-500/50 bg-purple-500/10 text-purple-300' },
                { stage: 'Data Exfiltration', code: 'T1041', label: 'SCP Egress Socket', color: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300' }
              ].map((step, i) => (
                <div key={i} className={`p-2.5 rounded-xl border ${step.color} space-y-1`}>
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                    <span>{step.code}</span>
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <p className="text-[11px] font-bold">{step.stage}</p>
                  <p className="text-[10px] text-slate-300 opacity-90 truncate">{step.label}</p>
                </div>
              ))}
            </div>

            {/* Synthesizer Findings */}
            <div className="pt-2 space-y-1.5">
              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Consolidated Swarm Findings
              </h5>
              <div className="space-y-1">
                {suiteData.agents
                  .find((a) => a.agent_id === 'threat-synthesizer')
                  ?.findings.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* SOC Remediation Playbook */}
          <div className="p-5 rounded-2xl bg-[#15162b] border border-[#282a4d] shadow-lg flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Immediate Containment Playbook</h3>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[#1c1d38] border border-[#2f325c] flex items-start gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-red-600/30 text-red-300 text-[10px] font-mono font-bold">
                    ACT-1
                  </span>
                  <div>
                    <p className="text-white font-semibold">Revoke User 'rahul' Session</p>
                    <p className="text-[11px] text-slate-400">Terminate active SSH TTY & invalidate Kerberos ticket.</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#1c1d38] border border-[#2f325c] flex items-start gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-orange-600/30 text-orange-300 text-[10px] font-mono font-bold">
                    ACT-2
                  </span>
                  <div>
                    <p className="text-white font-semibold">Firewall Ingress Block</p>
                    <p className="text-[11px] text-slate-400">Drop all traffic from 192.168.1.50 at boundary edge.</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#1c1d38] border border-[#2f325c] flex items-start gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-300 text-[10px] font-mono font-bold">
                    ACT-3
                  </span>
                  <div>
                    <p className="text-white font-semibold">Rotate Database Vault Keys</p>
                    <p className="text-[11px] text-slate-400">Re-encrypt customer_vault tables with fresh HSM secrets.</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  "CONTAINMENT CHECKLIST:\n1. Revoke user rahul credentials and terminate SSH session.\n2. Ingress block 192.168.1.50 on perimeter firewall.\n3. Rotate database vault encryption keys."
                );
                alert("Containment Checklist copied to clipboard!");
              }}
              className="w-full py-2 px-3 rounded-xl bg-[#242749] hover:bg-[#2d315c] text-white text-xs font-semibold border border-[#3b4074] transition-colors flex items-center justify-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Containment Checklist
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentsConsolePage;
