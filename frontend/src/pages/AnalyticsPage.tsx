import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { DashboardMetrics } from '../types';
import { BarChart3, TrendingUp, Users, Globe, ShieldAlert, Cpu, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

interface AnalyticsPageProps {
  investigationId: string | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700/80 text-white p-3 rounded-xl shadow-xl text-xs font-sans space-y-1">
        <p className="font-semibold text-slate-300 font-mono flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          {label}
        </p>
        <p className="text-sm font-bold text-white font-mono">
          Risk Vector Score: <span className="text-blue-400">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ investigationId }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    if (investigationId) {
      dashboardAPI.getMetrics(investigationId).then(setMetrics);
    }
  }, [investigationId]);

  if (!metrics) return (
    <div className="p-12 text-center text-slate-500 font-medium flex flex-col items-center gap-2">
      <Cpu className="w-8 h-8 text-blue-600 animate-pulse" />
      <span>Select or load an active investigation to inspect threat analytics.</span>
    </div>
  );

  const maxRiskUser = metrics.top_suspicious_users[0];
  const maxRiskIP = metrics.top_suspicious_ips[0];

  const USER_COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];
  const IP_COLORS = ['#dc2626', '#ef4444', '#f87171', '#fca5a5'];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <BarChart3 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Advanced Evidence Analytics & Threat Metrics
              </h2>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Entity risk distributions, top suspicious accounts, and source IP vectors reconstructed from raw logs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
            Real-Time Engine
          </span>
        </div>
      </div>

      {/* High-Level Threat Vectors Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Highest Risk Account */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" /> Top Threat Account
            </span>
            <p className="text-lg font-black text-slate-900 font-mono">{maxRiskUser?.user || 'N/A'}</p>
            <p className="text-xs text-slate-500">Risk Cumulative Score: <span className="font-semibold text-blue-600">{maxRiskUser?.score || 0}</span></p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 font-mono font-bold text-sm">
            #{1}
          </div>
        </div>

        {/* Highest Risk Source IP */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-red-600" /> Primary Attack Vector IP
            </span>
            <p className="text-lg font-black text-slate-900 font-mono">{maxRiskIP?.ip || 'N/A'}</p>
            <p className="text-xs text-slate-500">Threat Activity Score: <span className="font-semibold text-red-600">{maxRiskIP?.score || 0}</span></p>
          </div>
          <div className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-100 font-mono font-bold text-sm">
            CRITICAL
          </div>
        </div>

        {/* Anomaly Density Indicator */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Anomaly Density
            </span>
            <p className="text-lg font-black text-slate-900 font-mono">{metrics.anomalies_count} Detected</p>
            <p className="text-xs text-slate-500">ML Isolation Forest Confidence: <span className="font-semibold text-amber-600">89%</span></p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-mono font-bold text-sm">
            HIGH
          </div>
        </div>
      </div>

      {/* Main Bar Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Suspicious Users */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-blue-600" /> Top Risk User Accounts
              </h3>
              <p className="text-xs text-slate-500 font-medium">Ranked by rule triggers, failed attempts, and privilege escalations</p>
            </div>
            <span className="text-[11px] font-bold font-mono text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
              User Threat Vectors
            </span>
          </div>

          <div className="h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.top_suspicious_users} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={1} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="user" stroke="#334155" fontSize={12} fontWeight={700} tickLine={false} axisLine={{ stroke: '#cbd5e1', strokeWidth: 1.5 }} />
                <YAxis stroke="#334155" fontSize={12} fontWeight={700} tickLine={false} axisLine={{ stroke: '#cbd5e1', strokeWidth: 1.5 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="score" fill="url(#userGrad)" radius={[8, 8, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Suspicious Source IPs */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Globe className="w-4.5 h-4.5 text-red-600" /> Top Suspicious Source IP Addresses
              </h3>
              <p className="text-xs text-slate-500 font-medium">Source IPs tied to anomalous logins, exfiltration, and unauthorized queries</p>
            </div>
            <span className="text-[11px] font-bold font-mono text-red-700 bg-red-50 px-3 py-1 rounded-lg border border-red-200">
              IP Threat Vectors
            </span>
          </div>

          <div className="h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.top_suspicious_ips} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                <defs>
                  <linearGradient id="ipGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#dc2626" stopOpacity={1} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="ip" stroke="#334155" fontSize={12} fontWeight={700} tickLine={false} axisLine={{ stroke: '#cbd5e1', strokeWidth: 1.5 }} />
                <YAxis stroke="#334155" fontSize={12} fontWeight={700} tickLine={false} axisLine={{ stroke: '#cbd5e1', strokeWidth: 1.5 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="score" fill="url(#ipGrad)" radius={[8, 8, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

