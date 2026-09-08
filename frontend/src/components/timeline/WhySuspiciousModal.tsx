import React from 'react';
import { SecurityEvent } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { AlertTriangle, ShieldAlert, Cpu, User, Globe, FileCode, CheckCircle2 } from 'lucide-react';

interface WhySuspiciousModalProps {
  event: SecurityEvent | null;
  onClose: () => void;
}

export const WhySuspiciousModal: React.FC<WhySuspiciousModalProps> = ({ event, onClose }) => {
  if (!event) return null;

  return (
    <Modal isOpen={!!event} onClose={onClose} title="Risk Analysis — Why is this suspicious?">
      <div className="space-y-6">
        {/* Risk Score & Severity Header Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-slate-900">{event.action}</h4>
              <p className="text-xs text-slate-500 font-mono">{new Date(event.timestamp).toUTCString()}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 block mb-1">Calculated Risk Score</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold font-mono text-red-600">{event.risk_score} / 100</span>
              <Badge variant={event.severity.toLowerCase() as any}>{event.severity}</Badge>
            </div>
          </div>
        </div>

        {/* Additive Rule Breakdown */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Triggered Detection Rules & Additive Scoring
          </h4>
          <div className="space-y-2.5">
            {event.significance_reasons && event.significance_reasons.length > 0 ? (
              event.significance_reasons.map((reason, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-white border border-slate-200 flex items-start gap-3 shadow-xs">
                  <div className="p-1 rounded bg-amber-50 text-amber-700 border border-amber-200 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-800 font-medium">{reason}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                Event flagged due to severity classification ({event.severity}) and elevated risk score baseline (+{event.risk_score}).
              </div>
            )}
          </div>
        </div>

        {/* Entity Context Grid */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Associated Entities</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <User className="w-3.5 h-3.5 text-blue-600" /> User Entity
              </div>
              <p className="text-xs font-mono font-semibold text-slate-900">{event.user || 'N/A'}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <Globe className="w-3.5 h-3.5 text-blue-600" /> Source IP
              </div>
              <p className="text-xs font-mono font-semibold text-slate-900">{event.source_ip || 'N/A'}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <FileCode className="w-3.5 h-3.5 text-blue-600" /> Target Resource
              </div>
              <p className="text-xs font-mono font-semibold text-slate-900 truncate">{event.resource || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Anomaly Model Score if present */}
        {event.is_anomaly && (
          <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-purple-900 font-medium">
              <Cpu className="w-4 h-4 text-purple-700" />
              <span>Isolation Forest ML Anomaly Engine Flagged</span>
            </div>
            <Badge variant="purple">ML OUTLIER</Badge>
          </div>
        )}
      </div>
    </Modal>
  );
};
