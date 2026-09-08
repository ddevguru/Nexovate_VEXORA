import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { DashboardMetrics, SecurityEvent } from '../types';
import { Badge } from '../components/common/Badge';
import { InteractiveTiltCard } from '../components/common/InteractiveTiltCard';
import {
  ShieldAlert,
  Flame,
  Sparkles,
  Users,
  Globe,
  FileCode,
  Activity,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  HelpCircle,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface DashboardProps {
  investigationId: string | null;
  onSelectEvent: (e: SecurityEvent) => void;
  onWhySuspicious: (e: SecurityEvent) => void;
}

const CustomAreaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 text-slate-800 p-3 rounded-xl shadow-xl text-xs font-sans space-y-1">
        <p className="font-semibold text-slate-500 font-mono flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          Hour: {label}:00
        </p>
        <p className="text-sm font-bold text-slate-900 font-mono">
          Event Volume: <span className="text-blue-600">{payload[0].value} logs</span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 text-slate-800 p-2.5 rounded-xl shadow-xl text-xs font-sans">
        <span className="font-bold font-mono" style={{ color: payload[0].payload.fill }}>
          {payload[0].name}: {payload[0].value} events
        </span>
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC<DashboardProps> = ({
  investigationId,
  onSelectEvent,
  onWhySuspicious
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (investigationId) {
      loadMetrics();
    }
  }, [investigationId]);

  const loadMetrics = async () => {
    if (!investigationId) return;
    setLoading(true);
    try {
      const data = await dashboardAPI.getMetrics(investigationId);
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 font-medium flex flex-col items-center gap-3">
        <Activity className="w-8 h-8 text-blue-600 animate-spin" />
        <span>Loading SOC Investigation Command Center...</span>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-16 text-center text-slate-500 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        Select or load an active investigation to view dashboard metrics.
      </div>
    );
  }

  const SEVERITY_COLORS: Record<string, string> = {
    CRITICAL: '#dc2626',
    HIGH: '#ea580c',
    MEDIUM: '#d97706',
    LOW: '#2563eb',
    INFO: '#059669'
  };

  const severityPieData = Object.entries(metrics.severity_distribution)
    .filter(([_, count]) => count > 0)
    .map(([name, value]) => ({
      name,
      value,
      fill: SEVERITY_COLORS[name] || '#64748b'
    }));

  return (
    <div className="space-y-6">
      {/* Top SOC Command Header Banner - Crisp Light Mode */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-white via-blue-50/50 to-indigo-50/40 border border-blue-200/70 text-slate-900 shadow-sm relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100/80 text-blue-700 text-[11px] font-bold font-mono border border-blue-300/60 tracking-wider uppercase">
              SOC Command Overview
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Pipeline Active
            </span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-slate-900">{metrics.investigation_name}</h2>
          <p className="text-xs text-slate-600 font-sans">
            Automated event normalization, Isolation Forest ML anomaly detection, and graph correlation active.
          </p>
        </div>

        {/* Risk & Confidence Scorecards */}
        <div className="relative z-10 flex items-center gap-4 bg-white/95 p-4 rounded-xl border border-slate-200/90 shadow-sm backdrop-blur-md">
          <div className="text-center px-3">
            <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase block">INCIDENT RISK</span>
            <span className="text-3xl font-black font-mono text-red-600 drop-shadow-sm">
              {metrics.overall_risk_score}
              <span className="text-xs text-slate-400 font-normal">/100</span>
            </span>
          </div>
          <div className="h-10 w-px bg-slate-200" />
          <div className="text-center px-3">
            <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase block">ML CONFIDENCE</span>
            <span className="text-3xl font-black font-mono text-blue-600 drop-shadow-sm">
              {metrics.confidence_score}%
            </span>
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid with 3D Mouse Tilt and Glare */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Total Events', val: metrics.total_events, icon: Activity, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', glow: 'rgba(59, 130, 246, 0.15)' },
          { label: 'Significant', val: metrics.significant_events_count, icon: Flame, bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', glow: 'rgba(249, 115, 22, 0.15)' },
          { label: 'ML Anomalies', val: metrics.anomalies_count, icon: Sparkles, bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', glow: 'rgba(168, 85, 247, 0.15)' },
          { label: 'Critical', val: metrics.critical_findings_count, icon: AlertTriangle, bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', glow: 'rgba(239, 68, 68, 0.15)' },
          { label: 'Users', val: metrics.unique_users_count, icon: Users, bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-100', glow: 'rgba(14, 165, 233, 0.15)' },
          { label: 'IP Addresses', val: metrics.unique_ips_count, icon: Globe, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', glow: 'rgba(16, 185, 129, 0.15)' },
          { label: 'Resources', val: metrics.unique_resources_count, icon: FileCode, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', glow: 'rgba(245, 158, 11, 0.15)' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <InteractiveTiltCard
              key={idx}
              tiltAmount={10}
              glowColor={kpi.glow}
              className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">{kpi.label}</span>
                <span className={`p-1.5 rounded-lg ${kpi.bg} ${kpi.text} border ${kpi.border}`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-2xl font-black font-mono text-slate-900 tracking-tight">{kpi.val}</p>
            </InteractiveTiltCard>
          );
        })}
      </div>

      {/* Main Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Events & Risk Over Time */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" /> Event Frequency & Risk Trend
              </h3>
              <p className="text-xs text-slate-500">Hourly timeline breakdown of log ingestion</p>
            </div>
            <span className="text-[11px] font-semibold font-mono text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
              Hourly Log Stream
            </span>
          </div>

          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.events_over_time} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorEv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="hour" stroke="#334155" fontSize={12} fontWeight={700} tickLine={false} axisLine={{ stroke: '#cbd5e1', strokeWidth: 1.5 }} />
                <YAxis stroke="#334155" fontSize={12} fontWeight={700} tickLine={false} axisLine={{ stroke: '#cbd5e1', strokeWidth: 1.5 }} />
                <Tooltip content={<CustomAreaTooltip />} />
                <Area type="monotone" dataKey="events" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorEv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution Pie Chart */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600" /> Severity Breakdown
              </h3>
              <p className="text-xs text-slate-500">Distribution across risk tiers</p>
            </div>
          </div>

          <div className="h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {severityPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black font-mono text-slate-900">{metrics.total_events}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Events</span>
            </div>
          </div>

          {/* Legend Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-slate-100">
            {severityPieData.map((item) => (
              <span key={item.name} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 px-2 py-1 rounded-md border border-slate-200/70">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                {item.name}: {item.value}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Panels: Recent Significant Events & Attack Chain Summary */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Significant Events */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-600" /> Recent Significant Security Triggers
              </h3>
              <p className="text-xs text-slate-500">High-risk events requiring SOC analyst review</p>
            </div>
          </div>

          <div className="space-y-3">
            {metrics.recent_significant_events.map((ev) => (
              <div
                key={ev.id}
                onClick={() => onSelectEvent(ev)}
                className="p-3.5 rounded-xl bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200/80 hover:border-blue-400 cursor-pointer transition-all flex items-center justify-between gap-4 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-500">{new Date(ev.timestamp).toUTCString()}</span>
                    <Badge variant={ev.severity.toLowerCase() as any}>{ev.severity}</Badge>
                  </div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                    {ev.action}
                    {ev.user && <span className="font-mono font-normal text-slate-500">({ev.user})</span>}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onWhySuspicious(ev);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1 whitespace-nowrap"
                >
                  <HelpCircle className="w-3.5 h-3.5" /> Why Suspicious?
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Attack Chain Progression */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" /> Reconstructed Attack Chain Stages
              </h3>
              <p className="text-xs text-slate-500">MITRE ATT&CK killchain stage correlation</p>
            </div>
          </div>

          <div className="space-y-3">
            {metrics.attack_chain_summary.map((stg, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-mono text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    {stg.title}
                  </span>
                  <Badge variant="cyan">{stg.confidence}% CONFIDENCE</Badge>
                </div>
                <p className="text-xs text-slate-600 pl-6">{stg.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

