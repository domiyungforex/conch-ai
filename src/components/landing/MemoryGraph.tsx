"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

type NodeCategory = "episodic" | "semantic" | "preference" | "procedural";

interface GraphNode {
  id: string;
  label: string;
  category: NodeCategory;
  x: number; // % left
  y: number; // % top
  connections: string[];
}

interface GraphEdge {
  from: string;
  to: string;
}

const nodes: GraphNode[] = [
  { id: "n1",  label: "Loves TypeScript",     category: "preference",  x: 14, y: 18, connections: ["n3", "n5"] },
  { id: "n2",  label: "Launched v2.0",        category: "episodic",    x: 70, y: 14, connections: ["n6"] },
  { id: "n3",  label: "JavaScript expert",    category: "semantic",    x: 36, y: 38, connections: ["n1", "n4", "n7"] },
  { id: "n4",  label: "Prefers dark mode",    category: "preference",  x: 56, y: 54, connections: ["n3", "n8"] },
  { id: "n5",  label: "Built Conch",          category: "episodic",    x: 19, y: 64, connections: ["n1", "n9"] },
  { id: "n6",  label: "Base chain user",      category: "semantic",    x: 82, y: 38, connections: ["n2", "n10"] },
  { id: "n7",  label: "Keyboard shortcuts",   category: "procedural",  x: 46, y: 76, connections: ["n3", "n11"] },
  { id: "n8",  label: "Minimal UI fan",       category: "preference",  x: 76, y: 68, connections: ["n4"] },
  { id: "n9",  label: "Startup founder",      category: "semantic",    x: 9,  y: 84, connections: ["n5"] },
  { id: "n10", label: "DeFi experience",      category: "episodic",    x: 88, y: 58, connections: ["n6"] },
  { id: "n11", label: "React developer",      category: "procedural",  x: 62, y: 88, connections: ["n7"] },
];

// Deduplicated edges
const edges: GraphEdge[] = [];
const seen = new Set<string>();
nodes.forEach((node) => {
  node.connections.forEach((targetId) => {
    const key = [node.id, targetId].sort().join("-");
    if (!seen.has(key)) {
      seen.add(key);
      edges.push({ from: node.id, to: targetId });
    }
  });
});

const categoryStyle: Record<NodeCategory, { border: string; bg: string; dot: string; text: string; activeStroke: string }> = {
  episodic:   { border: "border-coral-500/40", bg: "bg-coral-500/10", dot: "bg-coral-400",  text: "text-coral-300",  activeStroke: "rgba(156,95,18,0.6)" },
  semantic:   { border: "border-teal-500/40",   bg: "bg-teal-500/10",   dot: "bg-teal-400",    text: "text-teal-300",    activeStroke: "rgba(46,127,97,0.6)" },
  preference: { border: "border-amber-500/40",  bg: "bg-amber-500/10",  dot: "bg-amber-400",   text: "text-amber-300",   activeStroke: "rgba(245,158,11,0.6)" },
  procedural: { border: "border-emerald-500/40",bg: "bg-emerald-500/10",dot: "bg-emerald-400", text: "text-emerald-300", activeStroke: "rgba(16,185,129,0.6)" },
};

const legendItems: { category: NodeCategory; label: string }[] = [
  { category: "episodic",   label: "Episodic" },
  { category: "semantic",   label: "Semantic" },
  { category: "preference", label: "Preference" },
  { category: "procedural", label: "Procedural" },
];

function getNodeById(id: string) {
  return nodes.find((n) => n.id === id);
}

interface ContainerSize { w: number; h: number }

export function MemoryGraph() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState<ContainerSize>({ w: 800, h: 500 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setContainerSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isConnectedToSelected = useCallback(
    (nodeId: string) => {
      if (!selectedNode) return false;
      const sel = getNodeById(selectedNode);
      return sel?.connections.includes(nodeId) || getNodeById(nodeId)?.connections.includes(selectedNode);
    },
    [selectedNode]
  );

  const getNodeOpacity = (nodeId: string) => {
    if (!selectedNode) return 1;
    if (nodeId === selectedNode) return 1;
    if (isConnectedToSelected(nodeId)) return 1;
    return 0.2;
  };

  const getEdgeStroke = (edge: GraphEdge) => {
    if (!selectedNode) return "rgba(255,255,255,0.06)";
    if (edge.from === selectedNode || edge.to === selectedNode) {
      const selNode = getNodeById(selectedNode)!;
      return categoryStyle[selNode.category].activeStroke;
    }
    return "rgba(255,255,255,0.02)";
  };

  const nodeCoord = (node: GraphNode) => ({
    x: (node.x / 100) * containerSize.w,
    y: (node.y / 100) * containerSize.h,
  });

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7 }}
      className="py-24 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-coral-500/25 eyebrow text-coral-300/90 font-medium mb-4">
            Memory Graph
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-medium text-white mb-4">
            Your knowledge,{" "}
            <span className="gradient-text">visualized</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Conch maps your memories into a living knowledge graph — connected, searchable, and always growing.
            Click any node to explore its connections.
          </p>
        </div>

        {/* Graph container */}
        <div className="glass rounded-3xl border border-white/8 overflow-hidden" style={{ minHeight: 500 }}>
          <div ref={containerRef} className="relative" style={{ minHeight: 500 }}>
            {/* SVG connection layer */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={containerSize.w}
              height={containerSize.h}
            >
              {edges.map((edge) => {
                const from = getNodeById(edge.from);
                const to = getNodeById(edge.to);
                if (!from || !to) return null;
                const fc = nodeCoord(from);
                const tc = nodeCoord(to);
                const stroke = getEdgeStroke(edge);
                const isActive = selectedNode && (edge.from === selectedNode || edge.to === selectedNode);
                return (
                  <g key={`${edge.from}-${edge.to}`}>
                    <line
                      x1={fc.x} y1={fc.y}
                      x2={tc.x} y2={tc.y}
                      stroke={stroke}
                      strokeWidth={isActive ? 1.5 : 1}
                      style={{ transition: "stroke 0.3s ease, stroke-width 0.3s ease" }}
                    />
                    {isActive && (
                      <line
                        x1={fc.x} y1={fc.y}
                        x2={tc.x} y2={tc.y}
                        stroke={stroke}
                        strokeWidth="1"
                        className="neural-line"
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {nodes.map((node, i) => {
              const style = categoryStyle[node.category];
              const opacity = getNodeOpacity(node.id);
              const isSelected = selectedNode === node.id;

              return (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{ opacity, scale: 1 }}
                  transition={{
                    opacity: { duration: 0.25 },
                    scale: { delay: i * 0.055, type: "spring", stiffness: 180, damping: 18 },
                  }}
                  style={{
                    position: "absolute",
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  className="cursor-pointer z-10"
                  onClick={() => setSelectedNode(isSelected ? null : node.id)}
                >
                  {/* Float wrapper */}
                  <motion.div
                    animate={{ y: [0, -7, 0] }}
                    transition={{
                      duration: 3.5 + i * 0.28,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.35,
                    }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.08 }}
                      animate={{
                        boxShadow: isSelected
                          ? `0 0 28px ${style.activeStroke}`
                          : "none",
                      }}
                      transition={{ duration: 0.25 }}
                      className={`glass rounded-xl border px-3 py-2 ${style.border} ${style.bg} whitespace-nowrap`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
                        <p className={`text-[11px] font-semibold ${style.text}`}>{node.label}</p>
                      </div>
                    </motion.div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-5 mt-6">
          {legendItems.map(({ category, label }) => {
            const style = categoryStyle[category];
            return (
              <div key={category} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                <span className="text-xs text-slate-500">{label}</span>
              </div>
            );
          })}
          {selectedNode && (
            <button
              onClick={() => setSelectedNode(null)}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors ml-2 underline underline-offset-2"
            >
              Clear selection
            </button>
          )}
        </div>
      </div>
    </motion.section>
  );
}
