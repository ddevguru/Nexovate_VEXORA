import React, { useState, useEffect, useMemo } from 'react';
import { ReactFlow, Controls, Background, Node, Edge, Handle, Position, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { incidentsAPI } from '../../services/api';
import { AttackGraphData, AttackNode } from '../../types';
import { GitFork, ShieldAlert, User, Network, Server, Database, Activity, RefreshCw, Layers } from 'lucide-react';

interface AttackGraphViewProps {
  investigationId: string | null;
}

// Custom Node Renderer with Clean High-Contrast Badges
const CustomNode: React.FC<{ data: any }> = ({ data }) => {
  const { label, nodeType, isCritical } = data;
  const typeUpper = (nodeType || '').toUpperCase();

  let IconComponent = Activity;
  let bgGradient = 'bg-white border-slate-300 text-slate-900 shadow-xs';
  let badgeColor = 'bg-slate-100 text-slate-700 border-slate-300';

  if (typeUpper.includes('USER')) {
    IconComponent = User;
    bgGradient = 'bg-white border-sky-400 text-slate-900 shadow-xs';
    badgeColor = 'bg-sky-50 text-sky-700 border-sky-200';
  } else if (typeUpper.includes('IP') || typeUpper.includes('NETWORK')) {
    IconComponent = Network;
    bgGradient = 'bg-white border-indigo-400 text-slate-900 shadow-xs';
    badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  } else if (typeUpper.includes('HOST') || typeUpper.includes('SERVER')) {
    IconComponent = Server;
    bgGradient = 'bg-white border-purple-400 text-slate-900 shadow-xs';
    badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
  } else if (typeUpper.includes('FILE') || typeUpper.includes('DATABASE') || typeUpper.includes('RESOURCE')) {
    IconComponent = Database;
    bgGradient = 'bg-white border-emerald-400 text-slate-900 shadow-xs';
    badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  if (isCritical) {
    bgGradient = 'bg-red-50 border-red-500 text-red-950 shadow-sm font-semibold';
    badgeColor = 'bg-red-100 text-red-800 border-red-300';
  }

  return (
    <div className={`px-3 py-2 rounded-xl border min-w-[180px] max-w-[240px] transition-all duration-200 hover:shadow-md ${bgGradient}`}>
      <Handle type="target" position={Position.Top} className="!bg-blue-600 !w-2 !h-2" />
      
      <div className="flex items-center gap-2 mb-1">
        <IconComponent className="w-4 h-4 shrink-0 text-blue-600" />
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold ${badgeColor}`}>
          {nodeType}
        </span>
      </div>
      
      <div className="text-xs font-mono font-semibold truncate leading-tight text-slate-900" title={label}>
        {label}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-blue-600 !w-2 !h-2" />
    </div>
  );
};

export const AttackGraphView: React.FC<AttackGraphViewProps> = ({ investigationId }) => {
  const [graphData, setGraphData] = useState<AttackGraphData | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [highlightPath, setHighlightPath] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);

  const nodeTypes = useMemo(() => ({ customNode: CustomNode }), []);

  useEffect(() => {
    if (investigationId) {
      loadGraph();
    }
  }, [investigationId]);

  const loadGraph = async () => {
    if (!investigationId) return;
    setLoading(true);
    try {
      const data: AttackGraphData = await incidentsAPI.getAttackGraph(investigationId);
      setGraphData(data);
      buildGraphLayout(data, highlightPath, filterType);
    } catch (err) {
      console.error('Failed to load attack graph:', err);
    } finally {
      setLoading(false);
    }
  };

  const buildGraphLayout = (data: AttackGraphData, showAttackPath: boolean, filter: string) => {
    if (!data) return;

    let filteredRawNodes = data.nodes;
    if (filter !== 'ALL') {
      filteredRawNodes = data.nodes.filter(n => n.node_type.toUpperCase().includes(filter));
    }

    const validNodeIds = new Set(filteredRawNodes.map(n => n.id));

    // Hierarchical Layer Categorization
    const layers: { [key: number]: AttackNode[] } = { 0: [], 1: [], 2: [], 3: [], 4: [] };

    filteredRawNodes.forEach(node => {
      const t = (node.node_type || '').toUpperCase();
      if (t.includes('USER')) layers[0].push(node);
      else if (t.includes('IP') || t.includes('NETWORK')) layers[1].push(node);
      else if (t.includes('HOST') || t.includes('SERVER')) layers[2].push(node);
      else if (t.includes('EVENT') || t.includes('ACTION')) layers[3].push(node);
      else layers[4].push(node);
    });

    const flowNodes: Node[] = [];
    const layerY = [50, 170, 290, 410, 530];
    const colWidth = 220;

    Object.entries(layers).forEach(([layerStr, layerNodes]) => {
      const layerIdx = Number(layerStr);
      const count = layerNodes.length;
      if (count === 0) return;

      const totalWidth = count * colWidth;
      const startX = Math.max(60, 600 - totalWidth / 2);

      layerNodes.forEach((n, idx) => {
        const isCritical = data.attack_path_node_ids.includes(n.id);
        flowNodes.push({
          id: n.id,
          type: 'customNode',
          position: { x: startX + idx * colWidth, y: layerY[layerIdx] },
          data: {
            id: n.id,
            label: n.label,
            nodeType: n.node_type,
            isCritical: showAttackPath && isCritical,
            details: n.details
          }
        });
      });
    });

    // Edges
    const flowEdges: Edge[] = data.edges
      .filter(e => validNodeIds.has(e.source_node_id) && validNodeIds.has(e.target_node_id))
      .map(e => {
        const isCriticalEdge = showAttackPath &&
          data.attack_path_node_ids.includes(e.source_node_id) &&
          data.attack_path_node_ids.includes(e.target_node_id);

        return {
          id: e.id,
          source: e.source_node_id,
          target: e.target_node_id,
          type: 'smoothstep',
          label: e.relationship,
          animated: isCriticalEdge,
          style: {
            stroke: isCriticalEdge ? '#dc2626' : '#2563eb',
            strokeWidth: isCriticalEdge ? 3 : 1.5,
            opacity: showAttackPath && !isCriticalEdge ? 0.35 : 0.85
          },
          labelStyle: {
            fill: isCriticalEdge ? '#dc2626' : '#1d4ed8',
            fontSize: 10,
            fontFamily: 'sans-serif',
            fontWeight: 600
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isCriticalEdge ? '#dc2626' : '#2563eb',
            width: 16,
            height: 16
          }
        };
      });

    setNodes(flowNodes);
    setEdges(flowEdges);
  };

  const handleToggleAttackPath = () => {
    const nextState = !highlightPath;
    setHighlightPath(nextState);
    if (graphData) {
      buildGraphLayout(graphData, nextState, filterType);
    }
  };

  const handleFilterChange = (newFilter: string) => {
    setFilterType(newFilter);
    if (graphData) {
      buildGraphLayout(graphData, highlightPath, newFilter);
    }
  };

  return (
    <div className="space-y-4">
      {/* Control Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Structured Attack Chain Graph <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-semibold">PostgreSQL Persisted</span>
            </h3>
            <p className="text-xs text-slate-500">Hierarchical visual reconstruction of users, IPs, actions, and compromised resources.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Node Type Filters */}
          <div className="flex items-center bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs font-sans font-semibold">
            {['ALL', 'USER', 'IP', 'EVENT', 'RESOURCE'].map(f => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterType === f ? 'bg-blue-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Toggle Attack Path */}
          <button
            onClick={handleToggleAttackPath}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              highlightPath
                ? 'bg-red-50 text-red-700 border-red-200 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            {highlightPath ? 'Highlighting Attack Chain' : 'Show Attack Path'}
          </button>

          {/* Refresh */}
          <button
            onClick={loadGraph}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs shadow-xs"
            title="Reload Layout"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend Banner */}
      <div className="px-4 py-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs text-slate-600 font-sans font-medium shadow-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> User Entity</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Network IP</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Server Host</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> File / Database</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span> Critical Attack Node</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <Layers className="w-3.5 h-3.5 text-blue-600" /> Top-to-Bottom Attack Progression
        </div>
      </div>

      {/* React Flow Canvas Container */}
      <div className="h-[620px] w-full rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden relative shadow-xs">
        {loading ? (
          <div className="flex h-full items-center justify-center text-slate-500 text-xs font-sans font-semibold gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" /> Rendering Attack Canvas...
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-right"
          >
            <Background color="#cbd5e1" gap={20} size={1} />
            <Controls className="!bg-white !border-slate-200 !text-slate-800 !shadow-xs" />
          </ReactFlow>
        )}
      </div>
    </div>
  );
};

