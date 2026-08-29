// Lightweight force-directed graph layout — no external dependencies.
// Runs a simple velocity Verlet simulation to position nodes.

export interface GraphNode {
  id: string;
  label: string;
  type: "memory" | "project" | "decision" | "constraint" | "agent" | "task";
  importance: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number; // fixed position (user dragging)
  fy?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  label?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const NODE_RADIUS: Record<GraphNode["type"], number> = {
  memory: 8,
  project: 12,
  decision: 10,
  constraint: 9,
  agent: 11,
  task: 7,
};

export function getNodeRadius(type: GraphNode["type"]): number {
  return NODE_RADIUS[type] ?? 8;
}

// Colors for each node type
export const NODE_COLORS: Record<GraphNode["type"], string> = {
  memory: "#c8891f",     // coral/gold
  project: "#6366f1",    // indigo
  decision: "#10b981",   // emerald
  constraint: "#ef4444", // red
  agent: "#8b5cf6",      // purple
  task: "#06b6d4",       // cyan
};

// Initialize random positions in a circle
export function initializePositions(data: GraphData, width: number, height: number): GraphData {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.35;

  const nodes = data.nodes.map((node, i) => {
    const angle = (i / data.nodes.length) * Math.PI * 2;
    return {
      ...node,
      x: cx + Math.cos(angle) * radius + (Math.random() - 0.5) * 40,
      y: cy + Math.sin(angle) * radius + (Math.random() - 0.5) * 40,
      vx: 0,
      vy: 0,
    };
  });

  return { nodes, edges: data.edges };
}

// Run force simulation for N iterations
export function simulate(
  data: GraphData,
  width: number,
  height: number,
  iterations: number = 150
): GraphData {
  const nodes = data.nodes.map((n) => ({ ...n }));
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const edges = data.edges;

  const repulsionForce = 800;
  const attractionForce = 0.005;
  const centerForce = 0.01;
  const damping = 0.9;
  const minDist = 30;

  for (let iter = 0; iter < iterations; iter++) {
    const temp = 1 - iter / iterations; // cooling

    // Repulsion between all pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) dist = minDist;

        const force = (repulsionForce * temp) / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (a.fx === undefined) { a.vx += fx; a.vy += fy; }
        if (b.fx === undefined) { b.vx -= fx; b.vy -= fy; }
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const a = nodeMap.get(edge.source);
      const b = nodeMap.get(edge.target);
      if (!a || !b) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) continue;

      const force = dist * attractionForce * temp;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (a.fx === undefined) { a.vx += fx; a.vy += fy; }
      if (b.fx === undefined) { b.vx -= fx; b.vy -= fy; }
    }

    // Center gravity
    for (const node of nodes) {
      if (node.fx !== undefined) continue;
      node.vx += (width / 2 - node.x) * centerForce;
      node.vy += (height / 2 - node.y) * centerForce;
    }

    // Apply velocities
    const padding = 40;
    for (const node of nodes) {
      if (node.fx !== undefined) {
        node.x = node.fx;
        node.y = node.fy!;
        node.vx = 0;
        node.vy = 0;
        continue;
      }

      node.vx *= damping;
      node.vy *= damping;
      node.x += node.vx;
      node.y += node.vy;

      // Bounds
      node.x = Math.max(padding, Math.min(width - padding, node.x));
      node.y = Math.max(padding, Math.min(height - padding, node.y));
    }
  }

  return { nodes, edges: data.edges };
}

// Hit test: find node at (x, y)
export function hitTest(
  nodes: GraphNode[],
  x: number,
  y: number,
  zoom: number = 1
): GraphNode | null {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    const r = getNodeRadius(node.type) * zoom;
    const dx = x - node.x;
    const dy = y - node.y;
    if (dx * dx + dy * dy <= (r + 4) * (r + 4)) {
      return node;
    }
  }
  return null;
}
