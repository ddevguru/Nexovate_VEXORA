import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';
import { Report } from '../types';
import { Badge } from '../components/common/Badge';
import { FileSpreadsheet, Download, Plus, FileCheck2, Clock } from 'lucide-react';

interface ReportsPageProps {
  investigationId: string | null;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ investigationId }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (investigationId) {
      loadReports();
    }
  }, [investigationId]);

  const loadReports = async () => {
    if (!investigationId) return;
    setLoading(true);
    try {
      const list = await reportsAPI.list(investigationId);
      setReports(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!investigationId) return;
    setGenerating(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await reportsAPI.generate(investigationId);
      setSuccessMsg('Forensic PDF report generated successfully!');
      await loadReports();
    } catch (err: any) {
      console.error('Failed to generate report:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to generate forensic PDF report. Ensure backend and PostgreSQL are connected.');
    } finally {
      setGenerating(false);
    }
  };

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (reportId: string) => {
    setDownloadingId(reportId);
    setErrorMsg(null);
    try {
      const blob = await reportsAPI.downloadBlob(reportId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cybertrace_report_${reportId.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Download failed:', err);
      setErrorMsg('Failed to download report PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Messages */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between font-medium">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="font-bold underline">Dismiss</button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center justify-between font-medium">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="font-bold underline">Dismiss</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" /> Automated Forensic PDF Reports
          </h2>
          <p className="text-xs text-slate-500 font-sans">Generate executive forensic audit documents containing evidence hashes, timeline, and recommendations.</p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {generating ? 'Generating PDF...' : 'Generate New PDF Report'}
        </button>
      </div>

      {/* Reports Directory Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Generated Report History ({reports.length})</h3>

        {reports.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">No forensic reports generated yet for this case.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-sans font-semibold uppercase text-[10px]">
                  <th className="py-3 px-4">Report ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Generated Timestamp</th>
                  <th className="py-3 px-4 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-slate-800">
                {reports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-blue-700 font-mono">{rep.id.slice(0, 8)}...</td>
                    <td className="py-3 px-4">
                      <Badge variant="cyan">{rep.report_type}</Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-sans">{new Date(rep.generated_at).toUTCString()}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDownload(rep.id)}
                        disabled={downloadingId === rep.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {downloadingId === rep.id ? 'Downloading...' : 'Download PDF'}
                      </button>
                    </td>
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
