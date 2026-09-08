import React, { useState, useEffect } from 'react';
import { investigationsAPI } from '../services/api';
import { Investigation } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { FolderKanban, Plus, Play, Trash2, ShieldAlert } from 'lucide-react';

interface InvestigationsProps {
  onSelectInvestigation: (inv: Investigation) => void;
}

export const Investigations: React.FC<InvestigationsProps> = ({ onSelectInvestigation }) => {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('MEDIUM');

  useEffect(() => {
    loadList();
  }, []);

  const loadList = async () => {
    setLoading(true);
    try {
      const data = await investigationsAPI.list();
      setInvestigations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await investigationsAPI.create(name, description, severity);
      setIsModalOpen(false);
      setName('');
      setDescription('');
      loadList();
      onSelectInvestigation(created);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this investigation?')) return;
    try {
      await investigationsAPI.delete(id);
      loadList();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-blue-600" /> Investigations Directory
          </h2>
          <p className="text-xs text-slate-500">Manage digital evidence investigation cases and logs.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" /> New Investigation Case
        </button>
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {investigations.map((inv) => (
          <div
            key={inv.id}
            onClick={() => onSelectInvestigation(inv)}
            className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 cursor-pointer transition-all shadow-xs space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant={inv.severity.toLowerCase() as any}>{inv.severity}</Badge>
                <span className="text-[11px] font-mono text-slate-500">{new Date(inv.created_at).toLocaleDateString()}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{inv.name}</h3>
              <p className="text-xs text-slate-600 line-clamp-2">{inv.description || 'No description provided.'}</p>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-500">
              <div>
                <span>{inv.event_count || 0} events</span> • <span>{inv.evidence_count || 0} files</span>
              </div>
              <button
                onClick={(e) => handleDelete(inv.id, e)}
                className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                title="Delete Case"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Investigation Case">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Case Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Server Compromise Investigation"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief summary of incident context..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Initial Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
          >
            Create Investigation Case
          </button>
        </form>
      </Modal>
    </div>
  );
};
