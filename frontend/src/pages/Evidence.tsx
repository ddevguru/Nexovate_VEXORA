import React, { useState, useEffect } from 'react';
import { evidenceAPI, timelineAPI } from '../services/api';
import { EvidenceFile } from '../types';
import { Badge } from '../components/common/Badge';
import { FileCheck2, Upload, Trash2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface EvidenceProps {
  investigationId: string | null;
}

export const Evidence: React.FC<EvidenceProps> = ({ investigationId }) => {
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (investigationId) {
      loadFiles();
    }
  }, [investigationId]);

  const loadFiles = async () => {
    if (!investigationId) return;
    setLoading(true);
    try {
      const data = await evidenceAPI.list(investigationId);
      setFiles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (fileObj: File) => {
    if (!investigationId) return;
    setUploading(true);
    try {
      await evidenceAPI.upload(investigationId, fileObj);
      await loadFiles();
      // Auto-trigger timeline analysis pipeline upon new evidence upload
      await timelineAPI.analyze(investigationId);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete evidence file? Original raw records will be purged.')) return;
    try {
      await evidenceAPI.delete(id);
      loadFiles();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-blue-600" /> Digital Evidence & Hash Integrity Portal
        </h2>
        <p className="text-xs text-slate-500">Upload CSV, JSON, LOG, TXT, or ZIP evidence archives. Integrity SHA-256 hashes are computed automatically.</p>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
          }
        }}
        className={`p-8 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center space-y-3 ${
          dragOver
            ? 'border-blue-600 bg-blue-50/80 shadow-xs'
            : 'border-slate-300 bg-white hover:border-slate-400'
        }`}
      >
        <div className="p-3 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
          <Upload className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {uploading ? 'Processing & Validating Evidence...' : 'Drag & drop log files here, or click to browse'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Supports .csv, .json, .txt, .log, .zip up to 50MB</p>
        </div>

        <input
          type="file"
          id="evidence-upload"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />
        <label
          htmlFor="evidence-upload"
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-all"
        >
          Browse Files
        </label>
      </div>

      {/* Files Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Uploaded Evidence Files ({files.length})</h3>

        {files.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">No evidence files uploaded to this investigation case yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-sans font-semibold uppercase text-[10px]">
                  <th className="py-3 px-4">Filename</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">SHA-256 Hash</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Events</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-slate-800">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 font-sans">{file.filename}</td>
                    <td className="py-3 px-4 font-sans">{file.file_type}</td>
                    <td className="py-3 px-4">{(file.file_size / 1024).toFixed(1)} KB</td>
                    <td className="py-3 px-4 font-mono text-[10px] text-blue-700 font-semibold">{file.sha256_hash.slice(0, 16)}...</td>
                    <td className="py-3 px-4">
                      <Badge variant={file.processing_status === 'COMPLETED' ? 'success' : 'failure'}>
                        {file.processing_status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">{file.event_count}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete File"
                      >
                        <Trash2 className="w-4 h-4" />
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
