import React, { memo, useState, useMemo } from "react";
import {
  Server,
  RotateCcw,
  GitBranch,
  User,
  FileText,
  ShieldCheck,
  Search,
  Maximize2,
  Minimize2,
  ExternalLink,
  Layers,
} from "lucide-react";

export type RelationshipType = "Depends On" | "Consumes" | "Provides" | "Publishes" | "Subscribes";

export interface GraphNodeData {
  id: string;
  label: string;
  layer?: string;
  runtimeStatus?: string;
  replayStatus?: string;
  repository?: string;
  owner?: string;
  documentation?: string;
  evidence?: string | number;
  version?: string;
  x?: number;
  y?: number;
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  type: RelationshipType;
}

export interface CapabilityGraphVisualizerProps {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  onNodeClick?: (node: GraphNodeData) => void;
}

const RELATIONSHIP_COLORS: Record<RelationshipType, { stroke: string; badge: string }> = {
  "Depends On": { stroke: "#3b82f6", badge: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  Consumes: { stroke: "#06b6d4", badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  Provides: { stroke: "#10b981", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  Publishes: { stroke: "#f59e0b", badge: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  Subscribes: { stroke: "#a855f7", badge: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
};

export const CapabilityGraphVisualizer: React.FC<CapabilityGraphVisualizerProps> = memo(
  function CapabilityGraphVisualizer({ nodes, edges, onNodeClick }) {
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRelation, setSelectedRelation] = useState<string>("all");
    const [zoomLevel, setZoomLevel] = useState<number>(1);

    // Filtered nodes and edges
    const filteredNodes = useMemo(() => {
      if (!searchTerm.trim()) return nodes;
      const term = searchTerm.toLowerCase();
      return nodes.filter(
        (n) =>
          n.label.toLowerCase().includes(term) ||
          n.layer?.toLowerCase().includes(term) ||
          n.owner?.toLowerCase().includes(term) ||
          n.repository?.toLowerCase().includes(term)
      );
    }, [nodes, searchTerm]);

    const filteredEdges = useMemo(() => {
      if (selectedRelation === "all") return edges;
      return edges.filter((e) => e.type === selectedRelation);
    }, [edges, selectedRelation]);

    // Layout positions calculation
    const positionedNodes = useMemo(() => {
      const count = filteredNodes.length;
      if (count === 0) return [];
      const width = 800;
      const height = 400;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.38;

      return filteredNodes.map((node, index) => {
        if (node.x !== undefined && node.y !== undefined) return node;
        const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
        return {
          ...node,
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        };
      });
    }, [filteredNodes]);

    const nodePosMap = useMemo(() => {
      const map = new Map<string, { x: number; y: number }>();
      positionedNodes.forEach((n) => {
        if (n.x !== undefined && n.y !== undefined) map.set(n.id, { x: n.x, y: n.y });
      });
      return map;
    }, [positionedNodes]);

    const activeSelectedNode = useMemo(() => {
      if (!selectedNodeId) return positionedNodes[0] || null;
      return positionedNodes.find((n) => n.id === selectedNodeId) || positionedNodes[0] || null;
    }, [positionedNodes, selectedNodeId]);

    const activeNodeEdges = useMemo(() => {
      if (!activeSelectedNode) return [];
      return edges.filter(
        (e) => e.source === activeSelectedNode.id || e.target === activeSelectedNode.id
      );
    }, [edges, activeSelectedNode]);

    const handleSelectNode = (node: GraphNodeData) => {
      setSelectedNodeId(node.id);
      if (onNodeClick) onNodeClick(node);
    };

    return (
      <div className="flex flex-col gap-3 w-full h-full min-h-0">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <Search size={12} className="text-slate-500 ml-1" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search graph nodes, layers, owners..."
              className="w-full bg-transparent text-[11px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Filter Edge:</span>
            <select
              value={selectedRelation}
              onChange={(e) => setSelectedRelation(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono rounded px-1.5 py-0.5 focus:outline-none"
            >
              <option value="all">All Relationships ({edges.length})</option>
              <option value="Depends On">Depends On</option>
              <option value="Consumes">Consumes</option>
              <option value="Provides">Provides</option>
              <option value="Publishes">Publishes</option>
              <option value="Subscribes">Subscribes</option>
            </select>

            <button
              onClick={() => setZoomLevel((z) => (z >= 1.4 ? 1 : z + 0.2))}
              className="p-1 text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700 rounded transition-colors"
              title="Toggle Zoom"
            >
              {zoomLevel > 1 ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </button>
          </div>
        </div>

        {/* Graph SVG & Inspector Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
          {/* Interactive Graph Canvas Area */}
          <div className="lg:col-span-8 bg-slate-950/80 border border-slate-800 rounded-lg relative overflow-hidden flex flex-col justify-center items-center min-h-[360px]">
            {positionedNodes.length === 0 || edges.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Layers className="w-10 h-10 text-slate-700 mb-2 opacity-50" />
                <p className="text-xs font-mono font-medium text-slate-400">No Dependency Data Available</p>
                <span className="text-[10px] text-slate-600 mt-1">Backend API has not exposed active capability relationship edges</span>
              </div>
            ) : (
              <div
                className="w-full h-full relative transition-transform duration-300 origin-center"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <svg className="w-full h-full min-h-[360px] pointer-events-auto" viewBox="0 0 800 400">
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
                    </marker>
                  </defs>

                  {/* Relationship Edges */}
                  {filteredEdges.map((edge) => {
                    const src = nodePosMap.get(edge.source);
                    const tgt = nodePosMap.get(edge.target);
                    if (!src || !tgt) return null;

                    const color = RELATIONSHIP_COLORS[edge.type]?.stroke || "#64748b";
                    const isHighlighted =
                      activeSelectedNode &&
                      (edge.source === activeSelectedNode.id || edge.target === activeSelectedNode.id);

                    return (
                      <g key={edge.id}>
                        <line
                          x1={src.x}
                          y1={src.y}
                          x2={tgt.x}
                          y2={tgt.y}
                          stroke={color}
                          strokeWidth={isHighlighted ? 2.5 : 1.2}
                          strokeOpacity={isHighlighted ? 0.9 : 0.4}
                          strokeDasharray={edge.type === "Depends On" ? "4,4" : edge.type === "Subscribes" ? "2,2" : undefined}
                          markerEnd="url(#arrow)"
                        />
                        {/* Edge Label */}
                        <text
                          x={(src.x + tgt.x) / 2}
                          y={(src.y + tgt.y) / 2 - 4}
                          fill={color}
                          fontSize="8"
                          fontFamily="monospace"
                          textAnchor="middle"
                          opacity={isHighlighted ? 1 : 0.6}
                          className="select-none font-semibold"
                        >
                          {edge.type}
                        </text>
                      </g>
                    );
                  })}

                  {/* Capability Nodes */}
                  {positionedNodes.map((node) => {
                    const isSelected = activeSelectedNode?.id === node.id;
                    const isHealthy =
                      node.runtimeStatus === "healthy" ||
                      node.runtimeStatus === "operational" ||
                      node.runtimeStatus === "active";

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${node.x}, ${node.y})`}
                        onClick={() => handleSelectNode(node)}
                        className="cursor-pointer transition-transform hover:scale-105"
                      >
                        {/* Node Circle Backdrop */}
                        <circle
                          r={isSelected ? 22 : 18}
                          fill="#0f172a"
                          stroke={isSelected ? "#38bdf8" : isHealthy ? "#10b981" : "#f59e0b"}
                          strokeWidth={isSelected ? 3 : 1.5}
                          className="transition-all"
                        />
                        {/* Status Dot */}
                        <circle
                          cx={12}
                          cy={-12}
                          r={4}
                          fill={isHealthy ? "#10b981" : "#ef4444"}
                          stroke="#0f172a"
                          strokeWidth={1}
                        />
                        {/* Icon/Label */}
                        <text
                          y={3}
                          fill="#f8fafc"
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                          className="select-none"
                        >
                          {node.label.slice(0, 3).toUpperCase()}
                        </text>
                        {/* Label beneath node */}
                        <text
                          y={30}
                          fill={isSelected ? "#38bdf8" : "#94a3b8"}
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight={isSelected ? "bold" : "normal"}
                          textAnchor="middle"
                          className="select-none"
                        >
                          {node.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}

            {/* Legend Footer */}
            <div className="absolute bottom-2 left-2 flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded border border-slate-800 text-[9px] font-mono text-slate-400">
              <span className="font-bold text-slate-300">Edge Legend:</span>
              {(Object.keys(RELATIONSHIP_COLORS) as RelationshipType[]).map((rel) => (
                <span key={rel} className="flex items-center gap-1">
                  <span
                    className="w-2 h-0.5 rounded"
                    style={{ backgroundColor: RELATIONSHIP_COLORS[rel].stroke }}
                  />
                  {rel}
                </span>
              ))}
            </div>
          </div>

          {/* Node Inspector Detail Panel */}
          <div className="lg:col-span-4 bg-slate-900/70 border border-slate-800 rounded-lg p-3 flex flex-col justify-between gap-3">
            {activeSelectedNode ? (
              <div className="flex flex-col gap-2.5 h-full">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Server size={14} className="text-cyan-400" />
                    <span className="text-xs font-mono font-bold text-slate-100">
                      {activeSelectedNode.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                    {activeSelectedNode.layer || "Capability"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  {/* Runtime Status */}
                  <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                    <span className="text-[9px] text-slate-500 uppercase block">Runtime Status</span>
                    <span className="font-bold text-emerald-400 capitalize">
                      {activeSelectedNode.runtimeStatus || "healthy"}
                    </span>
                  </div>

                  {/* Replay Status */}
                  <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                    <span className="text-[9px] text-slate-500 uppercase block">Replay Status</span>
                    <span className="font-bold text-purple-400 flex items-center gap-1">
                      <RotateCcw size={10} />
                      {activeSelectedNode.replayStatus || "Available"}
                    </span>
                  </div>

                  {/* Repository */}
                  <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                    <span className="text-[9px] text-slate-500 uppercase block flex items-center gap-1">
                      <GitBranch size={9} /> Repository
                    </span>
                    <span className="text-slate-300 truncate block text-[10px]" title={activeSelectedNode.repository}>
                      {activeSelectedNode.repository || "shakti/core"}
                    </span>
                  </div>

                  {/* Owner */}
                  <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                    <span className="text-[9px] text-slate-500 uppercase block flex items-center gap-1">
                      <User size={9} /> Owner
                    </span>
                    <span className="text-slate-300 truncate block text-[10px]" title={activeSelectedNode.owner}>
                      {activeSelectedNode.owner || "Platform Team"}
                    </span>
                  </div>

                  {/* Evidence */}
                  <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                    <span className="text-[9px] text-slate-500 uppercase block flex items-center gap-1">
                      <FileText size={9} /> Evidence
                    </span>
                    <span className="font-bold text-blue-400">
                      {activeSelectedNode.evidence ?? "Available"}
                    </span>
                  </div>

                  {/* Version */}
                  <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                    <span className="text-[9px] text-slate-500 uppercase block flex items-center gap-1">
                      <ShieldCheck size={9} /> Version
                    </span>
                    <span className="font-bold text-slate-300">
                      {activeSelectedNode.version || "v2.0.0"}
                    </span>
                  </div>
                </div>

                {/* Documentation Link */}
                <div className="bg-slate-950/60 p-2 rounded border border-slate-800 text-[10px] font-mono flex justify-between items-center">
                  <span className="text-slate-400">Documentation:</span>
                  <a
                    href={activeSelectedNode.documentation || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    View Spec <ExternalLink size={9} />
                  </a>
                </div>

                {/* Connected Relationships Feed */}
                <div className="flex-1 flex flex-col min-h-0 pt-1">
                  <span className="text-[10px] font-mono uppercase font-semibold text-slate-400 mb-1 border-b border-slate-800 pb-1">
                    Connected Relationships ({activeNodeEdges.length})
                  </span>
                  <div className="space-y-1 overflow-y-auto max-h-[110px] custom-scrollbar pr-1">
                    {activeNodeEdges.length === 0 ? (
                      <p className="text-[10px] font-mono text-slate-500 text-center py-2">No active relationships</p>
                    ) : (
                      activeNodeEdges.map((e) => {
                        const targetNode = positionedNodes.find((n) => n.id === (e.source === activeSelectedNode.id ? e.target : e.source));
                        const relBadge = RELATIONSHIP_COLORS[e.type]?.badge || "bg-slate-800 text-slate-400";
                        return (
                          <div key={e.id} className="flex items-center justify-between p-1 rounded bg-slate-950/40 text-[10px] font-mono border border-slate-800/60">
                            <span className="text-slate-300 truncate max-w-[110px]">{targetNode?.label || e.target}</span>
                            <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${relBadge}`}>
                              {e.type}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                <Server className="w-8 h-8 text-slate-700 mb-2" />
                <p className="text-xs font-mono text-slate-400 font-medium">No Node Selected</p>
                <span className="text-[10px] text-slate-600 mt-0.5">Click any capability node in the graph to view details</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);
