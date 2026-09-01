"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Brain,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
      if (m.relatedMemoryIds) {
        for (const rid of m.relatedMemoryIds) {
          if (nodeSet.has(rid)) edges.push({ source: m.$id, target: rid });
        }
      }
    }
  }

  if (contextRes?.ok) {
    const data = await contextRes.json();
    const contexts = data.context ?? [];
    for (const c of contexts.slice(0, 25)) {
      const typeMap: Record<string, GraphNode["type"]> = {
        memory: "memory", decision: "decision", constraint: "constraint",
        intent: "task", goal: "task", task_state: "task",
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

  if (agentsRes?.ok) {
    const data = await agentsRes.json();
    for (const a of data.agents ?? []) {
      if (!nodeSet.has(a.$id)) {
        nodes.push({
          id: a.$id, label: a.name ?? "Agent", type: "agent",
          importance: 0.8, x: 0, y: 0, vx: 0, vy: 0,
        });
        nodeSet.add(a.$id);
      }
    }
  }

  if (projectsRes?.ok) {
    const data = await projectsRes.json();
    for (const p of data.projects ?? []) {
      if (!nodeSet.has(p.$id)) {
        nodes.push({
          id: p.$id, label: p.name ?? "Project", type: "project",
          importance: 0.9, x: 0, y: 0, vx: 0, vy: 0,
        });
        nodeSet.add(p.$id);
      }
    }
  }

  return { nodes, edges };
}

// ── Theme colors from CSS variables ────────────────────────────────────────
function getThemeColors() {
  const style = getComputedStyle(document.documentElement);
  return {
    foreground: style.getPropertyValue("--color-foreground").trim() || "#e8e6f0",
    muted: style.getPropertyValue("--color-muted-foreground").trim() || "#8b87a0",
    border: style.getPropertyValue("--color-border").trim() || "rgba(139, 92, 246, 0.12)",
    background: style.getPropertyValue("--color-background").trim() || "#0a0a12",
    surface: style.getPropertyValue("--color-surface").trim() || "#111119",
    card: style.getPropertyValue("--color-card").trim() || "rgba(255, 255, 255, 0.04)",
  };
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
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const dragRef = useRef({
    startX: 0, startY: 0, startPanX: 0, startPanY: 0,
    isDragging: false, nodeId: null as string | null,
  });

  // ── ResizeObserver ──
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

  // ── Fetch + layout ──
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
        const layout = simulate(initialized, dimensions.width, dimensions.height, 200);
        setGraphData(layout);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) { setError(true); setLoading(false); }
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

    const colors = getThemeColors();
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    const visibleIds = new Set(graphData.nodes.map((n) => n.id));

    // Draw edges
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 0.8;
    ctx.globalAlpha = 0.5;
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
    ctx.globalAlpha = 1;

    // Draw nodes
    for (const node of graphData.nodes) {
      const r = getNodeRadius(node.type);
      const color = NODE_COLORS[node.type];
      const isSelected = selectedNode?.id === node.id;

      // Glow for selected
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 8, 0, Math.PI * 2);
        ctx.fillStyle = `${color}30`;
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = colors.foreground;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Labels — show based on zoom level and importance
      if (zoom > 0.6 || node.importance > 0.7 || isSelected) {
        ctx.fillStyle = colors.foreground;
        ctx.globalAlpha = isSelected ? 0.95 : 0.65;
        const fontSize = Math.max(8, Math.min(11, 10 / zoom));
        ctx.font = `500 ${fontSize}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        const label = node.label.length > 18 ? node.label.slice(0, 18) + "…" : node.label;
        ctx.fillText(label, node.x, node.y + r + 14 / zoom);
        ctx.globalAlpha = 1;
      }
    }

    ctx.restore();
  }, [graphData, dimensions, zoom, pan, selectedNode]);

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
        startX: e.clientX, startY: e.clientY,
        startPanX: pan.x, startPanY: pan.y,
        isDragging: false, nodeId: node?.id ?? null,
      };
      setSelectedNode(node);
    },
    [screenToGraph, graphData, pan]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.isDragging = true;
    if (drag.isDragging && !drag.nodeId) {
      setPan({ x: drag.startPanX + dx, y: drag.startPanY + dy });
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    dragRef.current.isDragging = false;
    dragRef.current.nodeId = null;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.max(0.2, Math.min(3, z * delta)));
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const isMobile = dimensions.width < 640;

  // ── Category type info ──
  const categoryLabels: Record<string, string> = useMemo(() => ({
    memory: "Memories", project: "Projects", decision: "Decisions",
    constraint: "Constraints", agent: "Agents", task: "Tasks",
  }), []);

  // ── Compute category stats for the legend ──
  const categoryStats = useMemo(() => {
    if (!graphData) return [];
    const counts = new Map<string, number>();
    for (const n of graphData.nodes) {
      counts.set(n.type, (counts.get(n.type) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([type, count]) => ({
      type, count, color: NODE_COLORS[type as GraphNode["type"]],
      label: categoryLabels[type] ?? type,
    }));
  }, [graphData, categoryLabels]);

  // ── Empty state ──
  if (!loading && graphData && graphData.nodes.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
          <Brain className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold chat-text-primary mb-2">Your memory graph will appear here.</h3>
        <p className="text-sm chat-text-muted max-w-md mb-6">
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
        <AlertCircle className="w-8 h-8 text-destructive mb-3" />
        <p className="text-sm chat-text-muted">Failed to load the memory graph.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative rounded-2xl overflow-hidden chat-code-bg",
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : "h-[350px] sm:h-[450px] md:h-[550px] lg:h-[600px]",
        className
      )}
    >
      {/* Loading */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="flex items-center gap-2 text-sm chat-text-muted">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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

      {/* ── Controls ──────────────────────────────────────────────── */}
      <div className={cn(
        "absolute flex items-center gap-1 z-10",
        isMobile ? "bottom-14 left-3" : "top-3 left-3"
      )}>
        <button onClick={() => setZoom((z) => Math.min(3, z * 1.3))} className="w-8 h-8 rounded-lg bg-surface/80 backdrop-blur-sm border border-border flex items-center justify-center chat-text-muted hover:text-foreground transition-colors" aria-label="Zoom in">
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setZoom((z) => Math.max(0.2, z * 0.7))} className="w-8 h-8 rounded-lg bg-surface/80 backdrop-blur-sm border border-border flex items-center justify-center chat-text-muted hover:text-foreground transition-colors" aria-label="Zoom out">
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button onClick={resetView} className="w-8 h-8 rounded-lg bg-surface/80 backdrop-blur-sm border border-border flex items-center justify-center chat-text-muted hover:text-foreground transition-colors" aria-label="Reset view">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setIsFullscreen(!isFullscreen)} className="w-8 h-8 rounded-lg bg-surface/80 backdrop-blur-sm border border-border flex items-center justify-center chat-text-muted hover:text-foreground transition-colors" aria-label="Toggle fullscreen">
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* ── Node count ─────────────────────────────────────────────── */}
      {graphData && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none z-10">
          <span className="text-[10px] chat-text-muted bg-surface/80 backdrop-blur-sm px-2.5 py-1 rounded-full border border-border">
            {graphData.nodes.length} nodes · {graphData.edges.length} connections
          </span>
        </div>
      )}

      {/* ── Selected node detail ───────────────────────────────────── */}
      {selectedNode && (
        <div className={cn(
          "absolute z-20",
          isMobile ? "bottom-14 left-3 right-3" : "top-14 right-3 w-72"
        )}>
          <div className="bg-surface/90 backdrop-blur-xl border border-border rounded-2xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: NODE_COLORS[selectedNode.type] }} />
                <span className="text-[10px] capitalize chat-text-muted font-medium">{categoryLabels[selectedNode.type] ?? selectedNode.type}</span>
              </div>
              <button onClick={() => setSelectedNode(null)} className="w-6 h-6 rounded-lg flex items-center justify-center chat-btn-ghost" aria-label="Close">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-sm chat-text-primary font-medium mb-1 leading-snug">{selectedNode.label}</p>
            <div className="flex items-center gap-3 text-[11px] chat-text-muted mb-2">
              <span>Importance: {Math.round(selectedNode.importance * 100)}%</span>
            </div>
            {graphData && (
              <div className="pt-3 border-t border-border">
                <p className="text-[10px] chat-text-muted uppercase tracking-wide mb-1.5">Connected to</p>
                <div className={cn("flex flex-wrap gap-1", !isMobile && "flex-col")}>
                  {graphData.edges
                    .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                    .slice(0, isMobile ? 6 : 8)
                    .map((e) => {
                      const otherId = e.source === selectedNode.id ? e.target : e.source;
                      const other = graphData.nodes.find((n) => n.id === otherId);
                      if (!other) return null;
                      return (
                        <button
                          key={otherId}
                          onClick={() => setSelectedNode(other)}
                          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-card-hover transition-colors"
                        >
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: NODE_COLORS[other.type] }} />
                          <span className="text-xs chat-text-primary truncate">{other.label}</span>
                          <span className="text-[10px] chat-text-muted ml-auto capitalize shrink-0">{other.type}</span>
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
      {!loading && graphData && graphData.nodes.length > 0 && (
        <div className={cn(
          "absolute pointer-events-none z-10",
          isMobile ? "bottom-3 left-3 right-3" : "bottom-3 left-3"
        )}>
          <div className={cn(
            "flex flex-wrap gap-2 bg-surface/80 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-border",
            isMobile && "justify-center"
          )}>
            {categoryStats.map(({ type, count, color, label }) => (
              <div key={type} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[10px] chat-text-muted capitalize">{label} ({count})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
