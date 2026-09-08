import React from 'react';
import { Settings, Cpu, Key, Database, Shield } from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" /> Platform Settings & Configuration
        </h2>
        <p className="text-xs text-slate-500 font-sans">Environment status, AI provider abstraction layer, database dialect, and file upload limits.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* AI & ML Engines */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-600" /> AI & Anomaly Detector Engines
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-700 font-medium">AI Provider</span>
              <Badge variant="cyan">Gemini API / Fallback</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-700 font-medium">ML Anomaly Model</span>
              <Badge variant="purple">scikit-learn IsolationForest</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-700 font-medium">Deterministic Rule Engine</span>
              <Badge variant="success">ACTIVE (8 Rules)</Badge>
            </div>
          </div>
        </div>

        {/* Database & Storage */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-600" /> Database & Storage Settings
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-700 font-medium">SQL Database Dialect</span>
              <span className="font-mono text-slate-900 font-semibold">SQLite / PostgreSQL</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-700 font-medium">Max File Upload Limit</span>
              <span className="font-mono text-slate-900 font-semibold">50 MB</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-700 font-medium">Supported Evidence Archives</span>
              <span className="font-mono text-slate-900 font-semibold">CSV, JSON, LOG, TXT, ZIP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
