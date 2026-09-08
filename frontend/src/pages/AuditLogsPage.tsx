import React, { useState, useEffect } from 'react';
import { auditAPI } from '../services/api';
import { History } from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<Array<{ id: string; user_id?: string; action: string; resource_type?: string; resource_id?: string; timestamp: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await auditAPI.list();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs from PostgreSQL:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600" /> PostgreSQL Audit Trail & Security Logs
        </h2>
        <p className="text-xs text-slate-500 font-sans">Authoritative audit records retrieved directly from PostgreSQL database.</p>
      </div>

      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Audit Events Log ({logs.length})</h3>

        {loading ? (
          <p className="text-xs text-slate-500 text-center py-6 font-medium">Querying PostgreSQL audit logs...</p>
        ) : logs.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6 font-medium">No audit records found in PostgreSQL database.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-sans font-semibold uppercase text-[10px]">
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Resource Type</th>
                  <th className="py-3 px-4">Resource Target ID</th>
                  <th className="py-3 px-4 text-right">Timestamp (UTC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold">
                      <Badge variant="cyan">{log.action}</Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-sans">{log.resource_type || 'System'}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{log.resource_id || '-'}</td>
                    <td className="py-3 px-4 text-right text-slate-500 font-sans">{new Date(log.timestamp).toUTCString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
