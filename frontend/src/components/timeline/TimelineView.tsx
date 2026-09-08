import React, { useState, useEffect } from 'react';
import { SecurityEvent, TimelineResponse } from '../../types';
import { timelineAPI } from '../../services/api';
import { Badge } from '../common/Badge';
import {
  Clock,
  Filter,
  Search,
  Download,
  AlertTriangle,
  Flame,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  User,
  Globe,
  FileCode,
  HelpCircle,
  Activity
} from 'lucide-react';

interface TimelineViewProps {
  investigationId: string | null;
  onSelectEvent: (e: SecurityEvent) => void;
  onWhySuspicious: (e: SecurityEvent) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  investigationId,
  onSelectEvent,
  onWhySuspicious
}) => {
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [anomaliesOnly, setAnomaliesOnly] = useState(false);
  const [significantOnly, setSignificantOnly] = useState(false);

  useEffect(() => {
    if (investigationId) {
      fetchTimeline();
    }
  }, [investigationId, page, selectedSeverities, anomaliesOnly, significantOnly]);

  const fetchTimeline = async () => {
    if (!investigationId) return;
    setLoading(true);
    try {
      const res = await timelineAPI.getTimeline(investigationId, {
        page,
        page_size: 25,
        search: search || undefined,
        severity: selectedSeverities.length > 0 ? selectedSeverities : undefined,
        anomalies_only: anomaliesOnly || undefined,
        significant_only: significantOnly || undefined
      });
      setData(res);
    } catch (err) {
      console.error('Failed to fetch timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSeverity = (sev: string) => {
    setSelectedSeverities((prev) =>
      prev.includes(sev) ? prev.filter((s) => s !== sev) : [...prev, sev]
    );
    setPage(1);
  };

  const exportCSV = () => {
    if (!data || !data.events.length) return;
    const headers = ['Timestamp', 'Action', 'User', 'Source IP', 'Resource', 'Severity', 'Risk Score', 'Status'];
    const rows = data.events.map((e) => [
      e.timestamp,
      `"${e.action}"`,
      `"${e.user || ''}"`,
      `"${e.source_ip || ''}"`,
      `"${e.resource || ''}"`,
      e.severity,
      e.risk_score,
      e.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cybertrace_timeline_${investigationId?.slice(0, 8)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Severity Toggles */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-bold flex items-center gap-1.5 mr-1 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-blue-600" /> Severity Filter:
          </span>
          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => {
            const active = selectedSeverities.includes(sev);
            return (
              <button
                key={sev}
                onClick={() => toggleSeverity(sev)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all duration-150 ${
                  active
                    ? 'bg-blue-600 border border-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {sev}
              </button>
            );
          })}
        </div>

        {/* Feature Switches & Export */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer select-none bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/70 hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={significantOnly}
              onChange={(e) => {
                setSignificantOnly(e.target.checked);
                setPage(1);
              }}
              className="rounded bg-slate-100 border-slate-300 text-blue-600 focus:ring-0"
            />
            <Flame className="w-3.5 h-3.5 text-orange-600" /> Significant Only
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer select-none bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/70 hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={anomaliesOnly}
              onChange={(e) => {
                setAnomaliesOnly(e.target.checked);
                setPage(1);
              }}
              className="rounded bg-slate-100 border-slate-300 text-blue-600 focus:ring-0"
            />
            <Sparkles className="w-3.5 h-3.5 text-purple-600" /> ML Anomalies Only
          </label>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Main Chronological Timeline Stream */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 font-medium flex flex-col items-center gap-3">
          <Clock className="w-8 h-8 text-blue-600 animate-spin" />
          <span>Generating Digital Evidence Timeline...</span>
        </div>
      ) : !data || data.events.length === 0 ? (
        <div className="p-16 text-center text-slate-500 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          No security events match the current timeline filters.
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-200/80 ml-4 space-y-6">
          {data.events.map((event) => {
            const isHighRisk = event.severity === 'CRITICAL' || event.severity === 'HIGH';
            return (
              <div key={event.id} className="relative pl-8 group">
                {/* Timeline Connector Bullet Dot */}
                <div
                  className={`absolute -left-[9px] top-5 w-4 h-4 rounded-full border-2 transition-all ${
                    isHighRisk
                      ? 'bg-red-500 border-red-200 shadow-xs'
                      : event.severity === 'MEDIUM'
                      ? 'bg-amber-500 border-amber-200 shadow-xs'
                      : 'bg-emerald-500 border-emerald-200 shadow-xs'
                  }`}
                />

                {/* Event Card Container */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-400/80 transition-all duration-200 shadow-xs hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Action & Metadata */}
                  <div className="space-y-2.5 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-blue-700 font-bold flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                        <Clock className="w-3 h-3 text-blue-600" />
                        {new Date(event.timestamp).toUTCString()}
                      </span>
                      <Badge variant={event.severity.toLowerCase() as any}>{event.severity}</Badge>
                      {event.is_anomaly && <Badge variant="purple">ML ANOMALY</Badge>}
                    </div>

                    <h4
                      onClick={() => onSelectEvent(event)}
                      className="text-base font-extrabold text-slate-900 cursor-pointer hover:text-blue-600 transition-colors flex items-center gap-2"
                    >
                      {event.action}
                      <span className="text-xs text-slate-400 font-mono font-normal">[{event.event_type}]</span>
                    </h4>

                    {/* Entity Tags */}
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      {event.user && (
                        <span className="flex items-center gap-1.5 text-slate-700 bg-slate-100/80 px-2.5 py-1 rounded-md border border-slate-200/60 font-medium">
                          <User className="w-3.5 h-3.5 text-slate-500" /> {event.user}
                        </span>
                      )}
                      {event.source_ip && (
                        <span className="flex items-center gap-1.5 text-slate-700 bg-slate-100/80 px-2.5 py-1 rounded-md border border-slate-200/60 font-medium">
                          <Globe className="w-3.5 h-3.5 text-slate-500" /> {event.source_ip}
                        </span>
                      )}
                      {event.resource && (
                        <span className="flex items-center gap-1.5 text-slate-700 bg-slate-100/80 px-2.5 py-1 rounded-md border border-slate-200/60 font-medium truncate max-w-xs">
                          <FileCode className="w-3.5 h-3.5 text-slate-500" /> {event.resource}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Risk Score & "WHY SUSPICIOUS" Trigger */}
                  <div className="flex items-center gap-5 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-sans font-bold uppercase tracking-wider">RISK SCORE</span>
                      <span className={`text-xl font-black font-mono ${isHighRisk ? 'text-red-600' : 'text-slate-900'}`}>
                        {event.risk_score}
                      </span>
                    </div>

                    <button
                      onClick={() => onWhySuspicious(event)}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-semibold shadow-xs transition-all duration-150 whitespace-nowrap flex items-center gap-1.5"
                    >
                      <HelpCircle className="w-3.5 h-3.5" /> Why Suspicious?
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <span className="text-xs text-slate-500 font-medium">
            Showing Page {data.page} of {data.total_pages} ({data.total_events} total events)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
              disabled={page === data.total_pages}
              className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

