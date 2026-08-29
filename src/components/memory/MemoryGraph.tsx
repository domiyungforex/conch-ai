"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Search,
  Filter,
  X,
  Brain,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  type GraphNode,
  type GraphEdge,
  type GraphData,
  getNodeRadius,
  NODE_COLORS,
  initializePositions,
  simulate,
  hitTest,
} from "@/lib/graphLayout";

interface MemoryGraphProps {
  className?: string;
}

// ── Data Fetching ──────────────────────────────────────────────────────────

async function fetchGraphData(): Promise<GraphData> {
  const [memoriesRes, contextRes, agentsRes, projectsRes] = await Promise.all([
    fetch("/api/memory?limit=50").catch(() => null),
    fetch("/api/context?limit=30").catch(() => null),
    fetch("/api/agents").catch(() => null),
    fetch("/api/projects?limit=20").catch(() => null),
  ]);

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeSet = new Set<string>();

  // Memories
  if (memoriesRes?.ok) {
    const data = await memoriesRes.json();
    const memories = data.memories ?? [];
    for (const m of memories.slice(0, 40)) {
      if (!nodeSet.has(m.$id)) {
        nodes.push({
          id: m.$id,
          label: m.content?.slice(0, 40) ?? "Memory",
          type: "memory",
          importance: m.importance ?? 0.5,
          x: 0, y: 0, vx: 0, vy: 0,
        });
        nodeSet.add(m.$id);
      }
      // Link related memories
      if (m.relatedMemoryIds) {
        for (const rid of m.relatedMemoryIds) {
          if (nodeSet.has(rid)) {
            edges.push({ source: m.$id, target: rid });
          }
        }
      }
    }
  }

  // Context objects
  if (contextRes?.ok) {
    const data = await contextRes.json();
    const contexts = data.context ?? [];
    for (const c of contexts.slice(0, 25)) {
      const typeMap: Record<string, GraphNode["type"]> = {
        memory: "memory",
        decision: "decision",
        constraint: "constraint",
        intent: "task",
        goal: "task",
        task_state: "task",
      };
      const nodeType = typeMap[c.type] ?? "memory";
      if (!nodeSet.has(c.$id)) {
        nodes.push({
          id: c.$id,
          label: c.content?.slice(0, 40) ?? c.type,
          type: nodeType,
          importance: c.importance ?? 0.5,
          x: 0, y: 0, vx: 0, vy: 0,
        });
        nodeSet.add(c.$id);
      }
      if (c.projectId && nodeSet.has(c.projectId)) {
        edges.push({ source: c.$id, target: c.projectId });
      }
    }
  }

  // Agents
  if (agentsRes?.ok) {
    const data = await agentsRes.json();
    const agents = data.agents ?? [];
    for (const a of agents) {
      if (!nodeSet.has(a.$id)) {
        nodes.push({
          id: a.$id,
          label: a.name ?? "Agent",
          type: "agent",
          importance: 0.8,
          x: 0, y: 0, vx: 0, vy: 0,
        });
        nodeSet.add(a.$id);
      }
    }
  }

  // Projects
  if (projectsRes?.ok) {
    const data = await projectsRes.json();
    const projects = data.projects ?? [];
    for (const p of projects) {
      if (!nodeSet.has(p.$id)) {
        nodes.push({
          id: p.$id,
          label: p.name ?? "Project",
          type: "project",
          importance: 0.9,
          x: 0, y: 0, vx: 0, vy: 0,
        });
        nodeSet.add(p.$id);
      }
    }
  }

  return { nodes, edges };
}

// ── Main Component ─────────────────────────────────────────────────────────

export function MemoryGraph({ className }: MemoryGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const dragRef = useRef<{
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
    isDragging: boolean;
    nodeId: string | null;
  }>({ startX: 0, startY: 0, startPanX: 0, startPanY: 0, isDragging: false, nodeId: null });

  // ── ResizeObserver for responsive sizing ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height: Math.max(height, 300) });
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [isFullscreen]);

  // ── Fetch data ──
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    fetchGraphData()
      .then((data) => {
        if (cancelled) return;
        if (data.nodes.length === 0) {
          setGraphData(data);
          setLoading(false);
          return;
        }
        const initialized = initializePositions(data, dimensions.width, dimensions.height);
        const layout = simulate(initialized, dimensions.width, dimensions.height, 120);
        setGraphData(layout);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Canvas rendering ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !graphData) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    const filteredNodes = filter
      ? graphData.nodes.filter((n) => n.type === filter)
      : graphData.nodes;

    const searchLower = searchQuery.toLowerCase();
    const searchFiltered = searchQuery
      ? filteredNodes.filter((n) => n.label.toLowerCase().includes(searchLower))
      : filteredNodes;

    const visibleIds = new Set(searchFiltered.map((n) => n.id));

    // Draw edges
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    for (const edge of graphData.edges) {
      if (!visibleIds.has(edge.source) || !visibleIds.has(edge.target)) continue;
      const source = graphData.nodes.find((n) => n.id === edge.source);
      const target = graphData.nodes.find((n) => n.id === edge.target);
      if (!source || !target) continue;

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
    }

    // Draw nodes
    for (const node of searchFiltered) {
      const r = getNodeRadius(node.type);
      const color = NODE_COLORS[node.type];
      const isSelected = selectedNode?.id === node.id;

      // Glow for selected
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 6, 0, Math.PI * 2);
        ctx.fillStyle = `${color}33`;
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Label (only show if zoomed in or node is important)
      if (zoom > 0.7 || node.importance > 0.7) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.font = `${Math.max(9, 10 / zoom)}px system-ui`;
        ctx.textAlign = "center";
        ctx.fillText(
          node.label.length > 20 ? node.label.slice(0, 20) + "…" : node.label,
          node.x,
          node.y + r + 12 / zoom
        );
      }
    }

    ctx.restore();
  }, [graphData, dimensions, zoom, pan, selectedNode, filter, searchQuery]);

  // ── Mouse/touch handlers ──
  const screenToGraph = useCallback(
    (clientX: number, clientY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (clientX - rect.left - pan.x) / zoom,
        y: (clientY - rect.top - pan.y) / zoom,
      };
    },
    [zoom, pan]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const pos = screenToGraph(e.clientX, e.clientY);
      const node = graphData ? hitTest(graphData.nodes, pos.x, pos.y, 1) : null;

      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPanX: pan.x,
        startPanY: pan.y,
        isDragging: false,
        nodeId: node?.id ?? null,
      };

      if (node) {
        setSelectedNode(node);
      } else {
        setSelectedNode(null);
      }
    },
    [screenToGraph, graphData, pan]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        drag.isDragging = true;
      }

      if (drag.isDragging && !drag.nodeId) {
        setPan({
          x: drag.startPanX + dx,
          y: drag.startPanY + dy,
        });
      }
    },
    []
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current.isDragging = false;
    dragRef.current.nodeId = null;
  }, []);

  // ── Zoom with wheel ──
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.max(0.2, Math.min(3, z * delta)));
  }, []);

  // ── Controls ──
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // ── Mobile detection ──
  const isMobile = dimensions.width < 768;

  // ── Filter options ──
  const nodeTypes = useMemo(() => {
    if (!graphData) return [];
    const types = new Set(graphData.nodes.map((n) => n.type));
    return Array.from(types);
  }, [graphData]);

  // ── Empty state ──
  if (!loading && graphData && graphData.nodes.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
        <div className="w-16 h-16 rounded-2xl bg-coral-500/10 border border-coral-500/20 flex items-center justify-center mb-4">
          <Brain className="w-8 h-8 text-coral-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Your memory graph will appear here.</h3>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          As Conch learns your projects, decisions, memories, and relationships,
          this space will visualize how your context connects.
        </p>
        <Button asChild className="gap-2">
          <Link href="/chat">
            <MessageSquare className="w-4 h-4" /> Start a conversation
          </Link>
        </Button>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
        <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
        <p className="text-sm text-slate-400">Failed to load the memory graph.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative rounded-2xl overflow-hidden bg-white/[0.02] border border-white/8",
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : "h-[400px] sm:h-[500px] md:h-[600px]",
        className
      )}
    >
      {/* Loading */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="w-4 h-4 border-2 border-coral-500 border-t-transparent rounded-full animate-spin" />
            Building graph…
          </div>
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
      />

      {/* ── Mobile Bottom Controls ──────────────────────────────────── */}
      {isMobile ? (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 bg-white/10 backdrop-blur-sm"
                onClick={() => setZoom((z) => Math.min(3, z * 1.3))}
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 bg-white/10 backdrop-blur-sm"
                onClick={() => setZoom((z) => Math.max(0.2, z * 0.7))}
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 bg-white/10 backdrop-blur-sm"
                onClick={resetView}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 bg-white/10 backdrop-blur-sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>

          {/* Filter chips (horizontal scroll) */}
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 -mx-1 px-1">
            <button
              onClick={() => setFilter(null)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-medium shrink-0 transition-colors",
                !filter ? "bg-coral-600/30 text-coral-200" : "bg-white/5 text-slate-400"
              )}
            >
              All
            </button>
            {nodeTypes.map((type) => (
              <button
                key={type}
                onClick={() => setFilter(filter === type ? null : type)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-medium shrink-0 transition-colors capitalize",
                  filter === type ? "bg-coral-600/30 text-coral-200" : "bg-white/5 text-slate-400"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* ── Desktop Controls ──────────────────────────────────────── */
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-3 pointer-events-none">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 bg-black/40 backdrop-blur-sm border border-white/10"
              onClick={() => setZoom((z) => Math.min(3, z * 1.3))}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 bg-black/40 backdrop-blur-sm border border-white/10"
              onClick={() => setZoom((z) => Math.max(0.2, z * 0.7))}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 bg-black/40 backdrop-blur-sm border border-white/10"
              onClick={resetView}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>

            {/* Filter */}
            <div className="flex items-center gap-1 ml-2 bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg px-2 py-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={filter ?? ""}
                onChange={(e) => setFilter(e.target.value || null)}
                className="bg-transparent text-xs text-slate-300 outline-none cursor-pointer"
              >
                <option value="">All types</option>
                {nodeTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search nodes…"
                className="h-8 w-40 pl-7 pr-2 text-xs bg-black/40 backdrop-blur-sm border-white/10 text-white placeholder:text-slate-500"
              />
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 bg-black/40 backdrop-blur-sm border border-white/10"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      )}

      {/* ── Node count badge ─────────────────────────────────────────── */}
      {graphData && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
          <span className="text-[10px] text-slate-500 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
            {graphData.nodes.length} nodes · {graphData.edges.length} connections
          </span>
        </div>
      )}

      {/* ── Mobile Bottom Sheet (node details) ──────────────────────── */}
      {selectedNode && isMobile && (
        <div className="absolute bottom-20 left-3 right-3 z-20">
          <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: NODE_COLORS[selectedNode.type] }}
                />
                <Badge className="text-[10px] capitalize bg-white/10 text-slate-300 border-white/10">
                  {selectedNode.type}
                </Badge>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setSelectedNode(null)}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
            <p className="text-sm text-white font-medium mb-1">{selectedNode.label}</p>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span>Importance: {Math.round(selectedNode.importance * 100)}%</span>
            </div>
            {/* Related nodes */}
            {graphData && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">Connected to</p>
                <div className="flex flex-wrap gap-1">
                  {graphData.edges
                    .filter(
                      (e) =>
                        e.source === selectedNode.id || e.target === selectedNode.id
                    )
                    .slice(0, 6)
                    .map((e) => {
                      const otherId =
                        e.source === selectedNode.id ? e.target : e.source;
                      const other = graphData.nodes.find((n) => n.id === otherId);
                      if (!other) return null;
                      return (
                        <Badge
                          key={otherId}
                          className="text-[10px] bg-white/5 text-slate-400 border-white/10 cursor-pointer"
                          onClick={() => setSelectedNode(other)}
                        >
                          {other.label.slice(0, 20)}
                        </Badge>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Desktop Side Panel (node details) ─────────────────────── */}
      {selectedNode && !isMobile && (
        <div className="absolute top-14 right-3 w-72 z-20">
          <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: NODE_COLORS[selectedNode.type] }}
                />
                <Badge className="text-[10px] capitalize bg-white/10 text-slate-300 border-white/10">
                  {selectedNode.type}
                </Badge>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setSelectedNode(null)}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
            <p className="text-sm text-white font-medium mb-1">{selectedNode.label}</p>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-2">
              <span>Importance: {Math.round(selectedNode.importance * 100)}%</span>
            </div>
            {/* Related nodes */}
            {graphData && (
              <div className="pt-3 border-t border-white/10">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">Connected to</p>
                <div className="space-y-1">
                  {graphData.edges
                    .filter(
                      (e) =>
                        e.source === selectedNode.id || e.target === selectedNode.id
                    )
                    .slice(0, 8)
                    .map((e) => {
                      const otherId =
                        e.source === selectedNode.id ? e.target : e.source;
                      const other = graphData.nodes.find((n) => n.id === otherId);
                      if (!other) return null;
                      return (
                        <button
                          key={otherId}
                          onClick={() => setSelectedNode(other)}
                          className="flex items-center gap-2 w-full text-left p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: NODE_COLORS[other.type] }}
                          />
                          <span className="text-xs text-slate-300 truncate">
                            {other.label}
                          </span>
                          <span className="text-[10px] text-slate-600 ml-auto capitalize">
                            {other.type}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Legend ─────────────────────────────────────────────────── */}
      {!isMobile && !loading && graphData && graphData.nodes.length > 0 && (
        <div className="absolute bottom-3 left-3 pointer-events-none">
          <div className="flex flex-wrap gap-2 bg-black/40 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-white/10">
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[10px] text-slate-400 capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
