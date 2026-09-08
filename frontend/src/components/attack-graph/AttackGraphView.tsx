import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  Node,
  Edge,
  Handle,
  Position,
  MarkerType,
  useNodesState,
  useEdgesState
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitFork,
  ShieldAlert,
  User,
  Network,
  Server,
  Database,
  Activity,
  RefreshCw,
  Layers,
  Search,
  Zap,
  Info,
  X,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Lock,
  Flame,
  LayoutGrid
} from 'lucide-react';
import { incidentsAPI } from '../../services/api';
import { AttackGraphData, AttackNode } from '../../types';

interface AttackGraphViewProps {
  investigationId: string | null;
}

// Fallback high-fidelity demo attack graph if database has 0 nodes
const FALLBACK_GRAPH_DATA: AttackGraphData = {
  nodes: [
    {
      id: 'node-user-rahul',
      node_type: 'USER',
      label: 'User: rahul',
      node_metadata: { role: 'Unprivileged Developer', host: 'Workstation-09', compromised: true, severity: 'CRITICAL' }
    },
    {
      id: 'node-ip-attacker',
      node_type: 'IP',
      label: 'IP: 192.168.1.50',
      node_metadata: { geo: 'External / VPN', reputation: 'MALICIOUS', attempts: 4, severity: 'HIGH' }
    },
    {
      id: 'node-server-app',
      node_type: 'HOST',
      label: 'Host: SERVER-01',
      node_metadata: { os: 'Ubuntu 22.04 LTS', service: 'SSH / Docker Engine', privilege: 'Root Elevated', severity: 'CRITICAL' }
    },
    {
      id: 'node-db-vault',
      node_type: 'RESOURCE',
      label: 'DB: customer_vault',
      node_metadata: { type: 'PostgreSQL Database', sensitive_records: '12,450 Cards', query: 'SELECT *', severity: 'CRITICAL' }
    },
    {
      id: 'node-exfil-dest',
      node_type: 'IP',
      label: 'Exfil: 198.51.100.24',
      node_metadata: { protocol: 'SCP / Port 22', volume: '1.4 GB Egress', destination: 'exfil.external-server.net', severity: 'CRITICAL' }
    }
  ],
  edges: [
    {
      id: 'edge-1',
      source_node_id: 'node-ip-attacker',
      target_node_id: 'node-user-rahul',
      relationship: 'BRUTE_FORCE_AUTH',
      confidence: 99
    },
    {
      id: 'edge-2',
      source_node_id: 'node-user-rahul',
      target_node_id: 'node-server-app',
      relationship: 'SUDO_ESCALATE_ROOT',
      confidence: 98
    },
    {
      id: 'edge-3',
      source_node_id: 'node-server-app',
      target_node_id: 'node-db-vault',
      relationship: 'SQL_TABLE_DUMP',
      confidence: 97
    },
    {
      id: 'edge-4',
      source_node_id: 'node-db-vault',
      target_node_id: 'node-exfil-dest',
      relationship: 'EXFILTRATES_EGRESS',
      confidence: 99
    }
  ],
  attack_path_node_ids: [
    'node-ip-attacker',
    'node-user-rahul',
    'node-server-app',
    'node-db-vault',
    'node-exfil-dest'
  ]
};

// Premium Stylized Node Component for CyberTrace Visual Graph
const CyberNodeRenderer: React.FC<{ data: any }> = ({ data }) => {
  const { label, nodeType, isCritical, isSelected, isMatched, details, onSelect } = data;
  const typeUpper = (nodeType || '').toUpperCase();

  let IconComponent = Activity;
  let accentColor = 'border-l-blue-500';
  let iconBg = 'bg-blue-50 text-blue-600 border-blue-200';
  let typeBadge = 'bg-blue-50 text-blue-700 border-blue-200';

  if (typeUpper.includes('USER')) {
    IconComponent = User;
    accentColor = 'border-l-sky-500';
    iconBg = 'bg-sky-50 text-sky-600 border-sky-200';
    typeBadge = 'bg-sky-50 text-sky-700 border-sky-200';
  } else if (typeUpper.includes('IP') || typeUpper.includes('NETWORK')) {
    IconComponent = Network;
    accentColor = 'border-l-indigo-500';
    iconBg = 'bg-indigo-50 text-indigo-600 border-indigo-200';
    typeBadge = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  } else if (typeUpper.includes('HOST') || typeUpper.includes('SERVER')) {
    IconComponent = Server;
    accentColor = 'border-l-purple-500';
    iconBg = 'bg-purple-50 text-purple-600 border-purple-200';
    typeBadge = 'bg-purple-50 text-purple-700 border-purple-200';
  } else if (typeUpper.includes('FILE') || typeUpper.includes('DATABASE') || typeUpper.includes('RESOURCE')) {
    IconComponent = Database;
    accentColor = 'border-l-emerald-500';
    iconBg = 'bg-emerald-50 text-emerald-600 border-emerald-200';
    typeBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  if (isCritical) {
    accentColor = 'border-l-red-500';
    iconBg = 'bg-red-50 text-red-600 border-red-200';
    typeBadge = 'bg-red-50 text-red-700 border-red-200';
  }

  return (
    <div
      onClick={() => onSelect && onSelect(data)}
      className={`relative group px-4 py-3 rounded-2xl bg-white border border-slate-200 border-l-[5px] ${accentColor} min-w-[210px] max-w-[270px] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer ${
        isCritical ? 'ring-2 ring-red-500/20 shadow-red-500/10' : ''
      } ${isSelected ? 'ring-2 ring-blue-600 shadow-blue-500/20' : ''} ${
        isMatched ? 'ring-2 ring-amber-500 scale-105' : ''
      }`}
    >
      {/* Connector Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-blue-600 !w-2.5 !h-2.5 !border-2 !border-white !shadow-xs"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!bg-blue-600 !w-2.5 !h-2.5 !border-2 !border-white !shadow-xs"
      />

      {/* Top Header with Icon & Badges */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-xl border ${iconBg} shadow-2xs`}>
            <IconComponent className="w-4 h-4" />
          </div>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase ${typeBadge}`}>
            {nodeType}
          </span>
        </div>

        {isCritical && (
          <span className="flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            ATTACK PATH
          </span>
        )}
      </div>

      {/* Node Main Title */}
      <div className="text-xs font-mono font-bold text-slate-900 truncate leading-snug" title={label}>
        {label}
      </div>

      {/* Secondary Meta Tag snippet */}
      {details && Object.keys(details).length > 0 && (
        <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
          <span className="truncate max-w-[140px]">
            {Object.values(details)[0] as string}
          </span>
          <span className="text-blue-600 group-hover:underline font-semibold flex items-center gap-0.5">
            Details <ArrowRight className="w-2.5 h-2.5" />
          </span>
        </div>
      )}

      {/* Outgoing Connector Handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-blue-600 !w-2.5 !h-2.5 !border-2 !border-white !shadow-xs"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!bg-blue-600 !w-2.5 !h-2.5 !border-2 !border-white !shadow-xs"
      />
    </div>
  );
};

export const AttackGraphView: React.FC<AttackGraphViewProps> = ({ investigationId }) => {
  const [graphData, setGraphData] = useState<AttackGraphData | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [highlightPath, setHighlightPath] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [layoutMode, setLayoutMode] = useState<'HIERARCHICAL' | 'FLOW'>('HIERARCHICAL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNodeData, setSelectedNodeData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const nodeTypes = useMemo(() => ({ cyberNode: CyberNodeRenderer }), []);

  useEffect(() => {
    loadGraph();
  }, [investigationId]);

  const loadGraph = async () => {
    if (!graphData) setLoading(true);
    try {
      let data: AttackGraphData;
      if (investigationId) {
        data = await incidentsAPI.getAttackGraph(investigationId);
        if (!data || !data.nodes || data.nodes.length === 0) {
          data = FALLBACK_GRAPH_DATA;
        }
      } else {
        data = FALLBACK_GRAPH_DATA;
      }
      setGraphData(data);
      applyLayout(data, highlightPath, filterType, layoutMode, searchQuery);
    } catch (err) {
      console.warn('Failed to load incident attack graph from backend, falling back to rich demo graph:', err);
      setGraphData(FALLBACK_GRAPH_DATA);
      applyLayout(FALLBACK_GRAPH_DATA, highlightPath, filterType, layoutMode, searchQuery);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNode = useCallback((data: any) => {
    setSelectedNodeData(data);
  }, []);

  const applyLayout = (
    data: AttackGraphData,
    showAttackPath: boolean,
    filter: string,
    mode: 'HIERARCHICAL' | 'FLOW',
    search: string
  ) => {
    if (!data) return;

    let filteredRawNodes = data.nodes;
    if (filter !== 'ALL') {
      filteredRawNodes = data.nodes.filter((n) =>
        (n.node_type || '').toUpperCase().includes(filter)
      );
    }

    const validNodeIds = new Set(filteredRawNodes.map((n) => n.id));

    // Categorize into logical layers
    const layers: { [key: number]: AttackNode[] } = { 0: [], 1: [], 2: [], 3: [], 4: [] };

    filteredRawNodes.forEach((node) => {
      const t = (node.node_type || '').toUpperCase();
      if (t.includes('USER')) layers[0].push(node);
      else if (t.includes('IP') || t.includes('NETWORK')) layers[1].push(node);
      else if (t.includes('HOST') || t.includes('SERVER')) layers[2].push(node);
      else if (t.includes('EVENT') || t.includes('ACTION')) layers[3].push(node);
      else layers[4].push(node);
    });

    const flowNodes: Node[] = [];

    if (mode === 'HIERARCHICAL') {
      // Top to bottom layered architecture
      const layerY = [40, 180, 320, 460, 600];
      const colWidth = 270;

      Object.entries(layers).forEach(([layerStr, layerNodes]) => {
        const layerIdx = Number(layerStr);
        const count = layerNodes.length;
        if (count === 0) return;

        const totalWidth = count * colWidth;
        const startX = Math.max(40, 520 - totalWidth / 2);

        layerNodes.forEach((n, idx) => {
          const isCritical = data.attack_path_node_ids.includes(n.id);
          const isMatched = Boolean(
            search.trim() &&
              (n.label.toLowerCase().includes(search.toLowerCase()) ||
                (n.node_type || '').toLowerCase().includes(search.toLowerCase()))
          );

          flowNodes.push({
            id: n.id,
            type: 'cyberNode',
            position: { x: startX + idx * colWidth, y: layerY[layerIdx] },
            data: {
              id: n.id,
              label: n.label,
              nodeType: n.node_type,
              isCritical: showAttackPath && isCritical,
              isSelected: selectedNodeData?.id === n.id,
              isMatched,
              details: n.node_metadata || n.details || {},
              onSelect: handleSelectNode
            }
          });
        });
      });
    } else {
      // Left-to-Right Killchain progression
      const colX = [40, 310, 580, 850, 1120];
      const rowHeight = 160;

      Object.entries(layers).forEach(([layerStr, layerNodes]) => {
        const layerIdx = Number(layerStr);
        const count = layerNodes.length;
        if (count === 0) return;

        layerNodes.forEach((n, idx) => {
          const isCritical = data.attack_path_node_ids.includes(n.id);
          const isMatched = Boolean(
            search.trim() &&
              (n.label.toLowerCase().includes(search.toLowerCase()) ||
                (n.node_type || '').toLowerCase().includes(search.toLowerCase()))
          );

          flowNodes.push({
            id: n.id,
            type: 'cyberNode',
            position: { x: colX[layerIdx], y: 80 + idx * rowHeight },
            data: {
              id: n.id,
              label: n.label,
              nodeType: n.node_type,
              isCritical: showAttackPath && isCritical,
              isSelected: selectedNodeData?.id === n.id,
              isMatched,
              details: n.node_metadata || n.details || {},
              onSelect: handleSelectNode
            }
          });
        });
      });
    }

    // High-tech Animated Directed Edges
    const flowEdges: Edge[] = data.edges
      .filter((e) => validNodeIds.has(e.source_node_id) && validNodeIds.has(e.target_node_id))
      .map((e) => {
        const isCriticalEdge =
          showAttackPath &&
          data.attack_path_node_ids.includes(e.source_node_id) &&
          data.attack_path_node_ids.includes(e.target_node_id);

        return {
          id: e.id,
          source: e.source_node_id,
          target: e.target_node_id,
          type: 'smoothstep',
          label: `${e.relationship}${e.confidence ? ` (${e.confidence}%)` : ''}`,
          animated: isCriticalEdge,
          style: {
            stroke: isCriticalEdge ? '#ef4444' : '#3b82f6',
            strokeWidth: isCriticalEdge ? 2.5 : 1.5,
            opacity: showAttackPath && !isCriticalEdge ? 0.35 : 0.85
          },
          labelStyle: {
            fill: isCriticalEdge ? '#b91c1c' : '#1d4ed8',
            fontSize: 10,
            fontFamily: 'monospace',
            fontWeight: 700
          },
          labelBgStyle: {
            fill: '#ffffff',
            fillOpacity: 0.92,
            rx: 6,
            ry: 6,
            stroke: isCriticalEdge ? '#fecaca' : '#bfdbfe',
            strokeWidth: 1
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isCriticalEdge ? '#ef4444' : '#3b82f6',
            width: 18,
            height: 18
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
      applyLayout(graphData, nextState, filterType, layoutMode, searchQuery);
    }
  };

  const handleFilterChange = (newFilter: string) => {
    setFilterType(newFilter);
    if (graphData) {
      applyLayout(graphData, highlightPath, newFilter, layoutMode, searchQuery);
    }
  };

  const handleLayoutModeToggle = () => {
    const nextMode = layoutMode === 'HIERARCHICAL' ? 'FLOW' : 'HIERARCHICAL';
    setLayoutMode(nextMode);
    if (graphData) {
      applyLayout(graphData, highlightPath, filterType, nextMode, searchQuery);
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (graphData) {
      applyLayout(graphData, highlightPath, filterType, layoutMode, val);
    }
  };

  return (
    <div className="space-y-4 font-sans animate-fadeIn text-slate-800">
      {/* Control Toolbar - Clean Light Glassmorphic Header */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 shadow-xs">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Structured Attack Chain Graph
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 font-bold">
                POSTGRES GRAPH
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Interactive node-link topological reconstruction of attacker progression & blast radius
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search / Pinpoint node input */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-700 shadow-2xs">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
            <input
              type="text"
              placeholder="Find entity (e.g. rahul)..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="bg-transparent text-slate-900 text-xs focus:outline-none w-32 md:w-40"
            />
            {searchQuery && (
              <button onClick={() => handleSearchChange('')} className="text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Node Type Filters */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            {['ALL', 'USER', 'IP', 'HOST', 'RESOURCE'].map((f) => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                  filterType === f
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Orientation Toggle */}
          <button
            onClick={handleLayoutModeToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition-all"
            title="Switch between Top-to-Bottom and Left-to-Right layout"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
            {layoutMode === 'HIERARCHICAL' ? 'Top-Down' : 'Left-Right Flow'}
          </button>

          {/* Toggle Attack Path */}
          <button
            onClick={handleToggleAttackPath}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              highlightPath
                ? 'bg-red-50 text-red-700 border-red-200 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${highlightPath ? 'text-red-600 fill-current' : 'text-slate-400'}`} />
            {highlightPath ? 'Attack Path Active' : 'Show Attack Path'}
          </button>

          {/* Refresh */}
          <button
            onClick={loadGraph}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs shadow-2xs transition-colors"
            title="Reload Layout"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Legend & Killchain Progression Banner */}
      <div className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 font-medium shadow-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 font-semibold text-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-xs"></span> User Principal
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-xs"></span> Ingress / Egress IP
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-xs"></span> Host Server
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs"></span> Data Vault / DB
          </span>
          <span className="flex items-center gap-1.5 font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span> Critical Killchain Vector
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span>Click any node to inspect forensics metadata</span>
        </div>
      </div>

      {/* React Flow Canvas Container */}
      <div className="h-[620px] w-full rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden relative shadow-xs">
        {loading ? (
          <div className="flex h-full items-center justify-center text-slate-500 text-xs font-semibold gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            Reconstructing Attack Graph Topology...
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-right"
          >
            <Background color="#cbd5e1" gap={20} size={1.2} />
            <Controls className="!bg-white !border-slate-200 !text-slate-800 !shadow-sm !rounded-xl overflow-hidden" />
            <MiniMap
              nodeColor={(n: any) => {
                if (n.data?.isCritical) return '#ef4444';
                const t = (n.data?.nodeType || '').toUpperCase();
                if (t.includes('USER')) return '#0ea5e9';
                if (t.includes('IP')) return '#6366f1';
                if (t.includes('HOST')) return '#a855f7';
                return '#10b981';
              }}
              className="!bg-white !border-slate-200 !shadow-sm !rounded-xl overflow-hidden !m-4"
              zoomable
              pannable
            />
          </ReactFlow>
        )}

        {/* Selected Node Details Drawer / Popover */}
        <AnimatePresence>
          {selectedNodeData && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-4 right-4 z-30 w-80 rounded-2xl bg-white border border-slate-200 shadow-xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold text-slate-900 leading-tight">
                      {selectedNodeData.label}
                    </h4>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase font-bold">
                      {selectedNodeData.nodeType}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedNodeData(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Indicator */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium text-[11px]">Compromise Status:</span>
                  <span
                    className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded-full ${
                      selectedNodeData.isCritical
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {selectedNodeData.isCritical ? 'CRITICAL COMPROMISE' : 'CORRELATED ENTITY'}
                  </span>
                </div>
              </div>

              {/* Forensic Details List */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Entity Forensic Attributes
                </p>
                <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                  {selectedNodeData.details &&
                    Object.entries(selectedNodeData.details).map(([key, value], i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-50 border border-slate-100"
                      >
                        <span className="text-slate-500 font-mono text-[11px] capitalize">
                          {key.replace('_', ' ')}
                        </span>
                        <span className="text-slate-800 font-mono font-bold text-[11px] truncate max-w-[140px]">
                          {String(value)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => setSelectedNodeData(null)}
                  className="w-full py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Close Inspector
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AttackGraphView;
