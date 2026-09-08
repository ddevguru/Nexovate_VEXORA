import React from 'react';
import { SecurityEvent } from '../../types';
import { X, Clock, User, Globe, Server, Shield, FileText, Code2, AlertTriangle } from 'lucide-react';
import { Badge } from '../common/Badge';

interface EventDetailDrawerProps {
  event: SecurityEvent | null;
  onClose: () => void;
  onWhySuspicious: (event: SecurityEvent) => void;
}

export const EventDetailDrawer: React.FC<EventDetailDrawerProps> = ({
  event,
  onClose,
  onWhySuspicious
}) => {
  if (!event) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-slideLeft">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-slate-500">Event Detail</span>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2 mt-0.5">
            {event.action}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content Body */}
      <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
        {/* Quick Action Badges */}
        <div className="flex items-center justify-between">
          <Badge variant={event.severity.toLowerCase() as any}>{event.severity}</Badge>
          <button
            onClick={() => onWhySuspicious(event)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 transition-all"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Why is this suspicious?
          </button>
        </div>

        {/* Normalized Fields Grid */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Normalized Attributes</h4>
          <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200 text-xs">
            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-blue-600" /> Timestamp (UTC)</span>
              <span className="font-mono text-slate-800">{new Date(event.timestamp).toUTCString()}</span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2"><User className="w-3.5 h-3.5 text-blue-600" /> User</span>
              <span className="font-mono text-slate-900 font-semibold">{event.user || 'N/A'}</span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-blue-600" /> Source IP</span>
              <span className="font-mono text-slate-800">{event.source_ip || 'N/A'}</span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2"><Server className="w-3.5 h-3.5 text-blue-600" /> Hostname</span>
              <span className="font-mono text-slate-800">{event.hostname || 'N/A'}</span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-blue-600" /> Resource</span>
              <span className="font-mono text-slate-800 max-w-[200px] truncate">{event.resource || 'N/A'}</span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-blue-600" /> Status Outcome</span>
              <Badge variant={event.status === 'SUCCESS' ? 'success' : 'failure'}>{event.status}</Badge>
            </div>
          </div>
        </div>

        {/* Raw Log Viewer */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Code2 className="w-3.5 h-3.5 text-blue-600" /> Original Raw Log Record
          </h4>
          <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-200 whitespace-pre-wrap break-all leading-relaxed">
            {event.raw_log || 'No raw log content preserved.'}
          </pre>
        </div>
      </div>
    </div>
  );
};
